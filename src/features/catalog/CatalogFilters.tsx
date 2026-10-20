/**
 * Controles Acessíveis de Filtro do Catálogo (CatalogFilters).
 *
 * Em conformidade estrita com WCAG 2.1 AA:
 * - Seletor de categorias com pills semânticas, role="group" e aria-pressed.
 * - Filtro de faixa de preço em ETH com validação numérica e prevenção de valores negativos.
 * - Labels semânticos associados via htmlFor.
 * - Botão de reset visível condicionalmente quando filtros estiverem ativos.
 * - Foco visível de alto contraste e suporte a teclado.
 */
import { FilterX, RotateCcw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { type CategoryOption, DEFAULT_CATEGORY_OPTIONS } from "./types";

export type { CategoryOption };

export interface CatalogFiltersProps {
  selectedCategory?: string;
  onSelectCategory: (category: string | undefined) => void;
  priceMin?: number;
  priceMax?: number;
  onPriceChange: (range: { min?: number; max?: number }) => void;
  categories?: CategoryOption[];
  onReset?: () => void;
  className?: string;
}

export function CatalogFilters({
  selectedCategory,
  onSelectCategory,
  priceMin,
  priceMax,
  onPriceChange,
  categories = DEFAULT_CATEGORY_OPTIONS,
  onReset,
  className,
}: CatalogFiltersProps) {
  const hasActiveFilters = Boolean(
    selectedCategory || priceMin !== undefined || priceMax !== undefined,
  );

  const handleMinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value.trim();
    if (rawValue === "") {
      onPriceChange({ min: undefined, max: priceMax });
      return;
    }
    const parsed = parseFloat(rawValue);
    if (!isNaN(parsed)) {
      onPriceChange({ min: Math.max(0, parsed), max: priceMax });
    }
  };

  const handleMaxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value.trim();
    if (rawValue === "") {
      onPriceChange({ min: priceMin, max: undefined });
      return;
    }
    const parsed = parseFloat(rawValue);
    if (!isNaN(parsed)) {
      onPriceChange({ min: priceMin, max: Math.max(0, parsed) });
    }
  };

  return (
    <aside
      aria-label="Filtros do Catálogo"
      className={cn(
        "flex flex-col gap-6 rounded-card border border-border bg-surface-dark p-4 sm:p-5 shadow-sm",
        className,
      )}
    >
      {/* Cabeçalho de Filtros */}
      <div className="flex items-center justify-between border-b border-border/60 pb-3">
        <h2 className="text-base font-bold text-foreground">Filtros</h2>
        {hasActiveFilters && onReset && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onReset}
            className="h-8 px-2 text-xs text-text-muted hover:text-foreground gap-1.5"
          >
            <RotateCcw className="size-3.5" aria-hidden="true" />
            <span>Limpar filtros</span>
          </Button>
        )}
      </div>

      {/* 1. Seletor de Categorias */}
      <fieldset className="flex flex-col gap-2.5 border-none p-0 m-0">
        <legend className="text-xs font-semibold uppercase tracking-wider text-text-muted">
          Categorias
        </legend>
        <div
          role="group"
          aria-label="Filtrar por categoria"
          className="flex flex-wrap gap-2"
        >
          {/* Opção "Todas" */}
          <button
            type="button"
            aria-pressed={!selectedCategory}
            onClick={() => onSelectCategory(undefined)}
            className={cn(
              "rounded-button border px-3 py-1.5 text-xs font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background",
              !selectedCategory
                ? "border-primary bg-primary text-ink-deep shadow-sm"
                : "border-border bg-surface-raised text-text-muted hover:bg-surface-dark hover:text-foreground",
            )}
          >
            Todas
          </button>

          {/* Lista de Categorias */}
          {categories.map((cat) => {
            const isSelected = selectedCategory === cat.id;

            return (
              <button
                key={cat.id}
                type="button"
                aria-pressed={isSelected}
                onClick={() => onSelectCategory(cat.id)}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-button border px-3 py-1.5 text-xs font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                  isSelected
                    ? "border-primary bg-primary text-ink-deep shadow-sm"
                    : "border-border bg-surface-raised text-text-muted hover:bg-surface-dark hover:text-foreground",
                )}
              >
                <span>{cat.label}</span>
                {cat.count !== undefined && (
                  <span
                    className={cn(
                      "rounded-full px-1.5 py-0.2 text-[10px] font-bold",
                      isSelected
                        ? "bg-ink-deep/20 text-ink-deep"
                        : "bg-surface-dark text-text-muted",
                    )}
                  >
                    {cat.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </fieldset>

      {/* 2. Filtro de Faixa de Preço */}
      <fieldset className="flex flex-col gap-2.5 border-none p-0 m-0 border-t border-border/60 pt-4">
        <legend className="text-xs font-semibold uppercase tracking-wider text-text-muted">
          Faixa de Preço (ETH)
        </legend>
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1">
            <label
              htmlFor="price-min"
              className="text-[11px] font-medium text-text-muted"
            >
              Preço Mínimo
            </label>
            <input
              id="price-min"
              type="number"
              min="0"
              step="any"
              placeholder="0.00"
              value={priceMin !== undefined ? priceMin : ""}
              onChange={handleMinChange}
              className="h-9 w-full rounded-button border border-border bg-surface-dark px-2.5 text-xs text-foreground placeholder:text-text-muted transition-colors focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label
              htmlFor="price-max"
              className="text-[11px] font-medium text-text-muted"
            >
              Preço Máximo
            </label>
            <input
              id="price-max"
              type="number"
              min="0"
              step="any"
              placeholder="Max"
              value={priceMax !== undefined ? priceMax : ""}
              onChange={handleMaxChange}
              className="h-9 w-full rounded-button border border-border bg-surface-dark px-2.5 text-xs text-foreground placeholder:text-text-muted transition-colors focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            />
          </div>
        </div>
      </fieldset>

      {/* Ação de Limpeza Mobile / Inferior */}
      {hasActiveFilters && onReset && (
        <div className="border-t border-border/60 pt-3 sm:hidden">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onReset}
            className="w-full border-border text-foreground hover:bg-surface-raised gap-2"
          >
            <FilterX className="size-4" aria-hidden="true" />
            <span>Limpar todos os filtros</span>
          </Button>
        </div>
      )}
    </aside>
  );
}

export default CatalogFilters;
