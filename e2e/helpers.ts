import { expect, type Page } from "@playwright/test";

/** Adiciona um NFT ao carrinho pela interface (POST /api/cart/items via MSW). */
export async function addNftToCart(page: Page, nftId = "1") {
  await page.goto(`/nfts/${nftId}`);
  await page.getByRole("button", { name: "COMPRAR" }).click();
  await expect(page).toHaveURL(/\/cart$/);
}

/** Reseta banco mock, cenários e storage local via painel do ScenarioSwitcher. */
export async function resetScenarioState(page: Page) {
  await page.goto("/?scenarios=1");
  await page.getByTestId("scenario-switcher-toggle").click();
  const navigated = page.waitForEvent("load");
  await page.getByTestId("reset-db-button").click();
  await navigated;
}
