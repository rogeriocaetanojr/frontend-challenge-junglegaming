import { expect, test } from "@playwright/test";

import { addNftToCart } from "./helpers";

/**
 * Suíte de Regressão Visual E2E (Playwright) — Seção 9 do Edital.
 *
 * Captura snapshots estáveis das telas principais da aplicação:
 * 1. Início / Catálogo Principal (Home)
 * 2. Detalhes do NFT
 * 3. Carrinho de Compras (Cart)
 * 4. Pagamento e Revisão (Checkout)
 */
test.describe("Regressão Visual (E2E)", () => {
  test.beforeEach(async ({ page }) => {
    // Configura viewport estável para evitar variações
    await page.setViewportSize({ width: 1280, height: 800 });
  });

  test("deve corresponder à baseline visual da Home / Catálogo", async ({ page }) => {
    await page.goto("/");
    // Aguarda o término da renderização do catálogo e imagens
    await page.waitForSelector("#catalog-section");
    await page.waitForLoadState("networkidle");

    // Desativa animações/transições para consistência visual absoluta
    await page.addStyleTag({
      content: `
        *, *::before, *::after {
          animation-duration: 0s !important;
          animation-delay: 0s !important;
          transition-duration: 0s !important;
          transition-delay: 0s !important;
        }
      `,
    });

    await expect(page).toHaveScreenshot("home-catalog.png", {
      maxDiffPixelRatio: 0.05,
      animations: "disabled",
    });
  });

  test("deve corresponder à baseline visual da tela de Detalhes do NFT", async ({
    page,
  }) => {
    await page.goto("/nft/1");
    await page.waitForLoadState("networkidle");

    await page.addStyleTag({
      content: `
        *, *::before, *::after {
          animation-duration: 0s !important;
          animation-delay: 0s !important;
          transition-duration: 0s !important;
          transition-delay: 0s !important;
        }
      `,
    });

    await expect(page).toHaveScreenshot("nft-detail.png", {
      maxDiffPixelRatio: 0.05,
      animations: "disabled",
    });
  });

  test("deve corresponder à baseline visual da tela do Carrinho com itens", async ({
    page,
  }) => {
    await addNftToCart(page);

    await page.goto("/cart");
    await page.waitForLoadState("networkidle");

    await page.addStyleTag({
      content: `
        *, *::before, *::after {
          animation-duration: 0s !important;
          animation-delay: 0s !important;
          transition-duration: 0s !important;
          transition-delay: 0s !important;
        }
      `,
    });

    await expect(page).toHaveScreenshot("cart-page.png", {
      maxDiffPixelRatio: 0.05,
      animations: "disabled",
    });
  });

  test("deve corresponder à baseline visual da tela de Pagamento / Checkout", async ({
    page,
  }) => {
    await addNftToCart(page);

    // Autentica pela API simulada (a rota de pagamento é privada); o carrinho do visitante é mesclado
    await page
      .getByRole("banner")
      .getByRole("button", { name: /^entrar$/i })
      .click();
    const modal = page.getByRole("dialog");
    await modal.getByLabel(/e-mail/i).fill("demo@jungle.com");
    await modal.getByLabel(/senha/i).fill("Password123!");
    await modal.locator('button[type="submit"]').click();
    await expect(modal).not.toBeVisible();

    await page.goto("/checkout");
    await page.waitForLoadState("networkidle");

    await page.addStyleTag({
      content: `
        *, *::before, *::after {
          animation-duration: 0s !important;
          animation-delay: 0s !important;
          transition-duration: 0s !important;
          transition-delay: 0s !important;
        }
      `,
    });

    await expect(page).toHaveScreenshot("checkout-page.png", {
      maxDiffPixelRatio: 0.05,
      animations: "disabled",
    });
  });
});
