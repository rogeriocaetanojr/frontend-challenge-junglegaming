/**
 * Testes unitários para CatalogFilters (src/features/catalog/CatalogFilters.tsx).
 */
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { CatalogFilters, type CategoryOption } from "../CatalogFilters";

// @ts-expect-error IS_REACT_ACT_ENVIRONMENT flag
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const mockCategories: CategoryOption[] = [
  { id: "art", label: "Arte", count: 12 },
  { id: "gaming", label: "Jogos", count: 8 },
  { id: "photography", label: "Fotografia", count: 4 },
];

function changeInputValue(input: HTMLInputElement, value: string) {
  const prototype = Object.getPrototypeOf(input);
  const descriptor = Object.getOwnPropertyDescriptor(prototype, "value");
  descriptor?.set?.call(input, value);
  input.dispatchEvent(new Event("input", { bubbles: true }));
  input.dispatchEvent(new Event("change", { bubbles: true }));
}

describe("CatalogFilters (src/features/catalog/CatalogFilters.tsx)", () => {
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

  describe("Seletor de Categorias", () => {
    it("deve renderizar as categorias fornecidas com rótulos e contadores", async () => {
      await act(async () => {
        root?.render(
          <CatalogFilters
            categories={mockCategories}
            onSelectCategory={vi.fn()}
            onPriceChange={vi.fn()}
          />,
        );
      });

      expect(container?.textContent).toContain("Todas");
      expect(container?.textContent).toContain("Arte");
      expect(container?.textContent).toContain("12");
      expect(container?.textContent).toContain("Jogos");
      expect(container?.textContent).toContain("8");
    });

    it("deve marcar 'Todas' com aria-pressed='true' quando nenhuma categoria estiver selecionada", async () => {
      await act(async () => {
        root?.render(
          <CatalogFilters
            selectedCategory={undefined}
            categories={mockCategories}
            onSelectCategory={vi.fn()}
            onPriceChange={vi.fn()}
          />,
        );
      });

      const allButton = Array.from(container?.querySelectorAll("button") || []).find(
        (btn) => btn.textContent?.includes("Todas"),
      );

      expect(allButton?.getAttribute("aria-pressed")).toBe("true");

      const artButton = Array.from(container?.querySelectorAll("button") || []).find(
        (btn) => btn.textContent?.includes("Arte"),
      );

      expect(artButton?.getAttribute("aria-pressed")).toBe("false");
    });

    it("deve marcar a categoria ativa com aria-pressed='true'", async () => {
      await act(async () => {
        root?.render(
          <CatalogFilters
            selectedCategory="gaming"
            categories={mockCategories}
            onSelectCategory={vi.fn()}
            onPriceChange={vi.fn()}
          />,
        );
      });

      const gamingButton = Array.from(container?.querySelectorAll("button") || []).find(
        (btn) => btn.textContent?.includes("Jogos"),
      );

      expect(gamingButton?.getAttribute("aria-pressed")).toBe("true");

      const allButton = Array.from(container?.querySelectorAll("button") || []).find(
        (btn) => btn.textContent?.includes("Todas"),
      );

      expect(allButton?.getAttribute("aria-pressed")).toBe("false");
    });

    it("deve disparar onSelectCategory com o ID da categoria ao clicar", async () => {
      const onSelectCategoryMock = vi.fn();

      await act(async () => {
        root?.render(
          <CatalogFilters
            categories={mockCategories}
            onSelectCategory={onSelectCategoryMock}
            onPriceChange={vi.fn()}
          />,
        );
      });

      const artButton = Array.from(container?.querySelectorAll("button") || []).find(
        (btn) => btn.textContent?.includes("Arte"),
      );

      await act(async () => {
        artButton?.click();
      });

      expect(onSelectCategoryMock).toHaveBeenCalledTimes(1);
      expect(onSelectCategoryMock).toHaveBeenCalledWith("art");
    });

    it("deve disparar onSelectCategory com undefined ao clicar em 'Todas'", async () => {
      const onSelectCategoryMock = vi.fn();

      await act(async () => {
        root?.render(
          <CatalogFilters
            selectedCategory="gaming"
            categories={mockCategories}
            onSelectCategory={onSelectCategoryMock}
            onPriceChange={vi.fn()}
          />,
        );
      });

      const allButton = Array.from(container?.querySelectorAll("button") || []).find(
        (btn) => btn.textContent?.includes("Todas"),
      );

      await act(async () => {
        allButton?.click();
      });

      expect(onSelectCategoryMock).toHaveBeenCalledTimes(1);
      expect(onSelectCategoryMock).toHaveBeenCalledWith(undefined);
    });
  });

  describe("Filtro de Faixa de Preço", () => {
    it("deve renderizar inputs de preço com labels semânticos associados via htmlFor", async () => {
      await act(async () => {
        root?.render(
          <CatalogFilters
            priceMin={0.5}
            priceMax={3.0}
            onSelectCategory={vi.fn()}
            onPriceChange={vi.fn()}
          />,
        );
      });

      const minInput = container?.querySelector("#price-min") as HTMLInputElement;
      const maxInput = container?.querySelector("#price-max") as HTMLInputElement;

      expect(minInput).not.toBeNull();
      expect(minInput.value).toBe("0.5");
      expect(maxInput).not.toBeNull();
      expect(maxInput.value).toBe("3");

      const minLabel = container?.querySelector('label[for="price-min"]');
      const maxLabel = container?.querySelector('label[for="price-max"]');

      expect(minLabel?.textContent).toContain("Preço Mínimo");
      expect(maxLabel?.textContent).toContain("Preço Máximo");
    });

    it("deve disparar onPriceChange com novo valor mínimo e prevenir valores negativos", async () => {
      const onPriceChangeMock = vi.fn();

      await act(async () => {
        root?.render(
          <CatalogFilters
            priceMax={5.0}
            onSelectCategory={vi.fn()}
            onPriceChange={onPriceChangeMock}
          />,
        );
      });

      const minInput = container?.querySelector("#price-min") as HTMLInputElement;

      // Digita preço mínimo válido
      await act(async () => {
        changeInputValue(minInput, "0.75");
      });

      expect(onPriceChangeMock).toHaveBeenCalledWith({
        min: 0.75,
        max: 5.0,
      });

      // Digita valor negativo -> deve ser prevenido e limitado a 0
      await act(async () => {
        changeInputValue(minInput, "-2.5");
      });

      expect(onPriceChangeMock).toHaveBeenCalledWith({
        min: 0,
        max: 5.0,
      });
    });

    it("deve disparar onPriceChange com novo valor máximo e permitir limpar", async () => {
      const onPriceChangeMock = vi.fn();

      await act(async () => {
        root?.render(
          <CatalogFilters
            priceMin={0.2}
            priceMax={10}
            onSelectCategory={vi.fn()}
            onPriceChange={onPriceChangeMock}
          />,
        );
      });

      const maxInput = container?.querySelector("#price-max") as HTMLInputElement;

      await act(async () => {
        changeInputValue(maxInput, "8.5");
      });

      expect(onPriceChangeMock).toHaveBeenCalledWith({
        min: 0.2,
        max: 8.5,
      });

      // Limpa o valor
      await act(async () => {
        changeInputValue(maxInput, "");
      });

      expect(onPriceChangeMock).toHaveBeenCalledWith({
        min: 0.2,
        max: undefined,
      });
    });
  });

  describe("Ação de Reset (Limpar filtros)", () => {
    it("não deve exibir botão de reset quando não houver nenhum filtro ativo", async () => {
      await act(async () => {
        root?.render(
          <CatalogFilters
            onReset={vi.fn()}
            onSelectCategory={vi.fn()}
            onPriceChange={vi.fn()}
          />,
        );
      });

      const resetBtn = Array.from(container?.querySelectorAll("button") || []).find(
        (btn) => btn.textContent?.includes("Limpar filtros"),
      );

      expect(resetBtn).toBeUndefined();
    });

    it("deve exibir botão de reset quando houver filtros aplicados e acionar onReset ao clicar", async () => {
      const onResetMock = vi.fn();

      await act(async () => {
        root?.render(
          <CatalogFilters
            selectedCategory="art"
            onReset={onResetMock}
            onSelectCategory={vi.fn()}
            onPriceChange={vi.fn()}
          />,
        );
      });

      const resetBtn = Array.from(container?.querySelectorAll("button") || []).find(
        (btn) => btn.textContent?.includes("Limpar filtros"),
      );

      expect(resetBtn).toBeDefined();

      await act(async () => {
        resetBtn?.click();
      });

      expect(onResetMock).toHaveBeenCalledTimes(1);
    });
  });
});
