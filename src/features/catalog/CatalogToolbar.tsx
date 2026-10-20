/**
 * Barra de Ferramentas do Catálogo (CatalogToolbar).
 *
 * Controles de ordenação, quantidade de itens por página e indicador de resultados.
 * Em conformidade estrita com as diretrizes de acessibilidade WCAG 2.1 AA:
 * - Elementos <select> semânticos nativos associados diretamente a <label> via htmlFor.
 * - Anúncio acessível de resultados totais através de role="status" e aria-live="polite".
 * - Foco visual evidente e alto contraste para navegação por teclado.
 */
import { ArrowUpDown } from "lucide-react";
import type { ChangeEvent } from "react";

import { cn } from "@/lib/utils";
import { CATALOG_PAGE_SIZE_OPTIONS, CATALOG_SORT_OPTIONS } from "./types";

export interface CatalogToolbarProps {
  /** Campo de ordenação atual (ex: 'createdAt', 'price', 'title') */
  sortBy?: string;
  /** Direção da ordenação atual ('asc' | 'desc') */
  sortDirection?: "asc" | "desc";
  /** Callback acionado ao alterar a ordenação */
  onSortChange: (sort: { sortBy: string; sortDirection: "asc" | "desc" }) => void;
  /** Quantidade de itens por página atual */
  limit?: number;
  /** Callback acionado ao alterar a quantidade de itens por página */
  onLimitChange: (limit: number) => void;
  /** Total de itens encontrados */
  totalItems?: number;
  /** Classes CSS adicionais */
  className?: string;
}

export function CatalogToolbar({
  sortBy = "createdAt",
  sortDirection = "desc",
  onSortChange,
  limit = 12,
  onLimitChange,
  totalItems,
  className,
}: CatalogToolbarProps) {
  // Resolve o valor combinado da ordenação atual mapeando para as 4 opções padronizadas
  const currentSortValue = (() => {
    if (sortBy === "recent" || sortBy === "createdAt") return "createdAt:desc";
    if (sortBy === "popular") return "popular";
    if (sortBy === "price_desc" || (sortBy === "price" && sortDirection === "desc"))
      return "price:desc";
    if (sortBy === "price_asc" || (sortBy === "price" && sortDirection === "asc"))
      return "price:asc";
    return (
      CATALOG_SORT_OPTIONS.find(
        (opt) => opt.sortBy === sortBy && opt.sortDirection === sortDirection,
      )?.value ?? `${sortBy}:${sortDirection}`
    );
  })();

  const handleSortChange = (e: ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    const selectedOption = CATALOG_SORT_OPTIONS.find((opt) => opt.value === val);
    if (selectedOption) {
      onSortChange({
        sortBy: selectedOption.sortBy,
        sortDirection: selectedOption.sortDirection,
      });
    } else {
      const [parsedSortBy, parsedDirection] = val.split(":");
      onSortChange({
        sortBy: parsedSortBy || "createdAt",
        sortDirection: (parsedDirection as "asc" | "desc") || "desc",
      });
    }
  };

  const handleLimitChange = (e: ChangeEvent<HTMLSelectElement>) => {
    const parsedLimit = parseInt(e.target.value, 10);
    if (!isNaN(parsedLimit) && parsedLimit > 0) {
      onLimitChange(parsedLimit);
    }
  };

  return (
    <div
      data-testid="catalog-toolbar"
      className={cn(
        "flex flex-col gap-4 py-3 sm:flex-row sm:items-center sm:justify-between",
        "border-b border-border/40 text-sm",
        className,
      )}
    >
      {/* Indicador de Resultados */}
      <div className="flex items-center gap-2">
        {totalItems !== undefined ? (
          <p
            role="status"
            aria-live="polite"
            data-testid="catalog-toolbar-count"
            className="font-medium text-muted-foreground"
          >
            {totalItems === 1
              ? "1 item encontrado"
              : `${totalItems.toLocaleString()} itens encontrados`}
          </p>
        ) : (
          <span className="sr-only" role="status" aria-live="polite">
            Catálogo de itens
          </span>
        )}
      </div>

      {/* Controles de Ordenação e Itens por Página */}
      <div className="flex flex-wrap items-center gap-4 sm:gap-6">
        {/* Ordenação */}
        <div className="flex items-center gap-2">
          <label
            htmlFor="catalog-sort"
            className="flex items-center gap-1.5 whitespace-nowrap text-xs font-medium text-muted-foreground sm:text-sm"
          >
            <ArrowUpDown
              className="h-3.5 w-3.5 text-muted-foreground"
              aria-hidden="true"
            />
            Ordenar por:
          </label>
          <select
            id="catalog-sort"
            name="catalog-sort"
            aria-label="Ordenar por"
            value={currentSortValue}
            onChange={handleSortChange}
            className={cn(
              "h-9 rounded-md border border-input bg-background px-3 py-1 text-sm font-medium text-foreground",
              "shadow-sm transition-colors cursor-pointer",
              "hover:border-foreground/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
            )}
          >
            {CATALOG_SORT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {/* Quantidade de Itens por Página */}
        <div className="flex items-center gap-2">
          <label
            htmlFor="catalog-page-size"
            className="whitespace-nowrap text-xs font-medium text-muted-foreground sm:text-sm"
          >
            Itens por página:
          </label>
          <select
            id="catalog-page-size"
            name="catalog-page-size"
            aria-label="Itens por página"
            value={limit}
            onChange={handleLimitChange}
            className={cn(
              "h-9 rounded-md border border-input bg-background px-3 py-1 text-sm font-medium text-foreground",
              "shadow-sm transition-colors cursor-pointer",
              "hover:border-foreground/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
            )}
          >
            {CATALOG_PAGE_SIZE_OPTIONS.map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}
