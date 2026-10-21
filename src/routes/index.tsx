/**
 * Rota inicial (/): catálogo de NFTs dirigido pelos search params da URL.
 *
 * - validateSearch: schema Zod (q, category, network, minPrice, maxPrice, tab, sort, page).
 * - loader: aquece o cache do TanStack Query sem bloquear a navegação, mantendo os
 *   skeletons da página como feedback de carregamento.
 */
import { createFileRoute } from "@tanstack/react-router";

import { nftsQueryOptions } from "@/hooks/use-nfts";
import { HomePage } from "@/pages/home";
import { HOME_PAGE_SIZE, homeSearchSchema, toNftFilters } from "@/pages/home/search";

export const Route = createFileRoute("/")({
  validateSearch: homeSearchSchema,
  loaderDeps: ({ search }) => search,
  loader: ({ context, deps }) => {
    void context.queryClient.prefetchQuery(
      nftsQueryOptions(toNftFilters(deps), deps.page ?? 1, HOME_PAGE_SIZE),
    );
  },
  component: HomePage,
});
