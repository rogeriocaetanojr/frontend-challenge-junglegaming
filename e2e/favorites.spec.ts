import { expect, test } from "@playwright/test";

import { resetScenarioState } from "./helpers";

test.describe("Favoritos com mutação otimista (E2E)", () => {
  test.beforeEach(async ({ page }) => {
    await resetScenarioState(page);
  });

  test("deve favoritar e desfavoritar um NFT refletindo de imediato na UI", async ({
    page,
  }) => {
    await page.goto("/nfts/1");
    const favoriteButton = page.getByRole("button", { name: "Favoritar NFT" });
    await expect(favoriteButton).toBeVisible();

    await favoriteButton.click();
    await expect(page.getByRole("button", { name: "Desfavoritar NFT" })).toBeVisible();

    await page.reload();
    await expect(page.getByRole("button", { name: "Desfavoritar NFT" })).toBeVisible();

    await page.getByRole("button", { name: "Desfavoritar NFT" }).click();
    await expect(favoriteButton).toBeVisible();
  });

  test("deve listar e remover favoritos pela página de perfil", async ({ page }) => {
    await page.goto("/nfts/1");
    await page.getByRole("button", { name: "Favoritar NFT" }).click();

    await page
      .getByRole("banner")
      .getByRole("button", { name: /^entrar$/i })
      .click();
    const modal = page.getByRole("dialog");
    await modal.getByLabel(/e-mail/i).fill("demo@jungle.com");
    await modal.getByLabel(/senha/i).fill("Password123!");
    await modal.locator('button[type="submit"]').click();
    await expect(modal).not.toBeVisible();

    await page.goto("/profile");
    await expect(page.getByRole("button", { name: /remover/i }).first()).toBeVisible();
  });
});
