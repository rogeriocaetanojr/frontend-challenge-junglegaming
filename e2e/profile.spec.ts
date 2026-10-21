import { expect, type Page, test } from "@playwright/test";

import { loginViaModal, resetScenarioState } from "./helpers";

// Acionado pelo teclado: o `zoom: 0.9` do layout desloca o hit-testing de cliques
// por coordenada no perfil mobile do Playwright.
const save = (page: Page) =>
  page.getByRole("button", { name: "Salvar", exact: true }).press("Enter");

const VALID_ADDRESS = "0x1234567890abcdef1234567890ABCDEF12345678";

test.describe("Perfil e carteiras (E2E)", () => {
  test.beforeEach(async ({ page }) => {
    await resetScenarioState(page);
    await loginViaModal(page);
    await page.goto("/profile");
    await expect(
      page.getByRole("heading", { name: "Perfil do colecionador" }),
    ).toBeVisible();
  });

  test("atualiza nome e avatar com persistência após refresh", async ({ page }) => {
    await page.locator("#profile-displayName").fill("Colecionador E2E");

    page.once("dialog", (dialog) => dialog.accept("/images/nfts/sage-nomad.webp"));
    await page.getByRole("button", { name: "Alterar", exact: true }).click();
    await expect(page.getByRole("img", { name: "Avatar" })).toHaveAttribute(
      "src",
      "/images/nfts/sage-nomad.webp",
    );

    await save(page);
    await expect(page.getByRole("status")).toContainText("Perfil atualizado com sucesso");

    await page.reload();
    await expect(page.locator("#profile-displayName")).toHaveValue("Colecionador E2E");
    await expect(page.getByRole("img", { name: "Avatar" })).toHaveAttribute(
      "src",
      "/images/nfts/sage-nomad.webp",
    );
  });

  test("rejeita senha atual incorreta e aceita a alteração válida", async ({ page }) => {
    await page.locator("#profile-currentPassword").fill("SenhaErrada!");
    await page.locator("#profile-newPassword").fill("NovaSenha123!");
    await page.locator("#profile-confirmNewPassword").fill("NovaSenha123!");
    await save(page);
    await expect(page.getByRole("alert")).toContainText(
      "senha atual informada está incorreta",
    );

    await page.locator("#profile-currentPassword").fill("Password123!");
    await save(page);
    await expect(page.getByRole("status")).toContainText("Perfil atualizado com sucesso");
  });

  test("cadastra carteiras principal e secundária com validação da API", async ({
    page,
  }) => {
    await page.getByRole("button", { name: "Carteiras" }).click();
    await expect(page.getByRole("heading", { name: "Carteira principal" })).toBeVisible();

    const form = page.locator("form").filter({ has: page.locator("#wallet-address") });
    await page.locator("#wallet-network").selectOption({ index: 1 });
    await page.locator("#wallet-type").selectOption({ index: 1 });
    await page.locator("#wallet-referral").fill("KURIO");
    await page.locator("#wallet-ens").fill("colecionador");

    // Endereço inválido: erro retornado pela API
    await page.locator("#wallet-address").fill("0x123");
    await form.getByRole("button", { name: "Salvar carteira" }).click();
    await expect(page.getByRole("alert")).toContainText(/inválido/i);

    await page.locator("#wallet-address").fill(VALID_ADDRESS);
    await form.getByRole("button", { name: "Salvar carteira" }).click();
    await expect(page.getByRole("status")).toContainText("Carteira salva com sucesso");

    await page
      .locator("#wallet-secondary-optional")
      .fill(VALID_ADDRESS.replace("0x1", "0x9"));
    await page
      .getByRole("heading", { name: "Carteira secundária" })
      .locator("xpath=ancestor::div[contains(@class,'border-t')]")
      .getByRole("button", { name: "Adicionar" })
      .click();
    await expect(page.getByRole("status")).toContainText(
      "Carteira secundária adicionada",
    );
  });
});
