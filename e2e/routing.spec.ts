import { expect, test } from "@playwright/test";

/**
 * Roteamento (TanStack Router): estado do catálogo na URL, proteção de rotas privadas,
 * aliases legados e tratamento de rotas inexistentes.
 */
import { resetScenarioState } from "./helpers";

test.describe("Roteamento e estado na URL (E2E)", () => {
  test.beforeEach(async ({ page }) => {
    await resetScenarioState(page);
    await page.evaluate(() => sessionStorage.clear());
  });

  test("deve restaurar a página do catálogo a partir da URL após refresh", async ({
    page,
  }) => {
    await page.goto("/?page=2");
    const pagination = page.getByRole("navigation", { name: "Paginação do catálogo" });
    await expect(pagination.getByRole("button", { name: "Página 2" })).toHaveAttribute(
      "aria-current",
      "page",
    );

    await page.reload();
    await expect(pagination.getByRole("button", { name: "Página 2" })).toHaveAttribute(
      "aria-current",
      "page",
    );

    await pagination.getByRole("button", { name: "Página 1" }).click();
    await expect(page).not.toHaveURL(/page=/);
  });

  test("deve reiniciar a paginação ao filtrar e permitir voltar pelo histórico", async ({
    page,
  }) => {
    await page.goto("/?page=2");
    await expect(
      page.getByRole("navigation", { name: "Paginação do catálogo" }),
    ).toBeVisible();

    await page.getByRole("button", { name: /Arte digital/ }).click();
    await expect(page).toHaveURL(/category=art/);
    await expect(page).not.toHaveURL(/page=/);

    await page.goBack();
    await expect(page).toHaveURL(/page=2/);
    await expect(page).not.toHaveURL(/category=/);
  });

  test("deve sincronizar a busca do cabeçalho com o parâmetro q", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "Buscar no catálogo" }).click();
    await page.getByRole("searchbox").fill("ape");

    await expect(page).toHaveURL(/q=ape/);
  });

  test("deve corrigir uma página fora do intervalo para a última página existente", async ({
    page,
  }) => {
    await page.goto("/?page=99");
    await expect(page).not.toHaveURL(/page=99/);
    await expect(page.getByRole("button", { name: "Próxima página" })).toBeDisabled();
  });

  test("deve redirecionar visitante em rota privada para /login preservando o destino", async ({
    page,
  }) => {
    await page.goto("/payment");
    await expect(page).toHaveURL(/\/login\?redirect=%2Fpayment/);
  });

  test("deve manter o carrinho acessível para visitantes", async ({ page }) => {
    await page.goto("/cart");
    await expect(page).toHaveURL(/\/cart$/);
  });

  test("deve redirecionar o alias legado /nft/:id para /nfts/:id", async ({ page }) => {
    await page.goto("/nft/1");
    await expect(page).toHaveURL(/\/nfts\/1$/);
  });

  test("deve exibir a página 404 para rotas inexistentes", async ({ page }) => {
    await page.goto("/rota-que-nao-existe");
    await expect(
      page.getByRole("heading", { name: "Página Não Encontrada" }),
    ).toBeVisible();
  });
});
