import { expect, test } from "@playwright/test";

import { loginViaModal, resetScenarioState } from "./helpers";

test.describe("Favoritos com mutação otimista (E2E)", () => {
  test.beforeEach(async ({ page }) => {
    await resetScenarioState(page);
  });

  test("deve favoritar e desfavoritar um NFT refletindo de imediato na UI", async ({
    page,
  }) => {
    // nft-1 e nft-2 já são favoritos do usuário demo nos seeds.
    await page.goto("/nfts/3");
    await loginViaModal(page);
    // Aguarda o carregamento dos favoritos do usuário antes de interagir.
    await page.waitForLoadState("networkidle");
    const favoriteButton = page.getByRole("button", { name: "Favoritar NFT" });
    await expect(favoriteButton).toBeVisible();

    const favoriteSaved = page.waitForResponse(
      (res) => res.request().method() === "POST" && res.url().endsWith("/api/favorites"),
    );
    await favoriteButton.click();
    await expect(page.getByRole("button", { name: "Desfavoritar NFT" })).toBeVisible();
    await favoriteSaved;

    await page.reload();
    await expect(page.getByRole("button", { name: "Desfavoritar NFT" })).toBeVisible();

    await page.getByRole("button", { name: "Desfavoritar NFT" }).click();
    await expect(favoriteButton).toBeVisible();
  });

  test("deve listar e remover favoritos pela página de perfil", async ({ page }) => {
    await page.goto("/nfts/1");
    await page.getByRole("button", { name: "Favoritar NFT" }).click();

    await loginViaModal(page);

    await page.goto("/profile");
    await expect(page.getByRole("button", { name: /remover/i }).first()).toBeVisible();
  });
});
