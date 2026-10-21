import { expect, test } from "@playwright/test";

import { addNftToCart } from "./helpers";

test.describe("Checkout integrado à API simulada (E2E)", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await addNftToCart(page);
    await page
      .getByRole("banner")
      .getByRole("button", { name: /^entrar$/i })
      .click();
    const modal = page.getByRole("dialog");
    await modal.getByLabel(/e-mail/i).fill("demo@jungle.com");
    await modal.getByLabel(/senha/i).fill("Password123!");
    await modal.locator('button[type="submit"]').click();
    await expect(modal).not.toBeVisible();
  });

  test("deve criar um único pedido em cliques repetidos e abrir o recibo só após CONFIRMED", async ({
    page,
  }) => {
    const orderRequests: string[] = [];
    page.on("request", (request) => {
      if (request.method() === "POST" && request.url().endsWith("/api/checkout/orders")) {
        orderRequests.push(request.headers()["idempotency-key"] ?? "");
      }
    });

    await page.goto("/payment");
    const confirm = page.getByRole("button", { name: /confirmar compra/i });
    await confirm.dblclick();

    await expect(page.getByRole("dialog")).toBeVisible({ timeout: 10_000 });
    expect(orderRequests).toHaveLength(1);
    expect(orderRequests[0]).toMatch(/^[0-9a-f-]{36}$/);
  });
});
