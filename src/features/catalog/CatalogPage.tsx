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
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useMemo } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { CatalogFilters } from "./CatalogFilters";
import { CatalogToolbar } from "./CatalogToolbar";
import { NftGrid } from "./NftGrid";
import { useCatalog } from "./queries";
import { SearchInput } from "./SearchInput";
import type { CatalogFilters as CatalogFilterParams } from "./types";
import { useCatalogSearch } from "./useCatalogSearch";

export interface CatalogPageProps {
  className?: string;
}

export function CatalogPage({ className }: CatalogPageProps) {
  const {
    q,
    category,
    minPrice,
    maxPrice,
    sortBy,
    sortDirection,
    page,
    limit,
    setSearch,
    setCategory,
    setPriceRange,
    setSort,
    setPage,
    setLimit,
    resetFilters,
  } = useCatalogSearch();

  // Mapeia parâmetros da URL para os filtros da query
  const queryFilters = useMemo<CatalogFilterParams>(
    () => ({
      page,
      limit,
      q,
      search: q,
      category,
      priceMin: minPrice !== undefined ? String(minPrice) : undefined,
      priceMax: maxPrice !== undefined ? String(maxPrice) : undefined,
      sortBy,
      sortDirection,
    }),
    [page, limit, q, category, minPrice, maxPrice, sortBy, sortDirection],
  );

  const { data, isLoading, error, refetch } = useCatalog(queryFilters);

  const totalPages = data?.totalPages ?? 1;

  // Gera páginas para os botões de navegação numérica
  const pageNumbers = useMemo(() => {
    const pages: number[] = [];
    const windowSize = 5;
    let start = Math.max(1, page - Math.floor(windowSize / 2));
    const end = Math.min(totalPages, start + windowSize - 1);

    if (end - start + 1 < windowSize) {
      start = Math.max(1, end - windowSize + 1);
    }

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    return pages;
  }, [page, totalPages]);

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
          {!isLoading && !error && totalPages > 1 && (
            <nav
              aria-label="Paginação do catálogo"
              data-testid="catalog-pagination"
              className="flex flex-wrap items-center justify-center gap-2 pt-6"
            >
              <Button
                variant="outline"
                size="sm"
                data-testid="pagination-prev"
                onClick={() => setPage(page - 1)}
                disabled={page <= 1}
                aria-label="Ir para a página anterior"
                className="gap-1 cursor-pointer"
              >
                <ChevronLeft className="h-4 w-4" aria-hidden="true" />
                <span className="hidden sm:inline">Anterior</span>
              </Button>

              <div className="flex items-center gap-1">
                {pageNumbers.map((p) => {
                  const isCurrent = p === page;
                  return (
                    <Button
                      key={p}
                      variant={isCurrent ? "default" : "outline"}
                      size="sm"
                      data-testid={`pagination-page-${p}`}
                      onClick={() => setPage(p)}
                      aria-current={isCurrent ? "page" : undefined}
                      aria-label={`Página ${p}`}
                      className={cn(
                        "h-8 min-w-8 px-2 cursor-pointer text-xs font-medium sm:text-sm",
                        isCurrent && "pointer-events-none",
                      )}
                    >
                      {p}
                    </Button>
                  );
                })}
              </div>

              <Button
                variant="outline"
                size="sm"
                data-testid="pagination-next"
                onClick={() => setPage(page + 1)}
                disabled={page >= totalPages}
                aria-label="Ir para a próxima página"
                className="gap-1 cursor-pointer"
              >
                <span className="hidden sm:inline">Próxima</span>
                <ChevronRight className="h-4 w-4" aria-hidden="true" />
              </Button>
            </nav>
          )}
        </section>
      </div>
    </div>
  );
}
