import { QueryClient } from "@tanstack/react-query";

import { ApiError } from "@/lib/http";

/**
 * Instância singleton do QueryClient configurada com políticas de cache,
 * invalidação e retries otimizadas para aplicações Web3 e marketplace.
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 30, // 30 segundos: adequado à volatilidade dos dados de mercado
      gcTime: 1000 * 60 * 5, // 5 minutos: tempo de retenção em cache inativo
      retry: (failureCount, error) => {
        // Evita retries desnecessários em erros determinísticos (não autenticado ou não encontrado)
        if (
          error instanceof ApiError &&
          (error.statusCode === 401 || error.statusCode === 404)
        ) {
          return false;
        }
        return failureCount < 1;
      },
      refetchOnWindowFocus: false, // Previne re-execuções indesejadas em alternância de abas locais
    },
    mutations: {
      retry: 0, // Mutações financeiras/Web3 não devem ser retentadas automaticamente
    },
  },
});
