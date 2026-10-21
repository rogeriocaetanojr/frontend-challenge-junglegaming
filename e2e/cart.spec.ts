import { expect, test } from "@playwright/test";

import {
  addNftToCart,
  getCartLink,
  isMobileViewport,
  loginViaModal,
  resetScenarioState,
} from "./helpers";

test.describe("Carrinho integrado à API simulada (E2E)", () => {
  test.beforeEach(async ({ page }) => {
    await resetScenarioState(page);
  });

  test("visitante começa com carrinho vazio e mantém itens após refresh", async ({
    page,
  }) => {
    await page.goto("/cart");
    await expect(page.getByText("Seu Carrinho está Vazio")).toBeVisible();

    await addNftToCart(page);
    await expect(page.getByRole("list", { name: "Itens do carrinho" })).toBeVisible();

    await page.reload();
    await expect(page.getByRole("list", { name: "Itens do carrinho" })).toBeVisible();
    await expect(getCartLink(page)).toBeVisible();
    if (!isMobileViewport(page)) {
      await expect(getCartLink(page)).toHaveAccessibleName(
        /Carrinho de compras com 1 itens/,
      );
    }
  });

  test("deve alterar quantidade e remover item pela API", async ({ page }) => {
    await addNftToCart(page);

    await page.getByRole("button", { name: /Aumentar quantidade/ }).click();
    await expect(page.getByText("2", { exact: true }).first()).toBeVisible();

    await page.getByRole("button", { name: /Remover .* do carrinho/ }).click();
    await expect(page.getByText("Seu Carrinho está Vazio")).toBeVisible();
  });

  test("deve validar cupom exclusivamente pela API", async ({ page }) => {
    await addNftToCart(page);

    await page.getByLabel("Código promocional").fill("CUPOMFALSO");
    await page.getByRole("button", { name: "Aplicar" }).click();
    await expect(page.getByText(/inválido/i)).toBeVisible();

    await page.getByLabel("Código promocional").fill("JUNGLE10");
    await page.getByRole("button", { name: "Aplicar" }).click();
    await expect(page.getByText("JUNGLE10 (aplicado)")).toBeVisible();
    await expect(page.getByText(/\(-\) 0\.\d{2}/)).toBeVisible();
  });

  test("deve mesclar o carrinho do visitante ao autenticar", async ({ page }) => {
    await addNftToCart(page);

    await loginViaModal(page);

    await expect(page.getByRole("list", { name: "Itens do carrinho" })).toBeVisible();
    await page.reload();
    await expect(page.getByRole("list", { name: "Itens do carrinho" })).toBeVisible();
  });
});
