const MAX_VISIBLE_PAGES = 4;

/**
 * Janela deslizante de até 4 páginas numeradas, centrada na página atual.
 */
export function getVisiblePages(page: number, totalPages: number): number[] {
  const count = Math.min(MAX_VISIBLE_PAGES, totalPages);
  const start = Math.min(Math.max(1, page - 1), totalPages - count + 1);
  return Array.from({ length: count }, (_, index) => start + index);
}
