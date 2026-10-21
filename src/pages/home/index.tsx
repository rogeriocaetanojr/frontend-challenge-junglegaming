import { PackageSearch, RotateCcw } from "lucide-react";
import * as React from "react";
import { getRouteApi } from "@tanstack/react-router";

import { Button } from "@/components/ui/button";
import { useNfts } from "@/hooks/use-nfts";
import type { NftCategory, NftNetwork } from "@/types/nft";
import { CatalogPagination } from "./components/catalog-pagination";
import { CatalogSidebar } from "./components/catalog-sidebar";
import { CatalogTabsBar, type CatalogTab } from "./components/catalog-tabs-bar";
import { FeaturedBanners } from "./components/featured-banners";
import { HeroSection } from "./components/hero-section";
import { MintingJournalSection } from "./components/minting-journal-section";
import { MobileExploreBar } from "./components/mobile-explore-bar";
import { NftCard } from "./components/nft-card";
import { NftGridSkeleton } from "./components/nft-grid-skeleton";
import {
  compactHomeSearch,
  DEFAULT_SORT,
  HOME_PAGE_SIZE,
  type HomeSearch,
  type HomeSort,
  toNftFilters,
} from "./search";

const route = getRouteApi("/");

/**
 * Página inicial: o estado do catálogo (busca, filtros, aba, ordenação e página)
 * vive exclusivamente nos search params da URL, sobrevivendo a refresh e ao histórico.
 */
