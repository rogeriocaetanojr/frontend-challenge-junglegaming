import { expect, test } from "@playwright/test";

import { isMobileViewport, openLoginModal, resetScenarioState } from "./helpers";

test.describe("Navegação por teclado e acessibilidade (E2E)", () => {
  test.beforeEach(async ({ page }) => {
    await resetScenarioState(page);
  });

  test("primeiro Tab foca o skip link com foco visível", async ({ page, isMobile }) => {
    test.skip(isMobile, "Skip-link exclusivo da navegação desktop com header");
    await page.goto("/");
    const skipLink = page.getByRole("link", { name: "Pular para o conteúdo principal" });
    await expect(page.getByRole("banner")).toBeVisible();
    await page.keyboard.press("Tab");

    await expect(skipLink).toBeFocused();
    await expect(skipLink).toBeVisible();

    await page.keyboard.press("Enter");
    await expect(page).toHaveURL(/#main-content$/);
  });

  test("modal de login prende o foco, fecha com Escape e devolve o foco", async ({
    page,
  }) => {
    await page.goto("/");
    const trigger = isMobileViewport(page)
      ? page.getByRole("button", { name: "Minha conta" })
      : page.getByRole("banner").getByRole("button", { name: /^entrar$/i });
    await trigger.focus();
    await page.keyboard.press("Enter");

    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    await expect(dialog.getByLabel(/e-mail/i)).toBeFocused();

    // O foco circula dentro do diálogo nos dois sentidos
    for (let i = 0; i < 20; i += 1) {
      await page.keyboard.press("Tab");
      expect(await dialog.evaluate((el) => el.contains(document.activeElement))).toBe(
        true,
      );
    }
    for (let i = 0; i < 5; i += 1) {
      await page.keyboard.press("Shift+Tab");
      expect(await dialog.evaluate((el) => el.contains(document.activeElement))).toBe(
        true,
      );
    }

    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
    await expect(trigger).toBeFocused();
  });

  test("valida o formulário via teclado com erros associados aos campos", async ({
    page,
  }) => {
    await page.goto("/");
    await openLoginModal(page);
    const dialog = page.getByRole("dialog");

    await dialog.getByLabel(/e-mail/i).press("Enter");

    const email = dialog.getByLabel(/e-mail/i);
    const password = dialog.locator("#login-password");
    await expect(email).toHaveAttribute("aria-invalid", "true");
    await expect(password).toHaveAttribute("aria-invalid", "true");
    await expect(email).toHaveAttribute("aria-describedby", "login-email-error");
    await expect(dialog.locator("#login-email-error")).toHaveAttribute("role", "alert");
    await expect(dialog.locator("#login-password-error")).toHaveText(
      "Senha é obrigatória",
    );
  });
});
