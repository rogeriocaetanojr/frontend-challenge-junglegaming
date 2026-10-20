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
import { useState } from "react";

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

  const [prevPriceMin, setPrevPriceMin] = useState<number | undefined>(priceMin);
  const [prevPriceMax, setPrevPriceMax] = useState<number | undefined>(priceMax);
  const [localMin, setLocalMin] = useState<string>(
    priceMin !== undefined ? String(priceMin) : "",
  );
  const [localMax, setLocalMax] = useState<string>(
    priceMax !== undefined ? String(priceMax) : "",
  );

  // Sincroniza o estado local durante a renderização quando as props da rota mudarem
  if (priceMin !== prevPriceMin) {
    setPrevPriceMin(priceMin);
    setLocalMin(priceMin !== undefined ? String(priceMin) : "");
  }

  if (priceMax !== prevPriceMax) {
    setPrevPriceMax(priceMax);
    setLocalMax(priceMax !== undefined ? String(priceMax) : "");
  }

  const handleApply = () => {
    const minVal =
      localMin.trim() !== "" && !isNaN(Number(localMin))
        ? Math.max(0, Number(localMin))
        : undefined;
    const maxVal =
      localMax.trim() !== "" && !isNaN(Number(localMax))
        ? Math.max(0, Number(localMax))
        : undefined;
    onPriceChange({ min: minVal, max: maxVal });
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
      <fieldset className="flex flex-col gap-3.5 border-none p-0 m-0 border-t border-border/60 pt-4">
        <legend className="text-xs font-semibold uppercase tracking-wider text-text-muted">
          Faixa de Preço (ETH)
        </legend>

        {/* Sliders de Preço Mínimo e Máximo Sobrepostos */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between text-xs text-text-muted font-mono">
            <span>
              Preço:{" "}
              {localMin !== "" ? Number(localMin).toFixed(2).replace(".", ",") : "0,00"} -{" "}
              {localMax !== "" ? Number(localMax).toFixed(2).replace(".", ",") : "50,00"}{" "}
              ETH
            </span>
          </div>

          <div className="relative h-6 flex items-center">
            {/* Trilha de fundo */}
            <div className="h-1.5 bg-[#140D0A] border border-[#3F2319] rounded-full w-full pointer-events-none" />
            {/* Destaque ativo preenchido entre min e max */}
            <div
              className="absolute h-1.5 bg-[#D28A4C] rounded-full pointer-events-none"
              style={{
                left: `${Math.min(100, Math.max(0, ((localMin !== "" ? Number(localMin) : 0) / 50) * 100))}%`,
                right: `${Math.min(100, Math.max(0, 100 - ((localMax !== "" ? Number(localMax) : 50) / 50) * 100))}%`,
              }}
            />

            {/* Slider de Preço Mínimo */}
            <input
              type="range"
              min="0"
              max="50"
              step="0.01"
              value={localMin !== "" ? Number(localMin) : 0}
              onChange={(e) => {
                const currentMax = localMax !== "" ? Number(localMax) : 50;
                const val = Math.min(Number(e.target.value), currentMax);
                setLocalMin(String(val));
              }}
              aria-label="Slider de preço mínimo"
              className="absolute inset-0 w-full appearance-none bg-transparent pointer-events-none cursor-pointer z-10
                [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:size-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[#D28A4C] [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-[#140D0A] [&::-webkit-slider-thumb]:shadow
                [&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:size-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-[#D28A4C] [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-[#140D0A] [&::-moz-range-thumb]:shadow"
            />

            {/* Slider de Preço Máximo */}
            <input
              type="range"
              min="0"
              max="50"
              step="0.01"
              value={localMax !== "" ? Number(localMax) : 50}
              onChange={(e) => {
                const currentMin = localMin !== "" ? Number(localMin) : 0;
                const val = Math.max(Number(e.target.value), currentMin);
                setLocalMax(String(val));
              }}
              aria-label="Slider de preço máximo"
              className="absolute inset-0 w-full appearance-none bg-transparent pointer-events-none cursor-pointer z-20
                [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:size-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[#D28A4C] [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-[#140D0A] [&::-webkit-slider-thumb]:shadow
                [&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:size-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-[#D28A4C] [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-[#140D0A] [&::-moz-range-thumb]:shadow"
            />
          </div>
        </div>

        {/* Inputs Numéricos */}
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
              value={localMin}
              onChange={(e) => {
                setLocalMin(e.target.value);
                const raw = e.target.value.trim();
                const num = raw === "" ? undefined : parseFloat(raw);
                onPriceChange({
                  min: num !== undefined && !isNaN(num) ? Math.max(0, num) : undefined,
                  max: localMax !== "" ? Number(localMax) : undefined,
                });
              }}
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
              value={localMax}
              onChange={(e) => {
                setLocalMax(e.target.value);
                const raw = e.target.value.trim();
                const num = raw === "" ? undefined : parseFloat(raw);
                onPriceChange({
                  min: localMin !== "" ? Number(localMin) : undefined,
                  max: num !== undefined && !isNaN(num) ? Math.max(0, num) : undefined,
                });
              }}
              className="h-9 w-full rounded-button border border-border bg-surface-dark px-2.5 text-xs text-foreground placeholder:text-text-muted transition-colors focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            />
          </div>
        </div>

        {/* Botão APLICAR */}
        <Button
          type="button"
          onClick={handleApply}
          className="w-full bg-[#D28A4C] hover:bg-[#c47b3e] text-[#0E0907] font-mono font-bold text-xs py-2 px-4 rounded-md tracking-wider uppercase transition-colors shadow-md shadow-[#D28A4C]/15 cursor-pointer mt-1"
        >
          Aplicar
        </Button>
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
