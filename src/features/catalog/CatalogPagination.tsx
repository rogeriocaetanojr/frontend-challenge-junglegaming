/**
 * Controles de Paginação Acessíveis do Catálogo de NFTs (CatalogPagination).
 *
 * Em conformidade estrita com as diretrizes de acessibilidade WCAG 2.1 AA:
 * - Elemento estrutural <nav aria-label="Paginação do catálogo"> e data-testid="catalog-pagination".
 * - Botões "Anterior" e "Próxima" com atributos aria-disabled e disabled nos limites.
 * - Botões de navegação numérica com aria-current="page" na página ativa.
 * - Não renderiza nada quando totalPages <= 1.
 */
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useMemo } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface CatalogPaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  className?: string;
}

export function CatalogPagination({
  currentPage,
  totalPages,
  onPageChange,
  className,
}: CatalogPaginationProps) {
  // Janela visível de botões de página (até 5 números centralizados na página atual)
  const pageNumbers = useMemo(() => {
    if (totalPages <= 1) return [];
    const pages: number[] = [];
    const windowSize = 5;
    let start = Math.max(1, currentPage - Math.floor(windowSize / 2));
    const end = Math.min(totalPages, start + windowSize - 1);

    if (end - start + 1 < windowSize) {
      start = Math.max(1, end - windowSize + 1);
    }

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    return pages;
  }, [currentPage, totalPages]);

  // Oculta completamente se houver apenas 1 página ou nenhuma
  if (totalPages <= 1) {
    return null;
  }

  const isFirstPage = currentPage <= 1;
  const isLastPage = currentPage >= totalPages;

  return (
    <nav
      aria-label="Paginação do catálogo"
      data-testid="catalog-pagination"
      className={cn("flex flex-wrap items-center justify-center gap-2 pt-6", className)}
    >
      {/* Botão Anterior */}
      <Button
        variant="outline"
        size="sm"
        data-testid="pagination-prev"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={isFirstPage}
        aria-disabled={isFirstPage ? "true" : undefined}
        aria-label="Ir para a página anterior"
        className="gap-1 cursor-pointer"
      >
        <ChevronLeft className="h-4 w-4" aria-hidden="true" />
        <span className="hidden sm:inline">Anterior</span>
      </Button>

      {/* Páginas Numéricas */}
      <div
        className="flex items-center gap-1"
        role="group"
        aria-label="Páginas numéricas"
      >
        {pageNumbers.map((p) => {
          const isCurrent = p === currentPage;
          return (
            <Button
              key={p}
              variant={isCurrent ? "default" : "outline"}
              size="sm"
              data-testid={`pagination-page-${p}`}
              onClick={() => onPageChange(p)}
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

      {/* Botão Próxima */}
      <Button
        variant="outline"
        size="sm"
        data-testid="pagination-next"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={isLastPage}
        aria-disabled={isLastPage ? "true" : undefined}
        aria-label="Ir para a próxima página"
        className="gap-1 cursor-pointer"
      >
        <span className="hidden sm:inline">Próxima</span>
        <ChevronRight className="h-4 w-4" aria-hidden="true" />
      </Button>
    </nav>
  );
}

export default CatalogPagination;