export function HomePage() {
  const search = route.useSearch();
  const navigate = route.useNavigate();

  const page = search.page ?? 1;
  const sortBy = search.sort ?? DEFAULT_SORT;
  const activeTab: CatalogTab = search.tab ?? "all";

  const filters = React.useMemo(() => toNftFilters(search), [search]);
  const { data, isLoading, isError, refetch } = useNfts(filters, page, HOME_PAGE_SIZE);

  /** Aplica um patch aos search params; qualquer mudança de filtro reinicia a paginação. */
  const updateSearch = React.useCallback(
    (patch: Partial<HomeSearch>, options?: { replace?: boolean }) => {
      void navigate({
        search: (prev) => compactHomeSearch({ ...prev, page: 1, ...patch }),
        replace: options?.replace,
        resetScroll: false,
      });
    },
    [navigate],
  );

  const items = data?.items ?? [];
  const totalPages = data?.totalPages ?? 1;

  // Página fora do intervalo (ex.: URL editada): volta para a última página existente
  React.useEffect(() => {
    if (data && (data.totalPages ?? 0) > 0 && page > (data.totalPages ?? 0)) {
      updateSearch({ page: data.totalPages }, { replace: true });
    }
  }, [data, page, updateSearch]);

  // Featured NFT: primeiro item retornado ou fallback
  const featuredNft = items[0];

  const handleSelectCategory = (category?: NftCategory) => updateSearch({ category });

  const handleSelectNetwork = (network?: NftNetwork) => updateSearch({ network });

  const handleApplyPriceRange = (minPrice: number, maxPrice: number) =>
    updateSearch({ minPrice, maxPrice });

  const handleTabChange = (tab: CatalogTab) => {
    if (tab === "all") {
      updateSearch({ tab: undefined, category: undefined, sort: undefined });
    } else if (tab === "recent") {
      updateSearch({ tab, sort: undefined });
    } else {
      updateSearch({ tab, sort: "popular" });
    }
  };

  const handleSortChange = (nextSort: HomeSort) => updateSearch({ sort: nextSort });

  /** Limpa filtros, aba, ordenação e página, preservando apenas o termo de busca. */
  const handleResetFilters = () => {
    void navigate({ search: (prev) => ({ q: prev.q }), resetScroll: false });
  };

  const handlePageChange = (newPage: number) => {
    updateSearch({ page: newPage });
    const catalogElement = document.getElementById("catalog-section");
    if (catalogElement) {
      catalogElement.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <div className="space-y-16 max-md:space-y-5 pb-12">
      {/* 0. Busca e coleções (frame mobile) */}
      <MobileExploreBar
        query={search.q === undefined ? "" : String(search.q)}
        onQueryChange={(value) =>
          updateSearch({ q: value.trim() ? value : undefined }, { replace: true })
        }
        selectedCategory={search.category}
        onSelectCategory={handleSelectCategory}
      />

      {/* 1. Hero Section Oficial KURIO */}
      <HeroSection featuredNft={featuredNft} />

      {/* 2. Área Central do Catálogo (Grid de 12 Colunas) */}
      <section id="catalog-section" className="scroll-mt-24">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
          {/* Barra Lateral Esquerda (col-span-3) */}
          <div
            id="catalog-filters"
            className="lg:col-span-3 max-md:order-last scroll-mt-24"
          >
            <CatalogSidebar
              key={`${search.minPrice ?? ""}-${search.maxPrice ?? ""}`}
              selectedCategory={search.category}
              onSelectCategory={handleSelectCategory}
              selectedNetwork={search.network}
              onSelectNetwork={handleSelectNetwork}
              onApplyPriceRange={handleApplyPriceRange}
              appliedMinPrice={search.minPrice}
              appliedMaxPrice={search.maxPrice}
            />
          </div>

          {/* Grelha do Catálogo à Direita (col-span-9) */}
          <div className="lg:col-span-9 space-y-6">
            {/* Barra de Abas e Seletor de Ordenação */}
            <CatalogTabsBar
              activeTab={activeTab}
              onTabChange={handleTabChange}
              sortBy={sortBy}
              onSortChange={handleSortChange}
            />

            {/* Estados de Renderização da Malha de NFTs */}
            {isLoading ? (
              <NftGridSkeleton count={HOME_PAGE_SIZE} />
            ) : isError ? (
              <div role="alert" className="max-w-md mx-auto text-center py-16 space-y-4">
                <div className="size-16 mx-auto rounded-full bg-[#140D0A] border border-[#2A2421] flex items-center justify-center text-red-400">
                  <PackageSearch className="size-8" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-xl font-bold text-white">
                    Falha ao Carregar Catálogo
                  </h3>
                  <p className="text-sm text-neutral-400">
                    Houve um problema na comunicação com a API. Verifique a conexão com os
                    mocks.
                  </p>
                </div>
                <Button
                  onClick={() => void refetch()}
                  variant="outline"
                  size="sm"
                  className="border-[#2A2421] text-neutral-300 hover:text-white"
                >
                  Tentar Novamente
                </Button>
              </div>
            ) : items.length === 0 ? (
              /* Estado Vazio */
              <div className="max-w-md mx-auto text-center py-16 space-y-5 bg-[#140D0A] border border-[#2A2421] rounded-2xl p-8 shadow-xl">
                <div className="size-16 mx-auto rounded-full bg-[#1C110C] border border-[#2A2421] flex items-center justify-center text-neutral-400">
                  <PackageSearch className="size-8" />
                </div>
                <div className="space-y-1.5">
                  <h3 className="text-xl font-bold text-white">Nenhum NFT Encontrado</h3>
                  <p className="text-xs text-neutral-400">
                    Não encontramos nenhum ativo que corresponda aos filtros de coleção,
                    rede ou preço selecionados.
                  </p>
                </div>
                <Button
                  onClick={handleResetFilters}
                  size="sm"
                  className="bg-[#D28A4C] hover:bg-[#c47b3e] text-[#0E0907] font-semibold gap-2"
                >
                  <RotateCcw className="size-3.5" />
                  <span>Limpar Filtros & Ver Todos</span>
                </Button>
              </div>
            ) : (
              /* Malha de NFTs em 3 colunas no desktop */
              <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-6 max-md:gap-x-3 max-md:gap-y-5 max-md:pb-10 max-md:[&>*:nth-child(even)]:mt-8">
                {items.map((nft, index) => (
                  <NftCard key={nft.id} nft={nft} priority={index < 4} />
                ))}
              </div>
            )}

            {/* Paginação numerada derivada do total de páginas retornado pela API */}
            <CatalogPagination
              page={page}
              totalPages={totalPages}
              onPageChange={handlePageChange}
            />
          </div>
        </div>
      </section>

      {/* 3. Banners Promocionais Intermédios */}
      <FeaturedBanners />

      {/* 4. Seção "Diário da Cunhagem" com 4 Artigos */}
      <MintingJournalSection />
    </div>
  );
}
