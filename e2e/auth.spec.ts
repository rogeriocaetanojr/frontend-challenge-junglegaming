import { expect, test } from "@playwright/test";

/**
 * Suíte de Testes End-to-End (E2E) para Autenticação e Autorização.
 *
 * Cobertura:
 * 1. Login com credenciais válidas (demo@jungle.com / Password123!), redirecionamento e persistência de sessão.
 * 2. Tentativa de login com credenciais inválidas exibindo mensagem de erro acessível (role="alert").
 * 3. Bloqueio de rota protegida para visitantes deslogados, redirecionando para /login com parâmetro redirect seguro.
 * 4. Cadastro com validação de senhas divergentes e fluxo feliz com auto-login.
 * 5. Expiração de sessão e acionamento do diálogo modal acessível (role="alertdialog").
 */
test.describe("Autenticação e Controle de Acesso (E2E)", () => {
  test.beforeEach(async ({ page }) => {
    // Garante ambiente limpo sem resíduos de storage entre testes
    await page.goto("/");
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
  });

  test("deve realizar login com credenciais válidas, redirecionar e persistir sessão", async ({
    page,
  }) => {
    await page.goto("/login");

    // Valida presença dos campos acessíveis
    const emailInput = page.getByLabel("E-mail");
    const passwordInput = page.getByLabel("Senha");
    const submitButton = page.getByRole("button", {
      name: /entrar na conta/i,
    });

    await expect(emailInput).toBeVisible();
    await expect(passwordInput).toBeVisible();
    await expect(submitButton).toBeVisible();

    // Preenche credenciais da conta de demonstração
    await emailInput.fill("demo@jungle.com");
    await passwordInput.fill("Password123!");

    // Submete o formulário
    await submitButton.click();

    // Redireciona para a página inicial pós-login
    await expect(page).toHaveURL(/\/(?:#.*)?$/);

    // Valida persistência da sessão no localStorage
    const storedSession = await page.evaluate(() => {
      return localStorage.getItem("@nft-marketplace:session_v1");
    });

    expect(storedSession).not.toBeNull();
    expect(storedSession).toContain("user_demo");
  });

  test("deve exibir mensagem de erro acessível com role='alert' ao tentar login com credenciais inválidas", async ({
    page,
  }) => {
    await page.goto("/login");

    const emailInput = page.getByLabel("E-mail");
    const passwordInput = page.getByLabel("Senha");
    const submitButton = page.getByRole("button", {
      name: /entrar na conta/i,
    });

    // Informa credenciais incorretas
    await emailInput.fill("demo@jungle.com");
    await passwordInput.fill("senha_totalmente_errada_123");

    await submitButton.click();

    // Valida alerta acessível com mensagem de erro
    const alert = page.getByRole("alert");
    await expect(alert).toBeVisible();
    await expect(alert).toContainText(/credenciais inválidas/i);

    // Garante que nenhuma sessão foi persistida
    const storedSession = await page.evaluate(() => {
      return localStorage.getItem("@nft-marketplace:session_v1");
    });
    expect(storedSession).toBeNull();
  });

  test("deve bloquear acesso à rota protegida para visitantes e redirecionar para login com parâmetro redirect", async ({
    page,
  }) => {
    // Tenta acessar a rota protegida de checkout desautenticado
    await page.goto("/checkout");

    // Valida redirecionamento automático com query parameter sanitizado
    await expect(page).toHaveURL(/\/login\?redirect=%2Fcheckout/);

    // Verifica que o formulário de login está acessível na tela
    const emailInput = page.getByLabel("E-mail");
    await expect(emailInput).toBeVisible();
  });

  test("deve validar senhas divergentes no cadastro e concluir fluxo de registro com auto-login", async ({
    page,
  }) => {
    await page.goto("/register");

    const nameInput = page.getByLabel("Nome Completo");
    const emailInput = page.getByLabel("E-mail");
    const passwordInput = page.getByLabel("Senha");
    const confirmPasswordInput = page.getByLabel("Confirmar Senha");
    const submitButton = page.getByRole("button", {
      name: /criar conta/i,
    });

    const uniqueEmail = `novo.usuario.${Date.now()}@example.com`;

    // 1. Preenche senhas divergentes
    await nameInput.fill("Colecionador Web3");
    await emailInput.fill(uniqueEmail);
    await passwordInput.fill("SenhaSegura123!");
    await confirmPasswordInput.fill("SenhaTotalmenteDiferente456!");

    await submitButton.click();

    // Valida feedback de erro associado ao campo de confirmação
    const errorMessage = page.locator("#register-confirm-password-error");
    await expect(errorMessage).toBeVisible();
    await expect(errorMessage).toContainText(/as senhas não coincidem/i);

    // 2. Corrige a confirmação de senha para igualar à principal
    await confirmPasswordInput.fill("SenhaSegura123!");
    await submitButton.click();

    // Valida redirecionamento com sucesso e auto-login
    await expect(page).toHaveURL(/\/(?:#.*)?$/);

    const storedSession = await page.evaluate(() => {
      return localStorage.getItem("@nft-marketplace:session_v1");
    });

    expect(storedSession).not.toBeNull();
    expect(storedSession).toContain("mock-token-");
  });

  test("deve exibir o diálogo acessível de sessão expirada sob evento de expiração de token", async ({
    page,
  }) => {
    // 1. Configura sessão ativa prévia no localStorage
    await page.goto("/");
    await page.evaluate(() => {
      const activeSession = {
        version: 1,
        data: {
          token: "mock-token-user_demo-active",
          expiresAt: "2099-01-01T00:00:00.000Z",
          userId: "user_demo",
        },
      };
      localStorage.setItem("@nft-marketplace:session_v1", JSON.stringify(activeSession));
    });

    await page.reload();

    // 2. Dispara evento de expiração de sessão pelo barramento
    await page.evaluate(() => {
      const bus = (
        window as unknown as {
          __authEventBus?: {
            emit: (
              event: string,
              payload: { returnTo: string; timestamp: number },
            ) => boolean;
          };
        }
      ).__authEventBus;

      bus?.emit("auth:expired", {
        returnTo: "/checkout",
        timestamp: Date.now(),
      });
    });

    // 3. Valida modal acessível de sessão expirada
    const alertDialog = page.getByRole("alertdialog");
    await expect(alertDialog).toBeVisible();
    await expect(alertDialog).toContainText("Sessão Expirada");
    await expect(alertDialog).toContainText(
      "Sua sessão de autenticação expirou por motivos de segurança",
    );

    // 4. Aciona botão de reconexão
    const reconnectButton = page.getByRole("button", {
      name: /fazer login novamente/i,
    });
    await expect(reconnectButton).toBeVisible();
    await reconnectButton.click();

    // 5. Valida redirecionamento com redirect seguro
    await expect(page).toHaveURL(/\/login\?redirect=%2Fcheckout/);

    // Modal fechado
    await expect(alertDialog).not.toBeVisible();
  });
});
