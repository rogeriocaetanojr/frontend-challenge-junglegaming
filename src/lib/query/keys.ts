/**
 * Fábrica centralizada e tipada de chaves de consulta (Query Keys) para TanStack Query.
 *
 * REGRAS ARQUITETURAIS MANDATÓRIAS:
 * 1. Chave de sessão global: padronizada como ['session'].
 * 2. Chaves públicas: DEVEM obrigatoriamente iniciar com ['public', ...].
 * 3. REGRA ELIMINATÓRIA: Chaves de dados privados de usuário DEVEM obrigatoriamente
 *    iniciar com ['user', userId, ...], garantindo isolamento total de cache entre contas.
 */

export const queryKeys = {
  /** Chave de sessão global do usuário */
  session: () => ["session"] as const,

  /** Chaves de catálogo */
  catalog: {
    all: ["public", "catalog"] as const,
    list: (filters?: Record<string, unknown>) =>
      ["public", "catalog", "list", filters ?? {}] as const,
    detail: (id: string | number) => ["public", "catalog", "detail", String(id)] as const,
  },

  /** Chaves de dados públicos e compartilhados */
  public: {
    all: ["public"] as const,
    catalog: {
      all: () => ["public", "catalog"] as const,
      lists: () => ["public", "catalog", "lists"] as const,
      list: (filters?: Record<string, unknown>) =>
        ["public", "catalog", "lists", filters ?? {}] as const,
      details: () => ["public", "catalog", "details"] as const,
      detail: (id: string | number) =>
        ["public", "catalog", "details", String(id)] as const,
      facets: () => ["public", "catalog", "facets"] as const,
    },
    health: () => ["public", "health"] as const,
  },

  /**
   * REGRA ELIMINATÓRIA:
   * Chaves de dados privados de usuário DEVEM obrigatoriamente iniciar com ['user', userId, ...].
   */
  user: (userId: string) => {
    if (!userId || typeof userId !== "string" || !userId.trim()) {
      throw new Error("A fábrica de chaves privadas exige um userId válido não-vazio.");
    }

    const trimmedId = userId.trim();

    return {
      all: () => ["user", trimmedId] as const,
      profile: () => ["user", trimmedId, "profile"] as const,
      wallets: {
        all: () => ["user", trimmedId, "wallets"] as const,
        list: () => ["user", trimmedId, "wallets", "list"] as const,
        detail: (walletId: string) =>
          ["user", trimmedId, "wallets", "detail", String(walletId)] as const,
      },
      orders: {
        all: () => ["user", trimmedId, "orders"] as const,
        lists: () => ["user", trimmedId, "orders", "lists"] as const,
        list: (filters?: Record<string, unknown>) =>
          ["user", trimmedId, "orders", "lists", filters ?? {}] as const,
        detail: (orderId: string) =>
          ["user", trimmedId, "orders", "detail", String(orderId)] as const,
      },
      cart: () => ["user", trimmedId, "cart"] as const,
      favorites: () => ["user", trimmedId, "favorites"] as const,
      activities: () => ["user", trimmedId, "activities"] as const,
    } as const;
  },

  /**
   * Retrocompatibilidade com hooks existentes da camada de catálogo
   */
  nfts: {
    all: ["public", "catalog"] as const,
    lists: () => ["public", "catalog", "lists"] as const,
    list: (filters?: Record<string, unknown>) =>
      ["public", "catalog", "lists", filters ?? {}] as const,
    details: () => ["public", "catalog", "details"] as const,
    detail: (id: string | number) =>
      ["public", "catalog", "details", String(id)] as const,
  },
} as const;
