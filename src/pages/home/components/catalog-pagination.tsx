import { ChevronRight } from "lucide-react";

import { getVisiblePages } from "../pagination";

interface CatalogPaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export function CatalogPagination({
  page,
  totalPages,
  onPageChange,
}: CatalogPaginationProps) {
  if (totalPages <= 1) {
    return null;
  }

  return (
    <nav
      aria-label="Paginação do catálogo"
      className="flex items-center justify-end gap-2 pt-6"
    >
      {getVisiblePages(page, totalPages).map((pageNum) => {
        const isCurrent = pageNum === page;
        return (
          <button
            key={pageNum}
            type="button"
            onClick={() => onPageChange(pageNum)}
            aria-label={`Página ${pageNum}`}
            aria-current={isCurrent ? "page" : undefined}
            className={`size-8 rounded-md text-xs font-mono font-bold transition-colors cursor-pointer ${
              isCurrent
                ? "bg-[#D28A4C] text-[#0E0907]"
                : "text-neutral-400 hover:text-white hover:bg-[#1C110C]"
            }`}
          >
            {pageNum}
          </button>
        );
      })}

      <button
        type="button"
        onClick={() => onPageChange(Math.min(totalPages, page + 1))}
        disabled={page >= totalPages}
        className="size-8 rounded-md text-neutral-400 hover:text-white hover:bg-[#1C110C] flex items-center justify-center transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
        aria-label="Próxima página"
      >
        <ChevronRight className="size-4" />
      </button>
    </nav>
  );
}
