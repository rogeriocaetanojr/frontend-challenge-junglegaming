/**
 * Hook de Mutação de Cadastro de Usuário (useRegister).
 *
 * Executa o cadastro via POST /api/auth/register.
 * No sucesso, realiza o auto-login imediato:
 * 1. Armazena a sessão emitida no sessionStore (setSession).
 * 2. Atualiza o cache da sessão global no TanStack Query (['session']).
 * 3. Notifica o barramento de eventos (authEventBus.emit('auth:login', ...)).
 * 4. Redireciona o usuário para o caminho seguro fornecido ou fallback '/'.
 */
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";

import type { RegisterInput, Session } from "@/contracts/identity";
import { authEventBus } from "@/lib/auth/events";
import { sanitizeReturnTo } from "@/lib/auth/return-to";
import { setSession } from "@/lib/auth/session-store";
import { http } from "@/lib/http";
import { queryKeys } from "@/lib/query/keys";

export interface UseRegisterOptions {
  /** `null` mantém o usuário na página atual (uso em modal). */
  redirectPath?: string | null;
  onSuccess?: (session: Session) => void;
  onError?: (error: unknown) => void;
}

export function useRegister(options?: UseRegisterOptions) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  return useMutation({
    mutationFn: async (input: RegisterInput): Promise<Session> => {
      const session = await http.post<Session>("/auth/register", input);
      return session;
    },
    onSuccess: (data) => {
      // 1. Persiste a sessão no storage versionado
      setSession({
        token: data.token,
        expiresAt: data.expiresAt,
        userId: data.user.id,
      });

      // 2. Atualiza imediatamente o cache de sessão
      queryClient.setQueryData(queryKeys.session(), data);

      // 3. Emite o evento de autenticação
      authEventBus.emit("auth:login", {
        userId: data.user.id,
        token: data.token,
      });

      if (options?.redirectPath === null) {
        options.onSuccess?.(data);
        return;
      }

      // 4. Redirecionamento seguro contra Open Redirects
      const safePath = sanitizeReturnTo(options?.redirectPath, "/");

      try {
        void navigate({ to: safePath as unknown as string });
      } catch {
        if (typeof window !== "undefined" && window.location) {
          window.location.assign(safePath);
        }
      }

      options?.onSuccess?.(data);
    },
    onError: (error) => {
      options?.onError?.(error);
    },
  });
}
