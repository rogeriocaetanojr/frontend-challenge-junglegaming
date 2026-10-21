import { ChevronDown } from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { NftFilters } from "@/types/nft";

export type CatalogTab = "all" | "recent" | "popular";

interface CatalogTabsBarProps {
  activeTab: CatalogTab;
  onTabChange: (tab: CatalogTab) => void;
  sortBy: NonNullable<NftFilters["sortBy"]>;
  onSortChange: (sortBy: NonNullable<NftFilters["sortBy"]>) => void;
}

const TABS: { id: CatalogTab; label: string; mobileLabel: string }[] = [
  { id: "all", label: "Todos os NFTs", mobileLabel: "Todos os NFTs" },
  { id: "recent", label: "Novos lançamentos", mobileLabel: "Lançamentos" },
  { id: "popular", label: "Em alta", mobileLabel: "Em alta" },
];

const SORT_LABELS: Record<NonNullable<NftFilters["sortBy"]>, string> = {
  recent: "Listados recentemente",
  popular: "Mais populares",
  "price-asc": "Menor preço",
  "price-desc": "Maior preço",
};

export function CatalogTabsBar({
  activeTab,
  onTabChange,
  sortBy,
  onSortChange,
}: CatalogTabsBarProps) {
  return (
    <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-[#3F2319]/70">
      {/* Abas à esquerda */}
      <div
        className="flex items-center justify-between md:justify-start gap-2 md:gap-8 w-full md:w-auto overflow-x-auto scrollbar-none font-mono"
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
              className={`pb-2.5 md:pb-3.5 text-xs md:text-base leading-none md:leading-normal transition-all relative cursor-pointer whitespace-nowrap inline-flex items-center justify-center shrink-0 ${
                isActive
                  ? "text-[#D28A4C] font-semibold md:font-bold"
                  : "text-[#F5F1EB] hover:text-[#D28A4C] font-normal"
              }`}
            >
              <span className="md:hidden">{tab.mobileLabel}</span>
              <span className="hidden md:inline">{tab.label}</span>
              {isActive && (
                <span className="absolute -bottom-px md:bottom-0 left-0 right-0 h-[2px] md:h-0.5 bg-[#D28A4C]" />
              )}
            </button>
          );
        })}
      </div>

      {/* Ações à direita (apenas desktop): Ordenação sem caixa (apenas título) */}
      <div className="hidden md:flex items-center gap-3 sm:gap-5 self-end sm:self-auto font-mono">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="inline-flex items-center gap-1.5 text-xs sm:text-sm text-[#F5F1EB] hover:text-[#D28A4C] transition-colors cursor-pointer select-none pb-3 sm:pb-3.5 pt-0 focus:outline-none"
              aria-label="Opções de ordenação"
            >
              <span className="text-[#F5F1EB]">Ordenar por:</span>
              <span className="font-medium text-[#F5F1EB]">{SORT_LABELS[sortBy]}</span>
              <ChevronDown className="size-3.5 text-[#F5F1EB] ml-0.5" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="w-52 bg-[#241612] border-[#3F2319] text-[#F5F1EB] font-mono shadow-xl rounded-lg"
          >
            {Object.entries(SORT_LABELS).map(([key, label]) => {
              const isSelected = sortBy === key;
              return (
                <DropdownMenuItem
                  key={key}
                  onClick={() => onSortChange(key as NonNullable<NftFilters["sortBy"]>)}
                  className={`cursor-pointer text-xs sm:text-sm ${
                    isSelected
                      ? "text-[#D28A4C] font-semibold bg-[#140D0A]"
                      : "text-[#F5F1EB]/80 hover:text-[#F5F1EB] hover:bg-[#2F1D15]"
                  }`}
                >
                  {label}
                </DropdownMenuItem>
              );
            })}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
