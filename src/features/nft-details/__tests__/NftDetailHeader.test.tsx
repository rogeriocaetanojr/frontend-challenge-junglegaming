/**
 * Testes unitários para NftDetailHeader (src/features/nft-details/NftDetailHeader.tsx).
 *
 * Validações de título e countdown timer de leilão.
 */
import { act } from "react";
import { createRoot } from "react-dom/client";
import { TestRouter } from "@/test/test-router";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { NftDetailHeader } from "../NftDetailHeader";

// @ts-expect-error IS_REACT_ACT_ENVIRONMENT flag
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

describe("NftDetailHeader (src/features/nft-details/NftDetailHeader.tsx)", () => {
  let container: HTMLDivElement | null = null;
  let root: ReturnType<typeof createRoot> | null = null;

  beforeEach(() => {
    vi.useFakeTimers();
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
    vi.useRealTimers();
  });

  it("deve renderizar o título da obra", async () => {
    await act(async () => {
      root?.render(
        <TestRouter>
          <NftDetailHeader
            nft={{
              title: "Emerald Ape #042",
            }}
          />
        </TestRouter>,
      );
    });

    const heading = container?.querySelector("h1");
    expect(heading?.textContent).toBe("Emerald Ape #042");
  });

  it("deve exibir o timer regressivo com cálculo correto e aria-live='polite' quando endsAt for fornecido", async () => {
    const baseTime = new Date("2026-10-20T12:00:00Z");
    vi.setSystemTime(baseTime);

    // 2 horas, 15 minutos e 30 segundos no futuro
    const endsAt = new Date("2026-10-20T14:15:30Z").toISOString();

    await act(async () => {
      root?.render(
        <TestRouter>
          <NftDetailHeader
            nft={{
              title: "Ape Auction #999",
              endsAt,
            }}
          />
        </TestRouter>,
      );
    });

    const timerContainer = container?.querySelector('[aria-live="polite"]');
    expect(timerContainer).not.toBeNull();
    expect(timerContainer?.textContent).toContain("02h 15m 30s");

    // Avança 1 segundo
    await act(async () => {
      vi.advanceTimersByTime(1000);
    });

    expect(timerContainer?.textContent).toContain("02h 15m 29s");
  });

  it("deve exibir mensagem de leilão encerrado quando endsAt estiver no passado", async () => {
    const baseTime = new Date("2026-10-20T12:00:00Z");
    vi.setSystemTime(baseTime);

    const pastDate = new Date("2026-10-20T11:00:00Z").toISOString();

    await act(async () => {
      root?.render(
        <TestRouter>
          <NftDetailHeader
            nft={{
              title: "Ape Expired #001",
              endsAt: pastDate,
            }}
          />
        </TestRouter>,
      );
    });

    const timerContainer = container?.querySelector('[aria-live="polite"]');
    expect(timerContainer).not.toBeNull();
    expect(timerContainer?.textContent).toContain("Leilão Encerrado");
  });
});
