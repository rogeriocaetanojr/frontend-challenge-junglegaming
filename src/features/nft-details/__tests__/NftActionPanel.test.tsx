/**
 * Testes unitários para NftActionPanel (src/features/nft-details/NftActionPanel.tsx).
 *
 * Validações de comportamento (C71):
 * - Controle de quantidade respeitando min=1 e max configurado
 * - Desabilitação de botões nos limites
 * - Alternância do botão de favoritar com aria-pressed
 * - Emissão do callback de compra com a quantidade selecionada
 */
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { NftActionPanel } from "../NftActionPanel";

// @ts-expect-error IS_REACT_ACT_ENVIRONMENT flag
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

describe("NftActionPanel (src/features/nft-details/NftActionPanel.tsx)", () => {
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
  });

  it("deve iniciar com quantidade 1 e botão de decrementar desabilitado", async () => {
    await act(async () => {
      root?.render(<NftActionPanel maxQuantity={5} />);
    });

    const decreaseBtn = container?.querySelector(
      'button[aria-label="Diminuir quantidade"]',
    ) as HTMLButtonElement;
    const increaseBtn = container?.querySelector(
      'button[aria-label="Aumentar quantidade"]',
    ) as HTMLButtonElement;

    expect(container?.textContent).toContain("1");
    expect(decreaseBtn.disabled).toBe(true);
    expect(increaseBtn.disabled).toBe(false);
  });

  it("deve incrementar e decrementar a quantidade respeitando os limites min e max", async () => {
    await act(async () => {
      root?.render(<NftActionPanel maxQuantity={3} initialQuantity={1} />);
    });

    const decreaseBtn = container?.querySelector(
      'button[aria-label="Diminuir quantidade"]',
    ) as HTMLButtonElement;
    const increaseBtn = container?.querySelector(
      'button[aria-label="Aumentar quantidade"]',
    ) as HTMLButtonElement;

    // Incrementa para 2
    await act(async () => {
      increaseBtn.click();
    });
    expect(container?.textContent).toContain("2");
    expect(decreaseBtn.disabled).toBe(false);
    expect(increaseBtn.disabled).toBe(false);

    // Incrementa para 3 (max)
    await act(async () => {
      increaseBtn.click();
    });
    expect(container?.textContent).toContain("3");
    expect(increaseBtn.disabled).toBe(true);

    // Decrementa de volta para 2
    await act(async () => {
      decreaseBtn.click();
    });
    expect(container?.textContent).toContain("2");
    expect(increaseBtn.disabled).toBe(false);
  });

  it("deve alternar o estado de favorito e emitir evento com aria-pressed", async () => {
    const onFavoriteChange = vi.fn();

    await act(async () => {
      root?.render(
        <NftActionPanel initialFavorite={false} onFavoriteChange={onFavoriteChange} />,
      );
    });

    const favButton = container?.querySelector(
      'button[aria-label="Favoritar NFT"]',
    ) as HTMLButtonElement;
    expect(favButton).not.toBeNull();
    expect(favButton.getAttribute("aria-pressed")).toBe("false");

    await act(async () => {
      favButton.click();
    });

    expect(favButton.getAttribute("aria-pressed")).toBe("true");
    expect(favButton.getAttribute("aria-label")).toBe("Desfavoritar NFT");
    expect(onFavoriteChange).toHaveBeenCalledWith(true);

    await act(async () => {
      favButton.click();
    });

    expect(favButton.getAttribute("aria-pressed")).toBe("false");
    expect(onFavoriteChange).toHaveBeenCalledWith(false);
  });

  it("deve chamar onBuy passando a quantidade correta ao clicar em COMPRAR", async () => {
    const onBuy = vi.fn();

    await act(async () => {
      root?.render(<NftActionPanel onBuy={onBuy} maxQuantity={5} />);
    });

    const increaseBtn = container?.querySelector(
      'button[aria-label="Aumentar quantidade"]',
    ) as HTMLButtonElement;
    const buyBtn = container?.querySelector(
      "button:not([aria-label])",
    ) as HTMLButtonElement;

    // Aumenta quantidade para 3
    await act(async () => {
      increaseBtn.click();
    });
    await act(async () => {
      increaseBtn.click();
    });

    await act(async () => {
      buyBtn.click();
    });

    expect(onBuy).toHaveBeenCalledTimes(1);
    expect(onBuy).toHaveBeenCalledWith(3);
  });
});
