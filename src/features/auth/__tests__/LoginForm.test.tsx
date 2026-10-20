/**
 * Testes unitários e de integração do formulário de login (LoginForm) e rota /login.
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
import { Route as LoginRoute } from "@/routes/login";
import { LoginForm, type LoginFormProps } from "../LoginForm";

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

describe("Formulário de Login (src/features/auth/LoginForm.tsx)", () => {
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

  function createTestRouter(props: LoginFormProps = {}) {
    const rootRoute = createRootRoute({
      component: () => <Outlet />,
    });

    const indexRoute = createRoute({
      getParentRoute: () => rootRoute,
      path: "/",
      component: () => <LoginForm {...props} />,
    });

    const routeTree = rootRoute.addChildren([indexRoute]);
    const history = createMemoryHistory({ initialEntries: ["/"] });
    return createRouter({
      routeTree,
      history,
    });
  }

  it("deve renderizar os campos de e-mail, senha, botão de login e link de cadastro", async () => {
    const testRouter = createTestRouter();

    await act(async () => {
      root?.render(
        <QueryClientProvider client={queryClient}>
          <RouterProvider router={testRouter} />
        </QueryClientProvider>,
      );
    });

    const emailInput = container?.querySelector("#login-email") as HTMLInputElement;
    const passwordInput = container?.querySelector("#login-password") as HTMLInputElement;
    const submitButton = container?.querySelector(
      'button[type="submit"]',
    ) as HTMLButtonElement;
    const registerLink = container?.querySelector(
      'a[href="/register"]',
    ) as HTMLAnchorElement;

    expect(emailInput).not.toBeNull();
    expect(emailInput.type).toBe("email");
    expect(emailInput.getAttribute("aria-invalid")).toBe("false");

    expect(passwordInput).not.toBeNull();
    expect(passwordInput.type).toBe("password");
    expect(passwordInput.getAttribute("aria-invalid")).toBe("false");

    expect(submitButton).not.toBeNull();
    expect(submitButton.textContent).toContain("Entrar");

    expect(registerLink).not.toBeNull();
  });

  it("deve preservar o parâmetro de redirect seguro no link para /register", async () => {
    const testRouter = createTestRouter({
      redirectPath: "/checkout?step=payment",
    });

    await act(async () => {
      root?.render(
        <QueryClientProvider client={queryClient}>
          <RouterProvider router={testRouter} />
        </QueryClientProvider>,
      );
    });

    const registerLink = container?.querySelector(
      'a[href*="/register"]',
    ) as HTMLAnchorElement;
    expect(registerLink).not.toBeNull();
    expect(registerLink.getAttribute("href")).toContain(
      "redirect=%2Fcheckout%3Fstep%3Dpayment",
    );
  });

  it("deve exibir erros de validação acessíveis quando submetido com campos vazios", async () => {
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
      const emailError = container?.querySelector("#login-email-error");
      const passwordError = container?.querySelector("#login-password-error");
      expect(emailError?.textContent).toBe("E-mail é obrigatório");
      expect(passwordError?.textContent).toBe("Senha é obrigatória");
    });

    const emailError = container?.querySelector("#login-email-error");
    const passwordError = container?.querySelector("#login-password-error");
    expect(emailError?.getAttribute("role")).toBe("alert");
    expect(passwordError?.getAttribute("role")).toBe("alert");

    const emailInput = container?.querySelector("#login-email") as HTMLInputElement;
    expect(emailInput.getAttribute("aria-invalid")).toBe("true");
    expect(emailInput.getAttribute("aria-describedby")).toBe("login-email-error");
  });

  it("deve validar formato de e-mail e tamanho mínimo de senha", async () => {
    const testRouter = createTestRouter();

    await act(async () => {
      root?.render(
        <QueryClientProvider client={queryClient}>
          <RouterProvider router={testRouter} />
        </QueryClientProvider>,
      );
    });

    const emailInput = container?.querySelector("#login-email") as HTMLInputElement;
    const passwordInput = container?.querySelector("#login-password") as HTMLInputElement;
    const submitButton = container?.querySelector(
      'button[type="submit"]',
    ) as HTMLButtonElement;

    await act(async () => {
      changeInputValue(emailInput, "email-invalido");
      changeInputValue(passwordInput, "123");
    });

    await act(async () => {
      submitButton.click();
    });

    await vi.waitFor(() => {
      const emailError = container?.querySelector("#login-email-error");
      const passwordError = container?.querySelector("#login-password-error");
      expect(emailError?.textContent).toBe("Informe um e-mail válido");
      expect(passwordError?.textContent).toBe("Senha deve ter no mínimo 6 caracteres");
    });
  });

  it("deve exibir erro da API com role=alert ao informar credenciais incorretas (401)", async () => {
    const testRouter = createTestRouter();

    await act(async () => {
      root?.render(
        <QueryClientProvider client={queryClient}>
          <RouterProvider router={testRouter} />
        </QueryClientProvider>,
      );
    });

    const emailInput = container?.querySelector("#login-email") as HTMLInputElement;
    const passwordInput = container?.querySelector("#login-password") as HTMLInputElement;
    const submitButton = container?.querySelector(
      'button[type="submit"]',
    ) as HTMLButtonElement;

    await act(async () => {
      changeInputValue(emailInput, "demo@jungle.com");
      changeInputValue(passwordInput, "senha_incorreta_123");
    });

    await act(async () => {
      submitButton.click();
      await vi.waitFor(
        () => {
          const globalError = container?.querySelector("#login-global-error");
          expect(globalError).not.toBeNull();
          expect(globalError?.getAttribute("role")).toBe("alert");
          expect(globalError?.textContent).toContain("Credenciais inválidas");
        },
        { timeout: 3000 },
      );
    });

    expect(hasValidSession()).toBe(false);
  });

  it("deve realizar login com sucesso, persistir sessão, atualizar cache e emitir evento", async () => {
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

    const emailInput = container?.querySelector("#login-email") as HTMLInputElement;
    const passwordInput = container?.querySelector("#login-password") as HTMLInputElement;
    const submitButton = container?.querySelector(
      'button[type="submit"]',
    ) as HTMLButtonElement;

    await act(async () => {
      changeInputValue(emailInput, "demo@jungle.com");
      changeInputValue(passwordInput, "Password123!");
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
    expect(session?.userId).toBe("user_demo");

    const cachedSession = queryClient.getQueryData(queryKeys.session());
    expect(cachedSession).toBeDefined();

    expect(loginEventSpy).toHaveBeenCalledTimes(1);
    expect(loginEventSpy).toHaveBeenCalledWith(
      expect.objectContaining({ userId: "user_demo" }),
    );
    expect(onSuccessMock).toHaveBeenCalledTimes(1);

    unsubscribe();
  });
});

describe("Rota de Login (src/routes/login.tsx)", () => {
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
    const validateSearch = LoginRoute.options.validateSearch as (
      search: Record<string, unknown>,
    ) => { redirect?: string };
    expect(validateSearch).toBeDefined();

    expect(validateSearch({ redirect: "/checkout" })).toEqual({
      redirect: "/checkout",
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
    const beforeLoad = LoginRoute.options.beforeLoad as unknown as BeforeLoadFn;
    expect(beforeLoad).toBeDefined();

    let thrownError: unknown = null;
    try {
      beforeLoad({
        context: { auth: { isAuthenticated: true } },
        search: { redirect: "/profile?tab=wallets" },
      });
    } catch (err) {
      thrownError = err;
    }

    expect(thrownError).toBeDefined();
    expect(isRedirect(thrownError)).toBe(true);
    const redirectObj = thrownError as RedirectResult;
    expect(redirectObj.options.to).toBe("/profile?tab=wallets");
  });

  it("beforeLoad deve redirecionar para / se o destino do redirect for externo ou malicioso", () => {
    const beforeLoad = LoginRoute.options.beforeLoad as unknown as BeforeLoadFn;

    let thrownError: unknown = null;
    try {
      beforeLoad({
        context: { auth: { isAuthenticated: true } },
        search: { redirect: "https://malicious-site.com" },
      });
    } catch (err) {
      thrownError = err;
    }

    expect(isRedirect(thrownError)).toBe(true);
    const redirectObj = thrownError as RedirectResult;
    expect(redirectObj.options.to).toBe("/");
  });

  it("beforeLoad não deve disparar redirecionamento quando o usuário for anônimo/deslogado", () => {
    const beforeLoad = LoginRoute.options.beforeLoad as unknown as BeforeLoadFn;

    expect(() => {
      beforeLoad({
        context: { auth: { isAuthenticated: false } },
        search: { redirect: "/checkout" },
      });
    }).not.toThrow();
  });
});
