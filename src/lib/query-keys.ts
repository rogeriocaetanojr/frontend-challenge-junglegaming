/**
 * Fábrica centralizada de chaves de busca (Query Keys) para o TanStack Query.
 * Garante previsibilidade na invalidação de cache, tipagem e deduplicação de requisições.
 */
export const queryKeys = {
  health: ["health"] as const,
  nfts: {
    all: ["nfts"] as const,
    lists: () => [...queryKeys.nfts.all, "list"] as const,
    list: (filters?: Record<string, unknown>) =>
      [...queryKeys.nfts.lists(), filters ?? {}] as const,
    details: () => [...queryKeys.nfts.all, "detail"] as const,
    detail: (id: string | number) => [...queryKeys.nfts.details(), String(id)] as const,
  },
  cart: {
    all: ["cart"] as const,
    state: () => [...queryKeys.cart.all, "state"] as const,
  },
  user: {
    all: ["user"] as const,
    profile: () => [...queryKeys.user.all, "profile"] as const,
    session: () => [...queryKeys.user.all, "session"] as const,
  },
} as const;
