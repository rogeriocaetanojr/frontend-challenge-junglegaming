import { expect, test } from "@playwright/test";

import { resetScenarioState } from "./helpers";

test.describe("Página de detalhe do NFT (E2E)", () => {
  test.beforeEach(async ({ page }) => {
    await resetScenarioState(page);
  });

  test("deve exibir informações principais e permitir adicionar ao carrinho", async ({
    page,
  }) => {
    await page.goto("/nfts/1");
    await expect(page.getByRole("button", { name: "COMPRAR" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Favoritar NFT" })).toBeVisible();

    await page.getByRole("button", { name: "COMPRAR" }).click();
    await expect(page).toHaveURL(/\/cart$/);
  });

  test("deve exibir página 404 para NFT inexistente", async ({ page }) => {
    await page.goto("/nfts/nft-inexistente-999");
    await expect(page.getByRole("heading", { name: "NFT Não Encontrado" })).toBeVisible();
  });
});
