/**
 * Testes unitários para NftTechnicalTabs (src/features/nft-details/NftTechnicalTabs.tsx).
 *
 * Validações requeridas pelo C72:
 * - Troca de abas funcional via clique e teclado (ArrowRight/ArrowLeft)
 * - Renderização dos dados da aba ativa (metadados e avaliações)
 * - Cópia de endereço de contrato para a área de transferência com feedback
 */
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { NftTechnicalTabs } from "../NftTechnicalTabs";

// @ts-expect-error IS_REACT_ACT_ENVIRONMENT flag
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

describe("NftTechnicalTabs (src/features/nft-details/NftTechnicalTabs.tsx)", () => {
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

  it("deve renderizar a aba de detalhes ativa por padrão com metadados", async () => {
    await act(async () => {
      root?.render(
        <NftTechnicalTabs
          nft={{
            network: "ethereum",
            tokenStandard: "ERC-721",
            contractAddress: "0x1234567890abcdef1234567890abcdef12345678",
          }}
        />,
      );
    });

    const detailsTab = container?.querySelector("#tab-details");
    expect(detailsTab?.getAttribute("aria-selected")).toBe("true");

    const panel = container?.querySelector("#panel-details");
    expect(panel).not.toBeNull();
    expect(panel?.textContent).toContain("Cunhado na Ethereum");
    expect(panel?.textContent).toContain("0x1234...5678");
  });

  it("deve alternar para a aba de avaliações ao clicar", async () => {
    const onTabChange = vi.fn();

    await act(async () => {
      root?.render(<NftTechnicalTabs onTabChange={onTabChange} />);
    });

    const reviewsTab = container?.querySelector("#tab-reviews") as HTMLButtonElement;
    expect(reviewsTab).not.toBeNull();

    await act(async () => {
      reviewsTab.click();
    });

    expect(onTabChange).toHaveBeenCalledWith("reviews");
    expect(reviewsTab.getAttribute("aria-selected")).toBe("true");

    const reviewsPanel = container?.querySelector("#panel-reviews");
    expect(reviewsPanel).not.toBeNull();
    expect(reviewsPanel?.textContent).toContain("Arte incrível e finalização impecável");
  });

  it("deve suportar navegação por teclado entre abas com ArrowRight e ArrowLeft", async () => {
    await act(async () => {
      root?.render(<NftTechnicalTabs />);
    });

    const detailsTab = container?.querySelector("#tab-details") as HTMLButtonElement;
    const reviewsTab = container?.querySelector("#tab-reviews") as HTMLButtonElement;

    // Dispara ArrowRight no tab selecionado
    await act(async () => {
      detailsTab.dispatchEvent(
        new KeyboardEvent("keydown", {
          key: "ArrowRight",
          bubbles: true,
          cancelable: true,
        }),
      );
    });

    expect(reviewsTab.getAttribute("aria-selected")).toBe("true");

    // Dispara ArrowLeft no tab de avaliações
    await act(async () => {
      reviewsTab.dispatchEvent(
        new KeyboardEvent("keydown", {
          key: "ArrowLeft",
          bubbles: true,
          cancelable: true,
        }),
      );
    });

    expect(detailsTab.getAttribute("aria-selected")).toBe("true");
  });

  it("deve exibir o endereço do contrato formatado e token standard", async () => {
    await act(async () => {
      root?.render(
        <NftTechnicalTabs
          nft={{
            contractAddress: "0x7A42b78C02B903E19eE94B8a46F77B08920119E8",
            tokenStandard: "ERC-721",
          }}
        />,
      );
    });

    const panel = container?.querySelector("#panel-details");
    expect(panel?.textContent).toContain(
      "0x7A42...19E8 • Contrato inteligente ERC-721 verificado.",
    );
  });
});
