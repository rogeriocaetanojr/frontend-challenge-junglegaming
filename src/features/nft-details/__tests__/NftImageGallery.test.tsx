/**
 * Testes unitários para NftImageGallery (src/features/nft-details/NftImageGallery.tsx).
 *
 * Validações de acessibilidade e comportamento:
 * 1. Renderiza imagem principal e fallback de alt.
 * 2. Abre modal fullscreen com role="dialog" e aria-modal="true" ao clicar no botão de zoom.
 * 3. Fecha o modal ao pressionar a tecla Escape.
 * 4. Fecha o modal ao clicar no botão de fechar.
 */
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { NftImageGallery } from "../NftImageGallery";

// @ts-expect-error IS_REACT_ACT_ENVIRONMENT flag
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

describe("NftImageGallery (src/features/nft-details/NftImageGallery.tsx)", () => {
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

  it("deve renderizar a imagem com src e alt corretos", async () => {
    await act(async () => {
      root?.render(
        <NftImageGallery
          images={[{ url: "https://example.com/nft.png", alt: "NFT Raro #1" }]}
          title="NFT Raro #1"
          rarity="legendary"
          featured={true}
        />,
      );
    });

    const img = container?.querySelector("img");
    expect(img).not.toBeNull();
    expect(img?.getAttribute("src")).toBe("https://example.com/nft.png");
    expect(img?.getAttribute("alt")).toBe("NFT Raro #1");
  });

  it("deve abrir o modal de tela cheia acessível ao clicar no botão de zoom", async () => {
    await act(async () => {
      root?.render(
        <NftImageGallery
          images={[{ url: "https://example.com/nft.png", alt: "NFT Raro #1" }]}
          title="NFT Raro #1"
        />,
      );
    });

    const zoomButton = container?.querySelector(
      'button[aria-label="Ampliar imagem do NFT"]',
    ) as HTMLButtonElement;
    expect(zoomButton).not.toBeNull();

    // Modal fechado inicialmente
    expect(document.querySelector('div[role="dialog"]')).toBeNull();

    await act(async () => {
      zoomButton.click();
    });

    // Modal aberto com atributos WCAG
    const modal = document.querySelector('div[role="dialog"]');
    expect(modal).not.toBeNull();
    expect(modal?.getAttribute("aria-modal")).toBe("true");
    expect(modal?.getAttribute("aria-label")).toBe("Visualização ampliada do NFT");
  });

  it("deve fechar o modal ao pressionar a tecla Escape", async () => {
    await act(async () => {
      root?.render(
        <NftImageGallery
          images={[{ url: "https://example.com/nft.png", alt: "NFT Raro #1" }]}
          title="NFT Raro #1"
        />,
      );
    });

    const zoomButton = container?.querySelector(
      'button[aria-label="Ampliar imagem do NFT"]',
    ) as HTMLButtonElement;

    await act(async () => {
      zoomButton.click();
    });

    expect(document.querySelector('div[role="dialog"]')).not.toBeNull();

    // Dispara tecla Escape na janela
    await act(async () => {
      window.dispatchEvent(
        new KeyboardEvent("keydown", { key: "Escape", bubbles: true }),
      );
    });

    expect(document.querySelector('div[role="dialog"]')).toBeNull();
  });

  it("deve fechar o modal ao clicar no botão de fechar", async () => {
    await act(async () => {
      root?.render(
        <NftImageGallery
          images={[{ url: "https://example.com/nft.png", alt: "NFT Raro #1" }]}
          title="NFT Raro #1"
        />,
      );
    });

    const zoomButton = container?.querySelector(
      'button[aria-label="Ampliar imagem do NFT"]',
    ) as HTMLButtonElement;

    await act(async () => {
      zoomButton.click();
    });

    const closeBtn = document.querySelector(
      'button[aria-label="Fechar visualização ampliada"]',
    ) as HTMLButtonElement;
    expect(closeBtn).not.toBeNull();

    await act(async () => {
      closeBtn.click();
    });

    expect(document.querySelector('div[role="dialog"]')).toBeNull();
  });
});
