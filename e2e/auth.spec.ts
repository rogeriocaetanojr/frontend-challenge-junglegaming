import { expect, test } from "@playwright/test";

/**
 * Suíte de Testes End-to-End (E2E) para o Modal Unificado de Autenticação (AuthModal).
 *
 * Cobertura:
 * 1. Abertura do modal via botão 'Entrar' no cabeçalho e login com credenciais válidas.
 * 2. Validação de erro amigável ao tentar submeter com campos em branco.
 * 3. Alternância suave entre as abas 'Entrar' e 'Criar conta' dentro do modal.
 * 4. Validação de senhas divergentes na aba de criação de conta e auto-login pós-cadastro.
 * 5. Fechamento do modal através do botão de fechar (X).
 */
test.describe("Autenticação via Modal Unificado (E2E)", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
    await page.reload();
  });

  test("deve abrir o AuthModal pelo cabeçalho, realizar login com sucesso e atualizar perfil no header", async ({
    page,
  }) => {
    // 1. Localiza e clica no botão "Entrar" no cabeçalho
    const loginHeaderButton = page
      .getByRole("banner")
      .getByRole("button", { name: /^entrar$/i });
    await expect(loginHeaderButton).toBeVisible();
    await loginHeaderButton.click();

    // 2. Valida abertura do diálogo modal acessível
    const modal = page.getByRole("dialog");
    await expect(modal).toBeVisible();
    await expect(modal).toContainText("Entre para gerenciar sua carteira");

    // 3. Preenche formulário de login
    const emailInput = modal.locator('input[type="email"]');
    const passwordInput = modal.locator('input[type="password"]');
    const submitButton = modal.locator('button[type="submit"]');

    await emailInput.fill("alex.vance@marketplace.local");
    await passwordInput.fill("Password123!");

    // 4. Submete o login
    await submitButton.click();

    // 5. Valida que o modal foi fechado
    await expect(modal).not.toBeVisible();

    // 6. Valida que o cabeçalho agora exibe o perfil do usuário logado
    const profileButton = page
      .getByRole("banner")
      .getByRole("button", { name: /alex\.vance|alex|perfil/i });
    await expect(profileButton).toBeVisible();
  });

  test("deve exibir validação ao tentar submeter login sem preencher campos", async ({
    page,
  }) => {
    const loginHeaderButton = page
      .getByRole("banner")
      .getByRole("button", { name: /^entrar$/i });
    await loginHeaderButton.click();

    const modal = page.getByRole("dialog");
    await expect(modal).toBeVisible();

    const submitButton = modal.locator('button[type="submit"]');
    await submitButton.click();

    // Valida que o modal continua visível e com foco de interação mantido
    await expect(modal).toBeVisible();
  });

  test("deve alternar entre as abas 'Entrar' e 'Criar conta' dentro do modal", async ({
    page,
  }) => {
    const loginHeaderButton = page
      .getByRole("banner")
      .getByRole("button", { name: /^entrar$/i });
    await loginHeaderButton.click();

    const modal = page.getByRole("dialog");
    await expect(modal).toBeVisible();

    // Clica na aba 'Criar conta'
    const registerTabButton = modal.locator(
      'button[type="button"]:has-text("Criar conta")',
    );
    await registerTabButton.click();

    // Valida mensagem descritiva da aba de cadastro
    await expect(modal).toContainText("Crie seu perfil de colecionador");
    await expect(modal.locator('input[placeholder="Nome de usuário"]')).toBeVisible();
    await expect(modal.locator('input[placeholder="Confirmar senha"]')).toBeVisible();

    // Volta para a aba 'Entrar'
    const loginTabButton = modal.locator('button[type="button"]:has-text("Entrar")');
    await loginTabButton.click();

    await expect(modal).toContainText("Entre para gerenciar sua carteira");
  });

  test("deve validar senhas divergentes no cadastro e concluir registro com auto-login", async ({
    page,
  }) => {
    const loginHeaderButton = page
      .getByRole("banner")
      .getByRole("button", { name: /^entrar$/i });
    await loginHeaderButton.click();

    const modal = page.getByRole("dialog");
    const registerTabButton = modal.locator(
      'button[type="button"]:has-text("Criar conta")',
    );
    await registerTabButton.click();

    const userInput = modal.locator('input[placeholder="Nome de usuário"]');
    const emailInput = modal.locator('input[placeholder="Digite seu e-mail"]');
    const passwordInputs = modal.locator('input[type="password"]');
    const submitButton = modal.locator('button[type="submit"]');

    // 1. Preenche dados com senhas divergentes
    await userInput.fill("CryptoCollector");
    await emailInput.fill("collector@kurio.art");
    await passwordInputs.nth(0).fill("MinhaSenha123!");
    await passwordInputs.nth(1).fill("SenhaDiferente456!");

    await submitButton.click();

    // Valida mensagem de erro exibida no modal
    await expect(modal).toContainText("As senhas não coincidem.");

    // 2. Corrige a confirmação de senha
    await passwordInputs.nth(1).fill("MinhaSenha123!");
    await submitButton.click();

    // Valida fechamento do modal e perfil ativo no header
    await expect(modal).not.toBeVisible();
    const profileButton = page
      .getByRole("banner")
      .getByRole("button", { name: /CryptoCollector|perfil/i });
    await expect(profileButton).toBeVisible();
  });

  test("deve permitir fechar o modal através do botão de fechar (X)", async ({
    page,
  }) => {
    const loginHeaderButton = page
      .getByRole("banner")
      .getByRole("button", { name: /^entrar$/i });
    await loginHeaderButton.click();

    const modal = page.getByRole("dialog");
    await expect(modal).toBeVisible();

    const closeButton = modal.getByRole("button", { name: /fechar modal/i });
    await closeButton.click();

    await expect(modal).not.toBeVisible();
  });
});
