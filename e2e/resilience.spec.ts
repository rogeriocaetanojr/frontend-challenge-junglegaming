import { expect, type Page, test } from "@playwright/test";

import { resetScenarioState } from "./helpers";

type MockScenario = {
  setScenario: (name: string) => unknown;
  setFaultRate: (rate: number) => void;
};

/** Configura o motor de cenários do MSW (persistido em sessionStorage). */
const scenario = async (page: Page, fn: "slow" | "fail" | "recover") => {
  await page.waitForFunction(() => "__mockScenario" in window);
  await page.evaluate((mode) => {
    const engine = (window as unknown as { __mockScenario: MockScenario }).__mockScenario;
    if (mode === "slow") engine.setScenario("slow_network");
    if (mode === "fail") engine.setFaultRate(1);
    if (mode === "recover") engine.setFaultRate(0);
  }, fn);
};

/** Primeiro card do catálogo renderizado na home. */
const catalogCard = (page: Page) => page.getByText("Emerald Ape #042").first();

test.describe("Skeletons e resiliência (E2E)", () => {
  test.beforeEach(async ({ page }) => {
    await resetScenarioState(page);
  });

  test("exibe skeletons sob latência e substitui pelo conteúdo", async ({ page }) => {
    await scenario(page, "slow");

    await page.goto("/");
    const catalogSkeleton = page.getByRole("status", {
      name: "Carregando catálogo de NFTs",
    });
    await expect(catalogSkeleton.first()).toBeVisible();
    await expect(catalogCard(page)).toBeVisible({ timeout: 15_000 });
    await expect(catalogSkeleton).toHaveCount(0);

    await page.goto("/nfts/1");
    await expect(page.locator(".animate-shimmer").first()).toBeVisible();
    await expect(
      page.getByRole("heading", { level: 1, name: "Emerald Ape #042" }),
    ).toBeVisible({
      timeout: 15_000,
    });
  });

  test("mostra erro de rede e recupera com nova tentativa", async ({ page }) => {
    await scenario(page, "fail");
    await page.goto("/");

    const alert = page.getByRole("alert").filter({ hasText: /tentar novamente/i });
    await expect(alert).toBeVisible({ timeout: 15_000 });

    await scenario(page, "recover");
    await alert.getByRole("button", { name: /tentar novamente/i }).click();

    await expect(catalogCard(page)).toBeVisible();
    await expect(alert).toHaveCount(0);
  });
});
