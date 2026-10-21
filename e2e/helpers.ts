import { expect, type Page } from "@playwright/test";

/** Adiciona um NFT ao carrinho pela interface (POST /api/cart/items via MSW). */
export async function addNftToCart(page: Page, nftId = "1") {
  await page.goto(`/nfts/${nftId}`);
  await page.getByRole("button", { name: "COMPRAR" }).click();
  await expect(page).toHaveURL(/\/cart$/);
}

/** Autentica o usuário demo pelo AuthModal do cabeçalho. */
export async function loginViaModal(page: Page) {
  await page
    .getByRole("banner")
    .getByRole("button", { name: /^entrar$/i })
    .click();
  const modal = page.getByRole("dialog");
  await modal.getByLabel(/e-mail/i).fill("demo@jungle.com");
  await modal.getByLabel(/senha/i).fill("Password123!");
  await modal.locator('button[type="submit"]').click();
  await expect(modal).not.toBeVisible();
}

/** Reseta banco mock, cenários e storage local via painel do ScenarioSwitcher. */
export async function resetScenarioState(page: Page) {
  await page.goto("/?scenarios=1");
  await page.getByTestId("scenario-switcher-toggle").click();
  const navigated = page.waitForEvent("load");
  await page.getByTestId("reset-db-button").click();
  await navigated;
}
