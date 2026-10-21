import { expect, type Page } from "@playwright/test";

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

/** Caminho atual (pathname + search), usado como destino de retorno do login. */
function currentPath(page: Page): string {
  const url = new URL(page.url());
  return `${url.pathname}${url.search}`;
}

/**
 * No mobile a navegação inferior ("Minha conta") só existe na Home (frame Início do Figma);
 * fora dela não há gatilho de conta, então os helpers voltam à Home antes de usá-lo.
 */
async function ensureMobileBottomNav(page: Page) {
  await hideQueryDevtools(page);
  if (new URL(page.url()).pathname !== "/") await page.goto("/");
}

const hiddenDevtoolsPages = new WeakSet<Page>();

/**
 * O botão flutuante do React Query Devtools (só em DEV) cobre o canto da barra inferior
 * onde fica "Minha conta". É ocultado apenas nos fluxos mobile que usam essa barra, de
 * modo que as baselines visuais (que o incluem) não mudam. O init script vale para as
 * próximas navegações; o style tag cobre o documento já carregado.
 */
async function hideQueryDevtools(page: Page) {
  const css = ".tsqd-parent-container { display: none !important; }";
  if (!hiddenDevtoolsPages.has(page)) {
    hiddenDevtoolsPages.add(page);
    await page.addInitScript((content) => {
      const apply = () => {
        const style = document.createElement("style");
        style.textContent = content;
        document.head.appendChild(style);
      };
      if (document.head) apply();
      else document.addEventListener("DOMContentLoaded", apply, { once: true });
    }, css);
  }
  try {
    await page.addStyleTag({ content: css });
  } catch {
    // Navegação em curso: o init script já aplica o estilo no novo documento
  }
  await page.waitForLoadState("domcontentloaded");
}

/** Abre o modal de login pelo gatilho visível na viewport atual. */
export async function openLoginModal(page: Page) {
  if (isMobileViewport(page)) {
    await ensureMobileBottomNav(page);
    await page.getByRole("button", { name: "Minha conta" }).click();
    return;
  }
  await page
    .getByRole("banner")
    .getByRole("button", { name: /^entrar$/i })
    .click();
}

/** Abre a página de perfil pelo atalho de conta da viewport atual (exige sessão ativa). */
export async function openProfileFromNav(page: Page) {
  if (isMobileViewport(page)) {
    await ensureMobileBottomNav(page);
    await page.getByRole("button", { name: "Minha conta" }).click();
    return;
  }
  await page.getByRole("banner").getByTitle("Ver meu perfil").click();
}

/**
 * Alterna o formulário do AuthModal. Desktop: abas "Entrar | Criar conta" no topo.
 * Mobile: as abas ficam ocultas (frame do Figma) e a troca é pelo link do rodapé do formulário.
 */
export async function switchAuthForm(page: Page, target: "login" | "register") {
  const modal = page.getByRole("dialog");
  if (isMobileViewport(page)) {
    const name = target === "register" ? "Crie uma conta" : "Entre";
    await modal.getByRole("link", { name, exact: true }).click();
    return;
  }
  const name = target === "register" ? "Criar conta" : "Entrar";
  await modal.getByRole("button", { name, exact: true }).click();
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
    await openLoginModal(page);
    await expect(page.getByRole("dialog")).toBeVisible();
    return;
  }
  await expect(
    page.getByRole("banner").getByRole("button", { name: /^entrar$/i }),
  ).toBeVisible();
}

/**
 * Autentica o usuário demo sem sair da tela atual.
 * Desktop: AuthModal do cabeçalho. Mobile: rota /login com `redirect` para a tela atual,
 * que é o caminho real do usuário fora da Home (não há barra inferior nessas telas).
 */
export async function loginViaModal(page: Page) {
  if (isMobileViewport(page)) {
    const returnTo = currentPath(page);
    await page.goto(`/login?redirect=${encodeURIComponent(returnTo)}`);
    const form = page.getByRole("form", { name: "Formulário de Login" });
    await form.getByLabel(/e-mail/i).fill("demo@jungle.com");
    await form.getByLabel(/senha/i).fill("Password123!");
    await form.locator('button[type="submit"]').click();
    await expect(page).not.toHaveURL(/\/login/);
    return;
  }
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
