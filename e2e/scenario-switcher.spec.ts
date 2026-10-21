import { expect, test } from "@playwright/test";

import { addNftToCart } from "./helpers";

test.describe("ScenarioSwitcher via query param (E2E)", () => {
  test("painel não aparece sem ?scenarios=1", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByTestId("scenario-switcher-toggle")).toHaveCount(0);
  });

  test("deve alternar cenário de rede pela UI e resetar banco/estado local", async ({
    page,
  }) => {
    await page.goto("/?scenarios=1");
    await addNftToCart(page);

    await page.getByTestId("scenario-switcher-toggle").click();
    const drawer = page.getByTestId("scenario-switcher-drawer");
    await expect(drawer).toBeVisible();

    await page.getByTestId("scenario-select").selectOption("slow_network");
    await expect(page.getByTestId("latency-display")).toHaveText("2000 ms");

    const navigated = page.waitForEvent("load");
    await page.getByTestId("reset-db-button").click();
    await navigated;

    await page.goto("/cart");
    await expect(page.getByText("Seu Carrinho está Vazio")).toBeVisible();
  });
});
