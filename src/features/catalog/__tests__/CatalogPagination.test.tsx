/**
 * Testes unitários para CatalogPagination (src/features/catalog/CatalogPagination.tsx).
 */
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { CatalogPagination } from "../CatalogPagination";

// @ts-expect-error IS_REACT_ACT_ENVIRONMENT flag
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

describe("CatalogPagination (src/features/catalog/CatalogPagination.tsx)", () => {
  let container: HTMLDivElement | null = null;
  let root: ReturnType<typeof createRoot> | null = null;

  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    if (root) {
      act(() => {
        root?.unmount();
      });
    }
    container?.remove();
    vi.restoreAllMocks();
  });

  it("não deve renderizar nada quando totalPages <= 1", async () => {
    await act(async () => {
      root?.render(
        <CatalogPagination currentPage={1} totalPages={1} onPageChange={vi.fn()} />,
      );
    });

    expect(container?.innerHTML).toBe("");

    await act(async () => {
      root?.render(
        <CatalogPagination currentPage={1} totalPages={0} onPageChange={vi.fn()} />,
      );
    });

    expect(container?.innerHTML).toBe("");
  });

  it("deve renderizar o elemento nav semântico com aria-label correto", async () => {
    await act(async () => {
      root?.render(
        <CatalogPagination currentPage={1} totalPages={5} onPageChange={vi.fn()} />,
      );
    });

    const nav = container?.querySelector('nav[aria-label="Paginação do catálogo"]');
    expect(nav).not.toBeNull();
    expect(nav?.getAttribute("data-testid")).toBe("catalog-pagination");
  });

  it("deve desabilitar botão Anterior na primeira página com aria-disabled='true'", async () => {
    await act(async () => {
      root?.render(
        <CatalogPagination currentPage={1} totalPages={5} onPageChange={vi.fn()} />,
      );
    });

    const prevButton = container?.querySelector<HTMLButtonElement>(
      '[data-testid="pagination-prev"]',
    );
    const nextButton = container?.querySelector<HTMLButtonElement>(
      '[data-testid="pagination-next"]',
    );

    expect(prevButton).not.toBeNull();
    expect(prevButton?.disabled).toBe(true);
    expect(prevButton?.getAttribute("aria-disabled")).toBe("true");

    expect(nextButton).not.toBeNull();
    expect(nextButton?.disabled).toBe(false);
  });

  it("deve desabilitar botão Próxima na última página com aria-disabled='true'", async () => {
    await act(async () => {
      root?.render(
        <CatalogPagination currentPage={5} totalPages={5} onPageChange={vi.fn()} />,
      );
    });

    const prevButton = container?.querySelector<HTMLButtonElement>(
      '[data-testid="pagination-prev"]',
    );
    const nextButton = container?.querySelector<HTMLButtonElement>(
      '[data-testid="pagination-next"]',
    );

    expect(prevButton).not.toBeNull();
    expect(prevButton?.disabled).toBe(false);

    expect(nextButton).not.toBeNull();
    expect(nextButton?.disabled).toBe(true);
    expect(nextButton?.getAttribute("aria-disabled")).toBe("true");
  });

  it("deve atribuir aria-current='page' apenas no botão da página atual", async () => {
    await act(async () => {
      root?.render(
        <CatalogPagination currentPage={3} totalPages={5} onPageChange={vi.fn()} />,
      );
    });

    const page3Btn = container?.querySelector('[data-testid="pagination-page-3"]');
    const page2Btn = container?.querySelector('[data-testid="pagination-page-2"]');
    const page4Btn = container?.querySelector('[data-testid="pagination-page-4"]');

    expect(page3Btn?.getAttribute("aria-current")).toBe("page");
    expect(page2Btn?.getAttribute("aria-current")).toBeNull();
    expect(page4Btn?.getAttribute("aria-current")).toBeNull();
  });

  it("deve acionar onPageChange com o número correto ao clicar nos botões numéricos e de navegação", async () => {
    const onPageChangeMock = vi.fn();

    await act(async () => {
      root?.render(
        <CatalogPagination
          currentPage={2}
          totalPages={5}
          onPageChange={onPageChangeMock}
        />,
      );
    });

    const prevBtn = container?.querySelector<HTMLButtonElement>(
      '[data-testid="pagination-prev"]',
    );
    const nextBtn = container?.querySelector<HTMLButtonElement>(
      '[data-testid="pagination-next"]',
    );
    const page4Btn = container?.querySelector<HTMLButtonElement>(
      '[data-testid="pagination-page-4"]',
    );

    // Clica em Anterior (2 -> 1)
    await act(async () => {
      prevBtn?.click();
    });
    expect(onPageChangeMock).toHaveBeenCalledWith(1);

    // Clica em Próxima (2 -> 3)
    await act(async () => {
      nextBtn?.click();
    });
    expect(onPageChangeMock).toHaveBeenCalledWith(3);

    // Clica na Página 4 (2 -> 4)
    await act(async () => {
      page4Btn?.click();
    });
    expect(onPageChangeMock).toHaveBeenCalledWith(4);
  });
});
