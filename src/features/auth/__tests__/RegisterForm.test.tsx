/**
 * Testes unitários e de integração do formulário de cadastro (RegisterForm) e rota /register.
 */
import { act } from "react";
import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  isRedirect,
  Outlet,
  RouterProvider,
} from "@tanstack/react-router";
import {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

import { authEventBus } from "@/lib/auth/events";
import { clearSession, getSession, hasValidSession } from "@/lib/auth/session-store";
import { queryKeys } from "@/lib/query/keys";
import { resetDb } from "@/mocks/db";
import { scenarioEngine } from "@/mocks/scenarios";
import { server } from "@/mocks/server";
import { Route as RegisterRoute } from "@/routes/register";
import { RegisterForm, type RegisterFormProps } from "../RegisterForm";

// @ts-expect-error IS_REACT_ACT_ENVIRONMENT flag
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

function changeInputValue(input: HTMLInputElement, value: string) {
  const prototype = Object.getPrototypeOf(input);
  const descriptor = Object.getOwnPropertyDescriptor(prototype, "value");
  descriptor?.set?.call(input, value);
  input.dispatchEvent(new Event("input", { bubbles: true }));
  input.dispatchEvent(new Event("change", { bubbles: true }));
  input.dispatchEvent(new Event("blur", { bubbles: true }));
}

describe("Formulário de Cadastro (src/features/auth/RegisterForm.tsx)", () => {
  let queryClient: QueryClient;
  let container: HTMLDivElement | null = null;
  let root: ReturnType<typeof createRoot> | null = null;

  beforeAll(() => {
    server.listen();
  });

  afterAll(() => {
    server.close();
  });

  beforeEach(() => {
    window.scrollTo = vi.fn();
    clearSession();
    resetDb();
    scenarioEngine.reset();

    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false, gcTime: Infinity },
        mutations: { retry: false },
      },
    });

    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    server.resetHandlers();
    if (root) {
      act(() => {
        root?.unmount();
      });
    }
    container?.remove();
    clearSession();
  });

  function createTestRouter(props: RegisterFormProps = {}) {
    const rootRoute = createRootRoute({
      component: () => <Outlet />,
    });

    const indexRoute = createRoute({
      getParentRoute: () => rootRoute,
      path: "/",
      component: () => <RegisterForm {...props} />,
    });

    const routeTree = rootRoute.addChildren([indexRoute]);
    const history = createMemoryHistory({ initialEntries: ["/"] });
    return createRouter({
      routeTree,
      history,
    });
  }

  it("deve renderizar campos de nome, email, senha, confirmação, botão e link para login", async () => {
    const testRouter = createTestRouter();

    await act(async () => {
      root?.render(
        <QueryClientProvider client={queryClient}>
          <RouterProvider router={testRouter} />
        </QueryClientProvider>,
      );
    });

    const nameInput = container?.querySelector("#register-name") as HTMLInputElement;
    const emailInput = container?.querySelector("#register-email") as HTMLInputElement;
    const passwordInput = container?.querySelector(
      "#register-password",
    ) as HTMLInputElement;
    const confirmPasswordInput = container?.querySelector(
      "#register-confirm-password",
    ) as HTMLInputElement;
    const submitButton = container?.querySelector(
      'button[type="submit"]',
    ) as HTMLButtonElement;
    const loginLink = container?.querySelector('a[href="/login"]') as HTMLAnchorElement;

    expect(nameInput).not.toBeNull();
    expect(nameInput.type).toBe("text");
    expect(nameInput.getAttribute("aria-invalid")).toBe("false");

    expect(emailInput).not.toBeNull();
    expect(emailInput.type).toBe("email");
    expect(emailInput.getAttribute("aria-invalid")).toBe("false");

    expect(passwordInput).not.toBeNull();
    expect(passwordInput.type).toBe("password");
    expect(passwordInput.getAttribute("aria-invalid")).toBe("false");

    expect(confirmPasswordInput).not.toBeNull();
    expect(confirmPasswordInput.type).toBe("password");
    expect(confirmPasswordInput.getAttribute("aria-invalid")).toBe("false");

    expect(submitButton).not.toBeNull();
    expect(submitButton.textContent).toContain("Criar conta");

    expect(loginLink).not.toBeNull();
  });

  it("deve preservar parâmetro redirect no link para /login", async () => {
    const testRouter = createTestRouter({
      redirectPath: "/checkout",
    });

    await act(async () => {
      root?.render(
        <QueryClientProvider client={queryClient}>
          <RouterProvider router={testRouter} />
        </QueryClientProvider>,
      );
    });

    const loginLink = container?.querySelector('a[href*="/login"]') as HTMLAnchorElement;
    expect(loginLink).not.toBeNull();
    expect(loginLink.getAttribute("href")).toBe("/login?redirect=%2Fcheckout");
  });

  it("deve validar campos obrigatórios ao submeter formulário vazio", async () => {
    const testRouter = createTestRouter();

    await act(async () => {
      root?.render(
        <QueryClientProvider client={queryClient}>
          <RouterProvider router={testRouter} />
        </QueryClientProvider>,
      );
    });

    const submitButton = container?.querySelector(
      'button[type="submit"]',
    ) as HTMLButtonElement;

    await act(async () => {
      submitButton.click();
    });

    await vi.waitFor(() => {
      const nameError = container?.querySelector("#register-name-error");
      const emailError = container?.querySelector("#register-email-error");
      const passwordError = container?.querySelector("#register-password-error");
      const confirmError = container?.querySelector("#register-confirm-password-error");

      expect(nameError?.textContent).toBe("Nome é obrigatório");
      expect(emailError?.textContent).toBe("E-mail é obrigatório");
      expect(passwordError?.textContent).toBe("Senha é obrigatória");
      expect(confirmError?.textContent).toBe("Confirmação de senha é obrigatória");
    });

    const nameInput = container?.querySelector("#register-name") as HTMLInputElement;
    expect(nameInput.getAttribute("aria-invalid")).toBe("true");
    expect(nameInput.getAttribute("aria-describedby")).toBe("register-name-error");
  });

  it("deve validar senha fraca (< 8 caracteres)", async () => {
    const testRouter = createTestRouter();

    await act(async () => {
      root?.render(
        <QueryClientProvider client={queryClient}>
          <RouterProvider router={testRouter} />
        </QueryClientProvider>,
      );
    });

    const nameInput = container?.querySelector("#register-name") as HTMLInputElement;
    const emailInput = container?.querySelector("#register-email") as HTMLInputElement;
    const passwordInput = container?.querySelector(
      "#register-password",
    ) as HTMLInputElement;
    const confirmPasswordInput = container?.querySelector(
      "#register-confirm-password",
    ) as HTMLInputElement;
    const submitButton = container?.querySelector(
      'button[type="submit"]',
    ) as HTMLButtonElement;

    await act(async () => {
      changeInputValue(nameInput, "João Silva");
      changeInputValue(emailInput, "joao@exemplo.com");
      changeInputValue(passwordInput, "1234567");
      changeInputValue(confirmPasswordInput, "1234567");
    });

    await act(async () => {
      submitButton.click();
    });

    await vi.waitFor(() => {
      const passwordError = container?.querySelector("#register-password-error");
      expect(passwordError?.textContent).toBe("Senha deve ter no mínimo 8 caracteres");
    });
  });

  it("deve validar divergência entre senhas (senhas que não coincidem)", async () => {
    const testRouter = createTestRouter();

    await act(async () => {
      root?.render(
        <QueryClientProvider client={queryClient}>
          <RouterProvider router={testRouter} />
        </QueryClientProvider>,
      );
    });

    const nameInput = container?.querySelector("#register-name") as HTMLInputElement;
    const emailInput = container?.querySelector("#register-email") as HTMLInputElement;
    const passwordInput = container?.querySelector(
      "#register-password",
    ) as HTMLInputElement;
    const confirmPasswordInput = container?.querySelector(
      "#register-confirm-password",
    ) as HTMLInputElement;
    const submitButton = container?.querySelector(
      'button[type="submit"]',
    ) as HTMLButtonElement;

    await act(async () => {
      changeInputValue(nameInput, "João Silva");
      changeInputValue(emailInput, "joao@exemplo.com");
      changeInputValue(passwordInput, "Password123!");
      changeInputValue(confirmPasswordInput, "PasswordDiferente456!");
    });

    await act(async () => {
      submitButton.click();
    });

    await vi.waitFor(() => {
      const confirmError = container?.querySelector("#register-confirm-password-error");
      expect(confirmError?.textContent).toBe("As senhas não coincidem");
    });

    expect(confirmPasswordInput.getAttribute("aria-invalid")).toBe("true");
  });

  it("deve mapear erro 409 (email_taken) para o campo de email, focá-lo e preservar os outros campos", async () => {
    const testRouter = createTestRouter();

    await act(async () => {
      root?.render(
        <QueryClientProvider client={queryClient}>
          <RouterProvider router={testRouter} />
        </QueryClientProvider>,
      );
    });

    const nameInput = container?.querySelector("#register-name") as HTMLInputElement;
    const emailInput = container?.querySelector("#register-email") as HTMLInputElement;
    const passwordInput = container?.querySelector(
      "#register-password",
    ) as HTMLInputElement;
    const confirmPasswordInput = container?.querySelector(
      "#register-confirm-password",
    ) as HTMLInputElement;
    const submitButton = container?.querySelector(
      'button[type="submit"]',
    ) as HTMLButtonElement;

    // demo@jungle.com já existe no banco em memória (SEED_DEMO_USER)
    await act(async () => {
      changeInputValue(nameInput, "Alex Duplicate");
      changeInputValue(emailInput, "demo@jungle.com");
      changeInputValue(passwordInput, "MinhaSenha123!");
      changeInputValue(confirmPasswordInput, "MinhaSenha123!");
    });

    await act(async () => {
      submitButton.click();
      await vi.waitFor(
        () => {
          const emailError = container?.querySelector("#register-email-error");
          expect(emailError).not.toBeNull();
          expect(emailError?.textContent).toContain("já está cadastrado");
          expect(document.activeElement).toBe(emailInput);
        },
        { timeout: 3000 },
      );
    });

    // Garante que os outros campos NÃO foram limpos após o erro 409
    expect(nameInput.value).toBe("Alex Duplicate");
    expect(passwordInput.value).toBe("MinhaSenha123!");
    expect(confirmPasswordInput.value).toBe("MinhaSenha123!");
    expect(hasValidSession()).toBe(false);
  });

  it("deve cadastrar usuário com sucesso, realizar auto-login, atualizar cache e emitir evento", async () => {
    const onSuccessMock = vi.fn();
    const loginEventSpy = vi.fn();
    const unsubscribe = authEventBus.on("auth:login", loginEventSpy);

    const testRouter = createTestRouter({
      onSuccess: onSuccessMock,
    });

    await act(async () => {
      root?.render(
        <QueryClientProvider client={queryClient}>
          <RouterProvider router={testRouter} />
        </QueryClientProvider>,
      );
    });

    const nameInput = container?.querySelector("#register-name") as HTMLInputElement;
    const emailInput = container?.querySelector("#register-email") as HTMLInputElement;
    const passwordInput = container?.querySelector(
      "#register-password",
    ) as HTMLInputElement;
    const confirmPasswordInput = container?.querySelector(
      "#register-confirm-password",
    ) as HTMLInputElement;
    const submitButton = container?.querySelector(
      'button[type="submit"]',
    ) as HTMLButtonElement;

    const newEmail = `user_${Date.now()}@jungle.com`;

    await act(async () => {
      changeInputValue(nameInput, "Novo Colecionador");
      changeInputValue(emailInput, newEmail);
      changeInputValue(passwordInput, "SenhaSegura123!");
      changeInputValue(confirmPasswordInput, "SenhaSegura123!");
    });

    await act(async () => {
      submitButton.click();
      await vi.waitFor(
        () => {
          expect(hasValidSession()).toBe(true);
        },
        { timeout: 3000 },
      );
    });

    const session = getSession();
    expect(session).not.toBeNull();
    expect(session?.token).toBeDefined();

    const cachedSession = queryClient.getQueryData(queryKeys.session());
    expect(cachedSession).toBeDefined();

    expect(loginEventSpy).toHaveBeenCalledTimes(1);
    expect(onSuccessMock).toHaveBeenCalledTimes(1);

    unsubscribe();
  });
});

