import { expect, type Page, test } from "@playwright/test";

import { loginViaModal, resetScenarioState } from "./helpers";

/**
 * Eventos disparados pelo servidor simulado (camada MSW). O transporte até a UI
 * passa pelo `socket.io-client` real, interceptado pelo `@mswjs/socket.io-binding`.
 */
type MockRealtime = {
  emitNftUpdated: (p: { nftId: string; price: string; available: number }) => {
    eventId: string;
    version: number;
  };
  emitOrderUpdated: (p: { orderId: string; status: string; userId?: string }) => unknown;
  replay: (event: unknown) => void;
  dropConnections: () => void;
  isBound: () => boolean;
  deliveries: { event: string; userId?: string; resourceId?: string }[];
};

declare global {
  interface Window {
    __mockRealtime?: MockRealtime;
  }
}

/** Aguarda o socket autenticado (handshake + `session.bind`). */
async function waitForSocketBound(page: Page) {
  await expect
    .poll(() => page.evaluate(() => window.__mockRealtime?.isBound() ?? false))
    .toBe(true);
}

const emitNftUpdated = (page: Page, price: string, available: number) =>
  page.evaluate(
    ([p, a]) =>
      window.__mockRealtime!.emitNftUpdated({ nftId: "nft-1", price: p, available: a }),
    [price, available] as const,
  );

test.describe("Tempo real via Socket.IO (E2E)", () => {
  test.beforeEach(async ({ page }) => {
    // O carrinho semeado do usuário demo já contém 1x nft-1; logar sem itens de visitante
    // mantém o estado determinístico (o merge do visitante é coberto em cart.spec.ts)
    await resetScenarioState(page);
    await loginViaModal(page);
  });

  test("nft.updated atualiza o carrinho e avisa a alteração", async ({ page }) => {
    await page.goto("/cart");
    const summary = page.getByTestId("cart-summary");
    await expect(summary).toContainText("1.192 ETH");
    await waitForSocketBound(page);

    await emitNftUpdated(page, "2.50", 3);

    await expect(summary.getByRole("status")).toContainText("2.502 ETH");
    await expect(summary).toContainText("2.50 ETH");
  });

  test("checkout bloqueia cotação desatualizada e exige nova confirmação", async ({
    page,
  }) => {
    const orderPosts: string[] = [];
    page.on("request", (req) => {
      if (req.method() === "POST" && req.url().endsWith("/api/checkout/orders")) {
        orderPosts.push(req.url());
      }
    });

    await page.goto("/payment");
    const confirm = page.getByRole("button", { name: /confirmar compra/i });
    await expect(confirm).toBeEnabled();
    await expect(page.getByText("1.192 ETH")).toBeVisible();
    await waitForSocketBound(page);

    // Evento chega no mesmo instante do clique: o usuário revisou o total antigo
    await page.evaluate(() => {
      window.__mockRealtime!.emitNftUpdated({
        nftId: "nft-1",
        price: "2.50",
        available: 3,
      });
      const button = Array.from(document.querySelectorAll("button")).find((b) =>
        /confirmar compra/i.test(b.textContent ?? ""),
      );
      button?.click();
    });

    await expect(page.getByRole("alert")).toContainText("Os valores do pedido mudaram");
    await expect(page.getByRole("status").filter({ hasText: "2.502 ETH" })).toBeVisible();
    expect(orderPosts).toHaveLength(0);

    // Nova confirmação com os valores atualizados
    await confirm.click();
    await expect(page.getByRole("dialog")).toBeVisible({ timeout: 10_000 });
    expect(orderPosts).toHaveLength(1);
  });

  test("descarta eventos duplicados e antigos sem refazer consultas", async ({
    page,
  }) => {
    await page.goto("/cart");
    const summary = page.getByTestId("cart-summary");
    await waitForSocketBound(page);

    const latest = await emitNftUpdated(page, "3.00", 4);
    await expect(summary).toContainText("3.002 ETH");

    let refetches = 0;
    page.on("request", (req) => {
      if (/\/api\/(cart|quotes)$/.test(req.url())) refetches += 1;
    });

    // Duplicata (mesmo eventId) e evento antigo (versão inferior)
    await page.evaluate((event) => {
      const rt = window.__mockRealtime!;
      rt.replay(event);
      rt.replay({
        ...event,
        eventId: "evt_antigo",
        version: event.version - 1,
        payload: { price: "0.50", available: 9 },
      });
    }, latest);

    await page.waitForTimeout(1_000);
    expect(refetches).toBe(0);
    await expect(summary).toContainText("3.002 ETH");
  });

  test("reconcilia com a API REST após queda e reconexão do socket", async ({ page }) => {
    await page.goto("/cart");
    const summary = page.getByTestId("cart-summary");
    await expect(summary).toContainText("1.192 ETH");
    await waitForSocketBound(page);

    // Queda da conexão; a alteração acontece enquanto o cliente está offline
    await page.evaluate(() => {
      window.__mockRealtime!.dropConnections();
      window.__mockRealtime!.emitNftUpdated({
        nftId: "nft-1",
        price: "1.75",
        available: 2,
      });
    });

    // Ao reconectar, o cliente revalida os recursos ativos via REST
    await expect(summary).toContainText("1.752 ETH", { timeout: 15_000 });
  });

  test("order.updated chega apenas ao usuário dono do pedido", async ({ page }) => {
    await page.goto("/cart");
    await waitForSocketBound(page);

    const delivered = await page.evaluate(() => {
      const rt = window.__mockRealtime!;
      rt.deliveries.length = 0;
      rt.emitOrderUpdated({
        orderId: "order-outro",
        status: "confirmed",
        userId: "user_outro",
      });
      rt.emitOrderUpdated({
        orderId: "order-demo",
        status: "confirmed",
        userId: "user_demo",
      });
      return rt.deliveries.filter((d) => d.event === "order.updated");
    });

    expect(delivered.map((d) => d.resourceId)).toEqual(["order-demo"]);
    expect(delivered.every((d) => d.userId === "user_demo")).toBe(true);
  });
});
