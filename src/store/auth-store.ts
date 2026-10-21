import { create } from "zustand";

import type { Session, User } from "@/contracts/identity";
import { sessionQueryOptions } from "@/features/auth/queries";
import { authEventBus } from "@/lib/auth/events";
import { clearSession, hasValidSession } from "@/lib/auth/session-store";
import { http } from "@/lib/http";
import { queryClient } from "@/lib/query-client";
import { queryKeys } from "@/lib/query/keys";

export interface AuthStore {
  user: User | null;
  isAuthenticated: boolean;
  /** Espelha a sessão retornada pela API (login, cadastro ou consulta de sessão). */
  syncSession: (session: Session | null) => void;
  /** Atualização local dos dados exibidos do usuário autenticado. */
  updateUser: (patch: Partial<User>) => void;
  /** Encerra a sessão, revoga o token na API e limpa todo o cache privado. */
  logout: () => void;
}

/**
 * Store de autenticação derivada da API: só fica autenticada após uma sessão real
 * (resposta de sucesso de /auth/login, /auth/register ou /auth/session).
 */
export const useAuthStore = create<AuthStore>()((set, get) => ({
  user: null,
  isAuthenticated: false,

  syncSession: (session) => {
    set({ user: session?.user ?? null, isAuthenticated: Boolean(session?.user) });
  },

  updateUser: (patch) => {
    const current = get().user;
    if (current) {
      set({ user: { ...current, ...patch } });
    }
  },

  logout: () => {
    if (hasValidSession()) {
      // Melhor esforço: o token precisa ser enviado antes de ser removido do storage
      void http.post("/auth/logout").catch(() => undefined);
    }
    clearSession();
    set({ user: null, isAuthenticated: false });
    authEventBus.emit("auth:logout", { reason: "manual" });
    queryClient.clear();
  },
}));

// Qualquer escrita no cache da sessão (useLogin, useRegister, guarda de rota, 401) atualiza a store
queryClient.getQueryCache().subscribe((event) => {
  if (
    event.type === "updated" &&
    event.action.type === "success" &&
    JSON.stringify(event.query.queryKey) === JSON.stringify(queryKeys.session())
  ) {
    useAuthStore
      .getState()
      .syncSession((event.query.state.data as Session | null) ?? null);
  }
});

/**
 * Recupera a sessão após refresh a partir do token persistido.
 * Deve ser chamada depois que a camada de rede (MSW em demonstração) estiver ativa.
 */
export async function hydrateAuthSession(): Promise<void> {
  if (hasValidSession()) {
    await queryClient.prefetchQuery(sessionQueryOptions());
  }
}

if (typeof window !== "undefined") {
  window.addEventListener("http:unauthorized", () => {
    useAuthStore.getState().logout();
  });
}