describe("Rota de Cadastro (src/routes/register.tsx)", () => {
  type BeforeLoadFn = (args: {
    context?: { auth?: { isAuthenticated?: boolean } };
    search?: { redirect?: string };
  }) => void;

  interface RedirectResult {
    options: {
      to: string;
    };
  }

  beforeEach(() => {
    clearSession();
  });

  afterEach(() => {
    clearSession();
  });

  it("validateSearch deve sanitizar parâmetro de busca ?redirect prevenindo Open Redirects", () => {
    const validateSearch = RegisterRoute.options.validateSearch as (
      search: Record<string, unknown>,
    ) => { redirect?: string };
    expect(validateSearch).toBeDefined();

    expect(validateSearch({ redirect: "/market" })).toEqual({
      redirect: "/market",
    });

    expect(validateSearch({ redirect: "https://evil.com" })).toEqual({
      redirect: "/",
    });

    expect(validateSearch({ redirect: "//phishing.org" })).toEqual({
      redirect: "/",
    });

    expect(validateSearch({})).toEqual({
      redirect: undefined,
    });
  });

  it("beforeLoad deve redirecionar usuário já autenticado diretamente para o destino seguro", () => {
    const beforeLoad = RegisterRoute.options.beforeLoad as unknown as BeforeLoadFn;
    expect(beforeLoad).toBeDefined();

    let thrownError: unknown = null;
    try {
      beforeLoad({
        context: { auth: { isAuthenticated: true } },
        search: { redirect: "/catalog" },
      });
    } catch (err) {
      thrownError = err;
    }

    expect(thrownError).toBeDefined();
    expect(isRedirect(thrownError)).toBe(true);
    const redirectObj = thrownError as RedirectResult;
    expect(redirectObj.options.to).toBe("/catalog");
  });

  it("beforeLoad deve redirecionar para / se o destino do redirect for externo ou malicioso", () => {
    const beforeLoad = RegisterRoute.options.beforeLoad as unknown as BeforeLoadFn;

    let thrownError: unknown = null;
    try {
      beforeLoad({
        context: { auth: { isAuthenticated: true } },
        search: { redirect: "https://evil-site.com" },
      });
    } catch (err) {
      thrownError = err;
    }

    expect(isRedirect(thrownError)).toBe(true);
    const redirectObj = thrownError as RedirectResult;
    expect(redirectObj.options.to).toBe("/");
  });

  it("beforeLoad não deve disparar redirecionamento quando o usuário for anônimo/deslogado", () => {
    const beforeLoad = RegisterRoute.options.beforeLoad as unknown as BeforeLoadFn;

    expect(() => {
      beforeLoad({
        context: { auth: { isAuthenticated: false } },
        search: { redirect: "/catalog" },
      });
    }).not.toThrow();
  });
});
