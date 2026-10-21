import { Search, SlidersHorizontal } from "lucide-react";

import type { NftCategory } from "@/types/nft";
import { COLLECTIONS } from "../collections";

interface MobileExploreBarProps {
  query: string;
  onQueryChange: (value: string) => void;
  selectedCategory?: NftCategory;
  onSelectCategory: (category?: NftCategory) => void;
}

/** Frame mobile do Início: campo "Explorar coleções", atalho de filtros e pílulas de coleção. */
export function MobileExploreBar({
  query,
  onQueryChange,
  selectedCategory,
  onSelectCategory,
}: MobileExploreBarProps) {
  const pills = [{ id: undefined, name: "Todas" }, ...COLLECTIONS];

  const scrollToFilters = () => {
    document.getElementById("catalog-filters")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="md:hidden pt-4 pb-1 font-mono">
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search
            className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-[#D28A4C]"
            aria-hidden="true"
          />
          <input
            type="text"
            inputMode="search"
            enterKeyHint="search"
            aria-label="Explorar coleções"
            placeholder="Explorar coleções"
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
            autoComplete="off"
            className="w-full h-11 rounded-xl bg-[#20140F] border border-[#2E1A13] pl-10 pr-3 text-sm text-[#F5F1EB] placeholder:text-[#A9703F] focus:border-[#D28A4C] focus:outline-none transition-colors"
          />
        </div>
        <button
          type="button"
          onClick={scrollToFilters}
          aria-label="Abrir filtros do catálogo"
          className="size-11 shrink-0 rounded-xl bg-[#D28A4C] hover:bg-[#c47b3e] text-[#0E0907] flex items-center justify-center cursor-pointer transition-colors"
        >
          <SlidersHorizontal className="size-4 stroke-[2.2]" />
        </button>
      </div>

      {/* Opções de coleções preservadas no DOM com sr-only para manter a árvore de acessibilidade intacta */}
      <div role="radiogroup" aria-label="Coleções" className="sr-only">
        {pills.map((pill) => {
          const isSelected = selectedCategory === pill.id;
          return (
            <label key={pill.id ?? "all"}>
              <input
                type="radio"
                name="mobile-collection"
                checked={isSelected}
                onChange={() => onSelectCategory(pill.id)}
              />
              <span>{pill.name}</span>
            </label>
          );
        })}
      </div>
    </div>
  );
}
