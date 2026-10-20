/**
 * Página Principal do Catálogo de NFTs (CatalogPage).
 *
 * Integra visual e funcionalmente:
 * - Sincronização de busca e filtros com a URL via useCatalogSearch (TanStack Router).
 * - Consulta assíncrona com cache e keepPreviousData via useCatalog (TanStack Query v5).
 * - Campo de busca com debounce configurável (SearchInput).
 * - Filtros por categoria e faixa de preço em ETH (CatalogFilters).
 * - Barra de ferramentas com ordenação e limite de itens por página (CatalogToolbar).
 * - Grid responsivo com skeletons e tratamento de estados de erro/vazio (NftGrid).
 * - Controles de paginação semânticos e acessíveis WCAG 2.1 AA.
 */
import { useMemo } from "react";

import { cn } from "@/lib/utils";
import { CatalogFilters } from "./CatalogFilters";
import { CatalogPagination } from "./CatalogPagination";
import { CatalogToolbar } from "./CatalogToolbar";
import { NftGrid } from "./NftGrid";
import { useCatalog } from "./queries";
import { SearchInput } from "./SearchInput";
import type { CatalogFilters as CatalogFilterParams } from "./types";
import { useCatalogSearch } from "./useCatalogSearch";

export interface CatalogPageProps {
  className?: string;
  searchParams?: Record<string, unknown>;
}

export function CatalogPage({
  className,
  searchParams: searchParamsProp,
}: CatalogPageProps) {
  const {
    q,
    category,
    minPrice,
    maxPrice,
    sortBy,
    sortDirection,
    sort,
    page,
    limit,
    setSearch,
    setCategory,
    setPriceRange,
    setSort,
    setPage,
    setLimit,
    resetFilters,
  } = useCatalogSearch(searchParamsProp ? { search: searchParamsProp } : undefined);

  // Mapeia parâmetros da URL para os filtros da query garantindo reatividade imediata do sort
  const queryFilters = useMemo<CatalogFilterParams>(() => {
    const resolvedSort =
      sort ??
      (sortBy === "price"
        ? sortDirection === "asc"
          ? "price_asc"
          : "price_desc"
        : sortBy === "createdAt"
          ? "recent"
          : sortBy);

    return {
      page,
      limit,
      q,
      search: q,
      category,
      priceMin: minPrice !== undefined ? String(minPrice) : undefined,
      priceMax: maxPrice !== undefined ? String(maxPrice) : undefined,
      sortBy,
      sortDirection,
      sort: resolvedSort,
    };
  }, [page, limit, q, category, minPrice, maxPrice, sortBy, sortDirection, sort]);

  const { data, isLoading, error, refetch } = useCatalog(queryFilters);

  const totalPages = data?.totalPages ?? 1;

  return (
    <div
      id="catalog-section"
      data-testid="catalog-page"
      className={cn("container mx-auto px-4 py-8 space-y-8 scroll-mt-24", className)}
    >
      {/* Cabeçalho da Seção */}
      <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
            Catálogo de NFTs
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Explore ativos digitais exclusivos do ecossistema Jungle.
          </p>
        </div>

        {/* Campo de Busca Principal */}
        <div className="w-full md:w-80">
          <SearchInput
            id="catalog-search-input"
            value={q ?? ""}
            onChange={setSearch}
            placeholder="Buscar por nome, coleção..."
            className="w-full"
          />
        </div>
      </header>

      {/* Disposição em 2 Colunas: Barra Lateral de Filtros e Conteúdo do Catálogo */}
      <div className="grid grid-cols-1 gap-8 items-start lg:grid-cols-4">
        {/* Painel de Filtros à Esquerda */}
        <aside aria-label="Filtros do Catálogo" className="lg:col-span-1">
          <div className="sticky top-24 rounded-xl border border-border/40 bg-card p-5 shadow-sm">
            <h2 className="mb-4 text-base font-semibold text-card-foreground">Filtros</h2>
            <CatalogFilters
              selectedCategory={category}
              onSelectCategory={setCategory}
              priceMin={minPrice}
              priceMax={maxPrice}
              onPriceChange={setPriceRange}
              onReset={resetFilters}
            />
          </div>
        </aside>

        {/* Seção Principal de Produtos */}
        <section aria-label="Listagem de NFTs" className="space-y-6 lg:col-span-3">
          {/* Barra de Ferramentas: Ordenação, Limite e Totalizador */}
          <CatalogToolbar
            sortBy={sortBy}
            sortDirection={sortDirection}
            onSortChange={({ sortBy: newSortBy, sortDirection: newSortDirection }) =>
              setSort(newSortBy, newSortDirection)
            }
            limit={limit}
            onLimitChange={setLimit}
            totalItems={data?.total}
          />

          {/* Grid de NFTs com Skeletons, Error State e Empty State */}
          <NftGrid
            items={data?.items}
            isLoading={isLoading}
            error={error}
            onRetry={() => {
              void refetch();
            }}
            onClearFilters={resetFilters}
          />

          {/* Paginação Acessível */}
          {!isLoading && !error && (
            <CatalogPagination
              currentPage={page}
              totalPages={totalPages}
              onPageChange={(newPage) => {
                setPage(newPage);
                const section = document.getElementById("catalog-section");
                if (section) {
                  section.scrollIntoView({ behavior: "smooth", block: "start" });
                }
              }}
            />
          )}
        </section>
      </div>
    </div>
  );
}
