import { expect, test } from "@playwright/test";

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
    await page.goto("/");
    // Inicializa item estável no carrinho via localStorage
    await page.evaluate(() => {
      const cartState = {
        state: {
          items: [
            {
              id: "1",
              title: "Emerald Ape #042",
              price: "2.45",
              priceEth: 2.45,
              image: "/images/nfts/emerald-ape.png",
              quantity: 1,
            },
          ],
          appliedCoupon: "JUNGLE10",
        },
        version: 0,
      };
      localStorage.setItem("@nft-marketplace:cart", JSON.stringify(cartState));
    });

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
    await page.goto("/");
    // Configura sessão e carrinho prévio para o checkout
    await page.evaluate(() => {
      const cartState = {
        state: {
          items: [
            {
              id: "1",
              title: "Emerald Ape #042",
              price: "2.45",
              priceEth: 2.45,
              image: "/images/nfts/emerald-ape.png",
              quantity: 1,
            },
          ],
        },
        version: 0,
      };
      localStorage.setItem("@nft-marketplace:cart", JSON.stringify(cartState));

      const authState = {
        state: {
          user: {
            id: "usr_mock_001",
            name: "Alex Vance",
            email: "alex.vance@marketplace.local",
            walletAddress: "0x71C8364437a9C27779976872A42F340a6B233921",
            balanceEth: 4.5,
            token: "mock-jwt-token-session-web3",
          },
          isAuthenticated: true,
        },
        version: 0,
      };
      localStorage.setItem("@nft-marketplace:auth", JSON.stringify(authState));
    });

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
