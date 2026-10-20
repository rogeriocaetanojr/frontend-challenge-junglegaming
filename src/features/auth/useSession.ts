/**
 * Hook de Sessão de Autenticação (useSession).
 *
 * Encapsula a consulta de sessão via TanStack Query e retorna os dados
 * normalizados de sessão, usuário e status de autenticação.
 */
import { useQuery } from "@tanstack/react-query";

import type { Session, User } from "@/contracts/identity";

import { sessionQueryOptions } from "./queries";

export interface UseSessionReturn {
  user: User | null;
  session: Session | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<unknown>;
}

export function useSession(): UseSessionReturn {
  const {
    data: session = null,
    isLoading,
    error,
    refetch,
  } = useQuery(sessionQueryOptions());

  const user = session?.user ?? null;
  const isAuthenticated = Boolean(session && user);

  return {
    user,
    session,
    isAuthenticated,
    isLoading,
    error: (error as Error | null) ?? null,
    refetch,
  };
}
