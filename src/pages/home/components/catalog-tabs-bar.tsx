import type { NftFilters } from "@/types/nft";

export type CatalogTab = "all" | "recent" | "popular";

interface CatalogTabsBarProps {
  activeTab: CatalogTab;
  onTabChange: (tab: CatalogTab) => void;
  sortBy?: NonNullable<NftFilters["sortBy"]>;
  onSortChange?: (sortBy: NonNullable<NftFilters["sortBy"]>) => void;
}

const TABS: { id: CatalogTab; label: string; mobileLabel: string }[] = [
  { id: "all", label: "Todos os NFTs", mobileLabel: "Todos os NFTs" },
  { id: "recent", label: "Novos lançamentos", mobileLabel: "Lançamentos" },
  { id: "popular", label: "Em alta", mobileLabel: "Em alta" },
];

export function CatalogTabsBar({ activeTab, onTabChange }: CatalogTabsBarProps) {
  return (
    <div className="flex items-center border-b border-[#3F2319]/70 w-full">
      {/* Abas de filtro em texto distribuídas perfeitamente para caber na tela */}
      <div
        className="flex items-center justify-between sm:justify-start gap-2 sm:gap-8 w-full font-mono"
        role="tablist"
        aria-label="Filtros principais do catálogo"
      >
        {TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => onTabChange(tab.id)}
              className={`pb-2.5 sm:pb-3 text-xs sm:text-base leading-none transition-all relative cursor-pointer whitespace-nowrap inline-flex items-center justify-center shrink-0 ${
                isActive
                  ? "text-[#D28A4C] font-semibold"
                  : "text-[#F5F1EB] hover:text-[#D28A4C] font-normal"
              }`}
            >
              <span className="sm:hidden">{tab.mobileLabel}</span>
              <span className="hidden sm:inline">{tab.label}</span>
              {isActive && (
                <span className="absolute -bottom-px left-0 right-0 h-[2px] bg-[#D28A4C]" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
