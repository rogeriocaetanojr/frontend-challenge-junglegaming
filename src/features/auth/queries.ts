/**
 * Opções de Consulta (Query Options) do TanStack Query para Autenticação e Sessão.
 *
 * Configurações:
 * - staleTime: 5 minutos (5 * 60_000 ms)
 * - gcTime: 10 minutos (10 * 60_000 ms)
 * - retry: false em caso de 401/unauthorized (sem tentativas repetidas desnecessárias)
 */
import { queryOptions } from "@tanstack/react-query";

import type { Session } from "@/contracts/identity";
import { ApiError, http } from "@/lib/http";
import { queryKeys } from "@/lib/query/keys";

export const SESSION_STALE_TIME = 5 * 60_000;
export const SESSION_GC_TIME = 10 * 60_000;

export function sessionQueryOptions() {
  return queryOptions<Session | null>({
    queryKey: queryKeys.session(),
    queryFn: async () => {
      try {
        const response = await http.get<Session>("/auth/session");
        return response;
      } catch (err: unknown) {
        if (err instanceof ApiError && err.statusCode === 401) {
          // 401 indica usuário anônimo/deslogado, resolvendo como null de forma segura
          return null;
        }
        throw err;
      }
    },
    staleTime: SESSION_STALE_TIME,
    gcTime: SESSION_GC_TIME,
    retry: (failureCount, error) => {
      if (error instanceof ApiError && error.statusCode === 401) {
        return false;
      }
      return failureCount < 2;
    },
  });
}
