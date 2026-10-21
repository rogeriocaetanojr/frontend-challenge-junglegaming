import { expect, test } from "@playwright/test";

import {
  expectLoggedIn,
  expectLoggedOut,
  isMobileViewport,
  openLoginModal,
  openProfileFromNav,
} from "./helpers";

const DEMO_EMAIL = "demo@jungle.com";
const DEMO_PASSWORD = "Password123!";

/**
 * Autenticação integrada à API simulada (MSW) via AuthModal, que reutiliza
 * LoginForm e RegisterForm. Credenciais inválidas não autenticam.
 */
test.describe("Autenticação via Modal (E2E)", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
    await page.reload();
  });

  const openModal = async (page: import("@playwright/test").Page) => {
    await openLoginModal(page);
    const modal = page.getByRole("dialog");
    await expect(modal).toBeVisible();
    return modal;
  };

  test("deve autenticar com credenciais válidas e refletir a sessão no cabeçalho", async ({
    page,
  }) => {
    const modal = await openModal(page);
    await modal.getByLabel(/e-mail/i).fill(DEMO_EMAIL);
    await modal.getByLabel(/senha/i).fill(DEMO_PASSWORD);
    await modal.locator('button[type="submit"]').click();

    await expect(modal).not.toBeVisible();
    await expectLoggedIn(page);

    // A sessão sobrevive ao refresh
    await page.reload();
    await expectLoggedIn(page);
  });

  test("deve rejeitar credenciais inválidas sem autenticar", async ({ page }) => {
    const modal = await openModal(page);
    await modal.getByLabel(/e-mail/i).fill(DEMO_EMAIL);
    await modal.getByLabel(/senha/i).fill("SenhaErrada999");
    await modal.locator('button[type="submit"]').click();

    await expect(modal.getByRole("alert").first()).toBeVisible();
    await expect(modal).toBeVisible();
    if (!isMobileViewport(page)) {
      await expect(
        page.getByRole("banner").getByRole("button", { name: /^entrar$/i }),
      ).toBeVisible();
    }
  });

  test("deve validar campos obrigatórios do login", async ({ page }) => {
    const modal = await openModal(page);
    await modal.locator('button[type="submit"]').click();

    await expect(modal).toBeVisible();
    await expect(modal).toContainText(/obrigatório/i);
  });

  test("deve alternar entre as abas 'Entrar' e 'Criar conta'", async ({ page }) => {
    const modal = await openModal(page);

    await modal.getByRole("button", { name: "Criar conta" }).click();
    await expect(modal.getByLabel("Nome", { exact: false }).first()).toBeVisible();
    await expect(modal.getByLabel(/confirm/i)).toBeVisible();

    await modal.getByRole("button", { name: "Entrar", exact: true }).click();
    await expect(modal.getByLabel(/^senha/i)).toBeVisible();
  });

  test("deve concluir o cadastro com autenticação automática", async ({ page }) => {
    const modal = await openModal(page);
    await modal.getByRole("button", { name: "Criar conta" }).click();

    await modal.getByLabel("Nome", { exact: false }).first().fill("CryptoCollector");
    await modal.getByLabel(/e-mail/i).fill("collector@kurio.art");
    await modal.locator("#register-password").fill("MinhaSenha123!");
    await modal.locator("#register-confirm-password").fill("MinhaSenha123!");
    await modal.locator('button[type="submit"]').click();

    await expect(modal).not.toBeVisible();
    await expectLoggedIn(page);
  });

  test("deve encerrar a sessão ao sair e voltar a exigir login em rota privada", async ({
    page,
  }) => {
    const modal = await openModal(page);
    await modal.getByLabel(/e-mail/i).fill(DEMO_EMAIL);
    await modal.getByLabel(/senha/i).fill(DEMO_PASSWORD);
    await modal.locator('button[type="submit"]').click();
    await expect(modal).not.toBeVisible();

    await openProfileFromNav(page);
    await expect(page).toHaveURL(/\/profile$/);
    await page
      .getByRole("button", { name: /sair|logout/i })
      .first()
      .click();

    await expectLoggedOut(page);
    await page.goto("/profile");
    await expect(page).toHaveURL(/\/login\?redirect=%2Fprofile/);
  });

  test("deve permitir fechar o modal através do botão de fechar (X)", async ({
    page,
  }) => {
    const modal = await openModal(page);
    await modal.getByRole("button", { name: /fechar modal/i }).click();
    await expect(modal).not.toBeVisible();
  });
});
