import { ChevronRight, PackageSearch, RotateCcw } from "lucide-react";
import * as React from "react";
import { useSearchParams } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { useNfts } from "@/hooks/use-nfts";
import type { NftCategory, NftFilters, NftNetwork } from "@/types/nft";
import { CatalogSidebar } from "./components/catalog-sidebar";
import { CatalogTabsBar, type CatalogTab } from "./components/catalog-tabs-bar";
import { FeaturedBanners } from "./components/featured-banners";
import { HeroSection } from "./components/hero-section";
import { MintingJournalSection } from "./components/minting-journal-section";
import { NftCard } from "./components/nft-card";
import { NftGridSkeleton } from "./components/nft-grid-skeleton";

const PAGE_SIZE = 9;

export function HomePage() {
  const [searchParams] = useSearchParams();
  const urlSearch = searchParams.get("search") || searchParams.get("q") || "";

  const [filters, setFilters] = React.useState<NftFilters>({
    sortBy: "recent",
  });
  const [activeTab, setActiveTab] = React.useState<CatalogTab>("all");
  const [prevUrlSearch, setPrevUrlSearch] = React.useState(urlSearch);
  const [page, setPage] = React.useState(1);

  // Sincroniza e reseta página durante a renderização se a busca mudar
  if (urlSearch !== prevUrlSearch) {
    setPrevUrlSearch(urlSearch);
    setPage(1);
  }

  const activeFilters = React.useMemo<NftFilters>(
    () => ({
      ...filters,
      search: urlSearch.trim().length > 0 ? urlSearch.trim() : undefined,
    }),
    [filters, urlSearch],
  );

  const { data, isLoading, isError } = useNfts(activeFilters, page, PAGE_SIZE);

  // Featured NFT: primeiro item retornado ou fallback
  const featuredNft = data?.items[0];

  const handleSelectCategory = (category?: NftCategory) => {
    setFilters((prev) => ({
      ...prev,
      category,
    }));
    setPage(1);
  };

  const handleSelectNetwork = (network?: NftNetwork) => {
    setFilters((prev) => ({
      ...prev,
      network,
    }));
    setPage(1);
  };

  const handleApplyPriceRange = (minPrice: number, maxPrice: number) => {
    setFilters((prev) => ({
      ...prev,
      minPrice,
      maxPrice,
    }));
    setPage(1);
  };

  const handleTabChange = (tab: CatalogTab) => {
    setActiveTab(tab);
    setPage(1);

    if (tab === "all") {
      setFilters((prev) => ({
        ...prev,
        category: undefined,
        sortBy: "recent",
      }));
    } else if (tab === "recent") {
      setFilters((prev) => ({
        ...prev,
        sortBy: "recent",
      }));
    } else if (tab === "popular") {
      setFilters((prev) => ({
        ...prev,
        sortBy: "popular",
      }));
    }
  };

  const handleSortChange = (sortBy: NonNullable<NftFilters["sortBy"]>) => {
    setFilters((prev) => ({
      ...prev,
      sortBy,
    }));
    setPage(1);
  };

  const handleResetFilters = () => {
    setFilters({ sortBy: "recent" });
    setActiveTab("all");
    setPage(1);
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    const catalogElement = document.getElementById("catalog-section");
    if (catalogElement) {
      catalogElement.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const totalPagesCount = Math.max(4, data?.totalPages || 4);

  return (
    <div className="space-y-16 pb-12">
      {/* 1. Hero Section Oficial KURIO */}
      <HeroSection featuredNft={featuredNft} />

      {/* 2. Área Central do Catálogo (Grid de 12 Colunas) */}
      <section id="catalog-section" className="scroll-mt-24">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
          {/* Barra Lateral Esquerda (col-span-3) */}
          <div className="lg:col-span-3">
            <CatalogSidebar
              selectedCategory={filters.category as NftCategory | undefined}
              onSelectCategory={handleSelectCategory}
              selectedNetwork={filters.network}
              onSelectNetwork={handleSelectNetwork}
              onApplyPriceRange={handleApplyPriceRange}
            />
          </div>

          {/* Grelha do Catálogo à Direita (col-span-9) */}
          <div className="lg:col-span-9 space-y-6">
            {/* Barra de Abas e Seletor de Ordenação */}
            <CatalogTabsBar
              activeTab={activeTab}
              onTabChange={handleTabChange}
              sortBy={filters.sortBy || "recent"}
              onSortChange={handleSortChange}
            />

            {/* Estados de Renderização da Malha de NFTs */}
            {isLoading ? (
              <NftGridSkeleton count={PAGE_SIZE} />
            ) : isError ? (
              <div className="max-w-md mx-auto text-center py-16 space-y-4">
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
                  onClick={handleResetFilters}
                  variant="outline"
                  size="sm"
                  className="border-[#2A2421] text-neutral-300 hover:text-white"
                >
                  Tentar Novamente
                </Button>
              </div>
            ) : data?.items.length === 0 ? (
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
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {data?.items.map((nft) => (
                  <NftCard key={nft.id} nft={nft} />
                ))}
              </div>
            )}

            {/* Paginação Numerada fiel ao design: (1, 2, 3, 4, >) */}
            <div className="flex items-center justify-end gap-2 pt-6">
              {[1, 2, 3, 4].map((pageNum) => {
                const isCurrent = pageNum === page;
                return (
                  <button
                    key={pageNum}
                    type="button"
                    onClick={() => handlePageChange(pageNum)}
                    className={`size-8 rounded-md text-xs font-mono font-bold transition-colors cursor-pointer ${
                      isCurrent
                        ? "bg-[#D28A4C] text-[#0E0907]"
                        : "text-neutral-400 hover:text-white hover:bg-[#1C110C]"
                    }`}
                    aria-current={isCurrent ? "page" : undefined}
                  >
                    {pageNum}
                  </button>
                );
              })}

              <button
                type="button"
                onClick={() => handlePageChange(Math.min(totalPagesCount, page + 1))}
                disabled={page >= totalPagesCount}
                className="size-8 rounded-md text-neutral-400 hover:text-white hover:bg-[#1C110C] flex items-center justify-center transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                aria-label="Próxima página"
              >
                <ChevronRight className="size-4" />
              </button>
            </div>
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
