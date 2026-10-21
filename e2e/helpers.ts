import { expect, type Locator, type Page } from "@playwright/test";

/** Adiciona um NFT ao carrinho pela interface (POST /api/cart/items via MSW). */
export async function addNftToCart(page: Page, nftId = "1") {
  await page.goto(`/nfts/${nftId}`);
  await page.getByRole("button", { name: "COMPRAR" }).click();
  await expect(page).toHaveURL(/\/cart$/);
}

/** Abaixo de 768px o cabeçalho desktop dá lugar à navegação inferior (layout do Figma). */
export function isMobileViewport(page: Page): boolean {
  return (page.viewportSize()?.width ?? 1280) < 768;
}

/** Abre o modal de login pelo gatilho visível na viewport atual. */
export async function openLoginModal(page: Page) {
  const trigger = isMobileViewport(page)
    ? page.getByRole("button", { name: "Minha conta" })
    : page.getByRole("banner").getByRole("button", { name: /^entrar$/i });
  await trigger.click();
}

/** Link do carrinho no elemento visível da viewport (cabeçalho no desktop, barra inferior no mobile). */
export function getCartLink(page: Page): Locator {
  return isMobileViewport(page)
    ? page.getByRole("link", { name: "Abrir carrinho" })
    : page.getByRole("link", { name: /Carrinho de compras com/ });
}

/** Abre a página de perfil pelo atalho de conta da viewport atual (exige sessão ativa). */
export async function openProfileFromNav(page: Page) {
  const link = isMobileViewport(page)
    ? page.getByRole("button", { name: "Minha conta" })
    : page.getByRole("banner").getByTitle("Ver meu perfil");
  await link.click();
}

/** Afirma sessão ativa: avatar no cabeçalho (desktop) ou "Minha conta" levando ao perfil (mobile). */
export async function expectLoggedIn(page: Page) {
  if (isMobileViewport(page)) {
    await openProfileFromNav(page);
    await expect(page).toHaveURL(/\/profile$/);
    return;
  }
  await expect(page.getByRole("banner").getByTitle("Ver meu perfil")).toBeVisible();
}

/** Afirma visitante: botão "Entrar" (desktop) ou "Minha conta" abrindo o modal de login (mobile). */
export async function expectLoggedOut(page: Page) {
  if (isMobileViewport(page)) {
    await page.getByRole("button", { name: "Minha conta" }).click();
    await expect(page.getByRole("dialog")).toBeVisible();
    return;
  }
  await expect(
    page.getByRole("banner").getByRole("button", { name: /^entrar$/i }),
  ).toBeVisible();
}

/** Autentica o usuário demo pelo AuthModal. */
export async function loginViaModal(page: Page) {
  await openLoginModal(page);
  const modal = page.getByRole("dialog");
  await modal.getByLabel(/e-mail/i).fill("demo@jungle.com");
  await modal.getByLabel(/senha/i).fill("Password123!");
  await modal.locator('button[type="submit"]').click();
  await expect(modal).not.toBeVisible();
}

/** Reseta banco mock, cenários e storage local via painel do ScenarioSwitcher. */
export async function resetScenarioState(page: Page) {
  await page.goto("/?scenarios=1");
  await page.getByTestId("scenario-switcher-toggle").click();
  const navigated = page.waitForEvent("load");
  await page.getByTestId("reset-db-button").click();
  await navigated;
}
