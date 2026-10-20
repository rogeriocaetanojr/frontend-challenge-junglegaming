/**
 * Testes unitários para CatalogToolbar (src/features/catalog/CatalogToolbar.tsx).
 */
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { CatalogToolbar } from "../CatalogToolbar";

// @ts-expect-error IS_REACT_ACT_ENVIRONMENT flag
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

function changeSelectValue(select: HTMLSelectElement, value: string) {
  select.value = value;
  select.dispatchEvent(new Event("change", { bubbles: true }));
}

describe("CatalogToolbar (src/features/catalog/CatalogToolbar.tsx)", () => {
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

  describe("Renderização e Acessibilidade", () => {
    it("deve renderizar os controles de ordenação e paginação com labels semânticos vinculados", async () => {
      await act(async () => {
        root?.render(
          <CatalogToolbar
            sortBy="createdAt"
            sortDirection="desc"
            onSortChange={vi.fn()}
            limit={12}
            onLimitChange={vi.fn()}
          />,
        );
      });

      const toolbar = container?.querySelector('[data-testid="catalog-toolbar"]');
      expect(toolbar).not.toBeNull();

      const sortLabel = container?.querySelector('label[for="catalog-sort"]');
      expect(sortLabel).not.toBeNull();
      expect(sortLabel?.textContent).toContain("Ordenar por");

      const sortSelect = container?.querySelector<HTMLSelectElement>("#catalog-sort");
      expect(sortSelect).not.toBeNull();
      expect(sortSelect?.getAttribute("aria-label")).toBe("Ordenar por");
      expect(sortSelect?.value).toBe("createdAt:desc");

      const limitLabel = container?.querySelector('label[for="catalog-page-size"]');
      expect(limitLabel).not.toBeNull();
      expect(limitLabel?.textContent).toContain("Itens por página");

      const limitSelect =
        container?.querySelector<HTMLSelectElement>("#catalog-page-size");
      expect(limitSelect).not.toBeNull();
      expect(limitSelect?.getAttribute("aria-label")).toBe("Itens por página");
      expect(limitSelect?.value).toBe("12");
    });

    it("deve exibir todas as opções de ordenação necessárias", async () => {
      await act(async () => {
        root?.render(<CatalogToolbar onSortChange={vi.fn()} onLimitChange={vi.fn()} />);
      });

      const sortSelect = container?.querySelector<HTMLSelectElement>("#catalog-sort");
      const options = Array.from(sortSelect?.options ?? []).map((o) => ({
        value: o.value,
        text: o.text,
      }));

      expect(options).toEqual(
        expect.arrayContaining([
          { value: "createdAt:desc", text: "Listados recentemente" },
          { value: "popular", text: "Mais populares" },
          { value: "price:desc", text: "Maior preço" },
          { value: "price:asc", text: "Menor preço" },
        ]),
      );
    });

    it("deve exibir as opções padrão de tamanho de página (8, 12, 24, 48)", async () => {
      await act(async () => {
        root?.render(<CatalogToolbar onSortChange={vi.fn()} onLimitChange={vi.fn()} />);
      });

      const limitSelect =
        container?.querySelector<HTMLSelectElement>("#catalog-page-size");
      const sizeOptions = Array.from(limitSelect?.options ?? []).map((o) =>
        Number(o.value),
      );

      expect(sizeOptions).toEqual([8, 12, 24, 48]);
    });

    it("deve sincronizar o valor selecionado quando props personalizadas forem passadas", async () => {
      await act(async () => {
        root?.render(
          <CatalogToolbar
            sortBy="price"
            sortDirection="asc"
            limit={24}
            onSortChange={vi.fn()}
            onLimitChange={vi.fn()}
          />,
        );
      });

      const sortSelect = container?.querySelector<HTMLSelectElement>("#catalog-sort");
      expect(sortSelect?.value).toBe("price:asc");

      const limitSelect =
        container?.querySelector<HTMLSelectElement>("#catalog-page-size");
      expect(limitSelect?.value).toBe("24");
    });
  });

  describe("Interação e Disparo de Callbacks", () => {
    it("deve disparar onSortChange com parâmetros corretos ao alterar para 'price:desc'", async () => {
      const onSortChange = vi.fn();
      await act(async () => {
        root?.render(
          <CatalogToolbar
            sortBy="createdAt"
            sortDirection="desc"
            onSortChange={onSortChange}
            onLimitChange={vi.fn()}
          />,
        );
      });

      const sortSelect = container?.querySelector<HTMLSelectElement>("#catalog-sort");
      expect(sortSelect).not.toBeNull();
      if (sortSelect) {
        await act(async () => {
          changeSelectValue(sortSelect, "price:desc");
        });
      }

      expect(onSortChange).toHaveBeenCalledTimes(1);
      expect(onSortChange).toHaveBeenCalledWith({
        sortBy: "price",
        sortDirection: "desc",
      });
    });

    it("deve disparar onSortChange com parâmetros corretos ao alterar para 'popular'", async () => {
      const onSortChange = vi.fn();
      await act(async () => {
        root?.render(
          <CatalogToolbar
            sortBy="createdAt"
            sortDirection="desc"
            onSortChange={onSortChange}
            onLimitChange={vi.fn()}
          />,
        );
      });

      const sortSelect = container?.querySelector<HTMLSelectElement>("#catalog-sort");
      expect(sortSelect).not.toBeNull();
      if (sortSelect) {
        await act(async () => {
          changeSelectValue(sortSelect, "popular");
        });
      }

      expect(onSortChange).toHaveBeenCalledWith({
        sortBy: "popular",
        sortDirection: "desc",
      });
    });

    it("deve disparar onLimitChange com valor numérico ao alterar itens por página", async () => {
      const onLimitChange = vi.fn();
      await act(async () => {
        root?.render(
          <CatalogToolbar
            limit={12}
            onSortChange={vi.fn()}
            onLimitChange={onLimitChange}
          />,
        );
      });

      const limitSelect =
        container?.querySelector<HTMLSelectElement>("#catalog-page-size");
      expect(limitSelect).not.toBeNull();
      if (limitSelect) {
        await act(async () => {
          changeSelectValue(limitSelect, "48");
        });
      }

      expect(onLimitChange).toHaveBeenCalledTimes(1);
      expect(onLimitChange).toHaveBeenCalledWith(48);
    });
  });

  describe("Indicador de Resultados (totalItems)", () => {
    it("deve exibir texto no plural e formato acessível com role='status' e aria-live='polite'", async () => {
      await act(async () => {
        root?.render(
          <CatalogToolbar
            totalItems={24}
            onSortChange={vi.fn()}
            onLimitChange={vi.fn()}
          />,
        );
      });

      const countElement = container?.querySelector(
        '[data-testid="catalog-toolbar-count"]',
      );
      expect(countElement).not.toBeNull();
      expect(countElement?.getAttribute("role")).toBe("status");
      expect(countElement?.getAttribute("aria-live")).toBe("polite");
      expect(countElement?.textContent).toContain("24 itens encontrados");
    });

    it("deve exibir texto no singular quando totalItems for 1", async () => {
      await act(async () => {
        root?.render(
          <CatalogToolbar
            totalItems={1}
            onSortChange={vi.fn()}
            onLimitChange={vi.fn()}
          />,
        );
      });

      const countElement = container?.querySelector(
        '[data-testid="catalog-toolbar-count"]',
      );
      expect(countElement?.textContent).toBe("1 item encontrado");
    });

    it("deve exibir '0 itens encontrados' quando totalItems for 0", async () => {
      await act(async () => {
        root?.render(
          <CatalogToolbar
            totalItems={0}
            onSortChange={vi.fn()}
            onLimitChange={vi.fn()}
          />,
        );
      });

      const countElement = container?.querySelector(
        '[data-testid="catalog-toolbar-count"]',
      );
      expect(countElement?.textContent).toBe("0 itens encontrados");
    });

    it("não deve renderizar parágrafo visível quando totalItems for indefinido", async () => {
      await act(async () => {
        root?.render(<CatalogToolbar onSortChange={vi.fn()} onLimitChange={vi.fn()} />);
      });

      const countElement = container?.querySelector(
        '[data-testid="catalog-toolbar-count"]',
      );
      expect(countElement).toBeNull();
    });
  });
});
