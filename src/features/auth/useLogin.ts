/**
 * Hook de Mutação de Login (useLogin).
 *
 * Executa a autenticação via POST /api/auth/login.
 * No sucesso:
 * 1. Persiste a sessão no storage local seguro (setSession).
 * 2. Atualiza imediatamente o cache de sessão no TanStack Query (['session']).
 * 3. Notifica o barramento de eventos (authEventBus.emit('auth:login', ...)).
 * 4. Redireciona o usuário para o caminho seguro fornecido ou fallback '/'.
 */
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";

import type { Credentials, Session } from "@/contracts/identity";
import { authEventBus } from "@/lib/auth/events";
import { sanitizeReturnTo } from "@/lib/auth/return-to";
import { setSession } from "@/lib/auth/session-store";
import { http } from "@/lib/http";
import { queryKeys } from "@/lib/query/keys";

export interface UseLoginOptions {
  redirectPath?: string;
  onSuccess?: (session: Session) => void;
  onError?: (error: unknown) => void;
}

export function useLogin(options?: UseLoginOptions) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  return useMutation({
    mutationFn: async (credentials: Credentials): Promise<Session> => {
      const session = await http.post<Session>("/auth/login", credentials);
      return session;
    },
    onSuccess: (data) => {
      // 1. Armazena no storage versionado
      setSession({
        token: data.token,
        expiresAt: data.expiresAt,
        userId: data.user.id,
      });

      // 2. Atualiza imediatamente o cache da sessão global
      queryClient.setQueryData(queryKeys.session(), data);

      // 3. Emite evento para os listeners da aplicação
      authEventBus.emit("auth:login", {
        userId: data.user.id,
        token: data.token,
      });

      // 4. Redirecionamento seguro para evitar Open Redirects
      const safePath = sanitizeReturnTo(options?.redirectPath, "/");

      if (navigate) {
        try {
          void navigate({ to: safePath as unknown as string });
        } catch {
          if (typeof window !== "undefined") {
            window.location.assign(safePath);
          }
        }
      } else if (typeof window !== "undefined" && window.location) {
        window.location.assign(safePath);
      }

      options?.onSuccess?.(data);
    },
    onError: (error) => {
      options?.onError?.(error);
    },
  });
}
