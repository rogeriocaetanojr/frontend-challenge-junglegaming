/**
 * Rota Inicial do Catálogo de NFTs (/ com TanStack Router).
 *
 * Configura:
 * - validateSearch: parsing e sanitização estrita via catalogSearchSchema / parseCatalogSearch.
 * - loader: pré-carregamento concorrente via queryClient.ensureQueryData(catalogListQueryOptions).
 * - component: CatalogPage.
 */
import { type AnyRoute, createFileRoute } from "@tanstack/react-router";

import { CatalogPage } from "@/features/catalog/CatalogPage";
import { catalogListQueryOptions } from "@/features/catalog/queries";
import { parseCatalogSearch } from "@/features/catalog/schemas";
import type { CatalogFilters } from "@/features/catalog/types";
import { queryClient as defaultQueryClient } from "@/lib/query-client";
import type { RouterContext } from "@/router";

declare module "@tanstack/react-router" {
  interface FileRoutesByPath {
    "/": {
      id: "/";
      path: "/";
      fullPath: "/";
      preLoaderRoute: typeof Route;
      parentRoute: AnyRoute;
    };
  }
}

function CatalogRouteComponent() {
  const search = Route.useSearch();
  return <CatalogPage searchParams={search} />;
}

export const Route = createFileRoute("/")({
  validateSearch: (search) => parseCatalogSearch(search),
  loaderDeps: ({ search }) => search,
  loader: async ({ context, deps }) => {
    const routerContext = context as unknown as Partial<RouterContext>;
    const queryClient = routerContext?.queryClient ?? defaultQueryClient;

    const searchTerm = deps.q ?? deps.search;
    const filters: CatalogFilters = {
      page: deps.page,
      limit: deps.limit,
      q: searchTerm,
      search: searchTerm,
      category: deps.category,
      priceMin: deps.minPrice !== undefined ? String(deps.minPrice) : undefined,
      priceMax: deps.maxPrice !== undefined ? String(deps.maxPrice) : undefined,
      sortBy: deps.sortBy,
      sortDirection: deps.sortDirection,
    };

    await queryClient.ensureQueryData(catalogListQueryOptions(filters));
  },
  component: CatalogRouteComponent,
});

export { router } from "@/router";
