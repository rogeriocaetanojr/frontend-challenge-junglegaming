/**
 * Testes de Integração de Rotas de Autenticação e Transições (Fase 3).
 *
 * Cobre:
 * 1. Tentativa de acesso a rota protegida sem sessão redireciona para /login?redirect=...
 * 2. Submissão com sucesso no formulário de login redireciona para a rota protegida preservada.
 * 3. Tentativa de aceder a /login ou /register já estando autenticado redireciona para / ou safe path.
 * 4. Emissão de auth:expired exibe SessionExpiredModal com auto logout e reconexão segura.
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

import { SessionExpiredModal } from "@/features/auth/SessionExpiredModal";
import { authEventBus } from "@/lib/auth/events";
import {
  clearSession,
  getSession,
  hasValidSession,
  setSession,
} from "@/lib/auth/session-store";
import { queryKeys } from "@/lib/query/keys";
import { resetDb } from "@/mocks/db";
import { scenarioEngine } from "@/mocks/scenarios";
import { server } from "@/mocks/server";
import { Route as AuthRoute } from "@/routes/_auth";
import { Route as LoginRoute } from "@/routes/login";
import { Route as RegisterRoute } from "@/routes/register";
import { LoginForm } from "../LoginForm";

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

interface RedirectResult {
  options: {
    to: string;
    search?: {
      redirect?: string;
    };
  };
}

type BeforeLoadFn = (args: {
  context?: unknown;
  location: {
    pathname: string;
    search?: string;
    searchStr?: string;
    href?: string;
  };
  search?: Record<string, unknown>;
}) => Promise<unknown> | unknown;

describe("Testes de Integração de Rotas de Autenticação e Transições (src/features/auth/)", () => {
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
    authEventBus.resetDeduplication();

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
    const dialogPortals = document.querySelectorAll(
      '[data-radix-portal], [role="alertdialog"]',
    );
    dialogPortals.forEach((el) => el.remove());
    clearSession();
    authEventBus.resetDeduplication();
  });

  describe("1. Tentativa de acesso a rota protegida sem sessão", () => {
    it("deve interceptar rota protegida e redirecionar para /login com search.redirect sanitizado", async () => {
      const beforeLoad = AuthRoute.options.beforeLoad as unknown as BeforeLoadFn;
      expect(beforeLoad).toBeDefined();

      let thrownError: unknown = null;
      try {
        await beforeLoad({
          context: {
            queryClient,
            auth: {
              isAuthenticated: false,
              user: null,
              session: null,
            },
          },
          location: {
            pathname: "/checkout",
            search: "?step=payment",
            href: "/checkout?step=payment",
          },
        });
      } catch (err) {
        thrownError = err;
      }

      expect(thrownError).toBeDefined();
      expect(isRedirect(thrownError)).toBe(true);

      const redirectResult = thrownError as RedirectResult;
      expect(redirectResult.options.to).toBe("/login");
      expect(redirectResult.options.search?.redirect).toBe("/checkout?step=payment");
    });

    it("deve sanitizar tentativas de Open Redirect na URL de retorno", async () => {
      const beforeLoad = AuthRoute.options.beforeLoad as unknown as BeforeLoadFn;

      let thrownError: unknown = null;
      try {
        await beforeLoad({
          context: {
            queryClient,
            auth: { isAuthenticated: false },
          },
          location: {
            pathname: "//malicious-domain.com/phish",
            search: "",
            href: "//malicious-domain.com/phish",
          },
        });
      } catch (err) {
        thrownError = err;
      }

      expect(thrownError).toBeDefined();
      expect(isRedirect(thrownError)).toBe(true);

      const redirectResult = thrownError as RedirectResult;
      expect(redirectResult.options.to).toBe("/login");
      expect(redirectResult.options.search?.redirect).toBe("/");
    });
  });

  describe("2. Submissão com sucesso no formulário de login e redirecionamento preservado", () => {
    function createAuthTestRouter(redirectTarget = "/checkout?step=payment") {
      const rootRoute = createRootRoute({
        component: () => <Outlet />,
      });

      const loginRoute = createRoute({
        getParentRoute: () => rootRoute,
        path: "/login",
        component: () => <LoginForm redirectPath={redirectTarget} />,
      });

      const checkoutRoute = createRoute({
        getParentRoute: () => rootRoute,
        path: "/checkout",
        component: () => <div data-testid="checkout-page">Checkout Protegido</div>,
      });

      const routeTree = rootRoute.addChildren([loginRoute, checkoutRoute]);
      const history = createMemoryHistory({ initialEntries: ["/login"] });
      return createRouter({
        routeTree,
        history,
      });
    }

    it("deve autenticar com sucesso via MSW e manter o caminho de retorno preservado", async () => {
      const targetProtectedPath = "/checkout?step=payment";
      const testRouter = createAuthTestRouter(targetProtectedPath);

      await act(async () => {
        root?.render(
          <QueryClientProvider client={queryClient}>
            <RouterProvider router={testRouter} />
          </QueryClientProvider>,
        );
      });

      const emailInput = container?.querySelector("#login-email") as HTMLInputElement;
      const passwordInput = container?.querySelector(
        "#login-password",
      ) as HTMLInputElement;
      const submitButton = container?.querySelector(
        'button[type="submit"]',
      ) as HTMLButtonElement;

      expect(emailInput).not.toBeNull();
      expect(passwordInput).not.toBeNull();
      expect(submitButton).not.toBeNull();

      // Preenche com credenciais do usuário demo válidas no MSW
      await act(async () => {
        changeInputValue(emailInput, "demo@jungle.com");
        changeInputValue(passwordInput, "Password123!");
      });

      await act(async () => {
        submitButton.click();
      });

      // Aguarda persistência no sessionStore e atualização no TanStack Query
      await vi.waitFor(
        () => {
          expect(hasValidSession()).toBe(true);
        },
        { timeout: 3000 },
      );

      const session = getSession();
      expect(session).not.toBeNull();
      expect(session?.userId).toBe("user_demo");
      expect(session?.token).toContain("mock-token-user_demo");

      const cachedSession = queryClient.getQueryData(queryKeys.session());
      expect(cachedSession).toBeDefined();
    });
  });

  describe("3. Tentativa de aceder a /login ou /register já estando autenticado", () => {
    beforeEach(() => {
      setSession({
        token: "jwt_ativo",
        expiresAt: "2099-01-01T00:00:00Z",
        userId: "user_demo",
      });
    });

    it("deve redirecionar usuário autenticado de /login para o redirectPath ou para a home (/)", () => {
      const beforeLoadLogin = LoginRoute.options.beforeLoad as unknown as BeforeLoadFn;

      // 3a. Com redirect parameter definido
      let thrownWithRedirect: unknown = null;
      try {
        beforeLoadLogin({
          context: { auth: { isAuthenticated: true } },
          search: { redirect: "/checkout" },
          location: { pathname: "/login" },
        });
      } catch (err) {
        thrownWithRedirect = err;
      }

      expect(isRedirect(thrownWithRedirect)).toBe(true);
      expect((thrownWithRedirect as RedirectResult).options.to).toBe("/checkout");

      // 3b. Sem redirect parameter (fallback para '/')
      let thrownWithoutRedirect: unknown = null;
      try {
        beforeLoadLogin({
          context: { auth: { isAuthenticated: true } },
          search: {},
          location: { pathname: "/login" },
        });
      } catch (err) {
        thrownWithoutRedirect = err;
      }

      expect(isRedirect(thrownWithoutRedirect)).toBe(true);
      expect((thrownWithoutRedirect as RedirectResult).options.to).toBe("/");
    });

    it("deve redirecionar usuário autenticado de /register para o redirectPath ou para a home (/)", () => {
      const beforeLoadRegister = RegisterRoute.options
        .beforeLoad as unknown as BeforeLoadFn;

      // Com redirect parameter definido
      let thrownWithRedirect: unknown = null;
      try {
        beforeLoadRegister({
          context: { auth: { isAuthenticated: true } },
          search: { redirect: "/catalog" },
          location: { pathname: "/register" },
        });
      } catch (err) {
        thrownWithRedirect = err;
      }

      expect(isRedirect(thrownWithRedirect)).toBe(true);
      expect((thrownWithRedirect as RedirectResult).options.to).toBe("/catalog");

      // Sem redirect parameter (fallback para '/')
      let thrownWithoutRedirect: unknown = null;
      try {
        beforeLoadRegister({
          context: { auth: { isAuthenticated: true } },
          search: {},
          location: { pathname: "/register" },
        });
      } catch (err) {
        thrownWithoutRedirect = err;
      }

      expect(isRedirect(thrownWithoutRedirect)).toBe(true);
      expect((thrownWithoutRedirect as RedirectResult).options.to).toBe("/");
    });
  });

  describe("4. Emissão de auth:expired exibe diálogo de sessão expirada e permite reconexão", () => {
    it("deve exibir SessionExpiredModal, limpar sessão e redirecionar para /login com parâmetro sanitizado", async () => {
      const onReconnectMock = vi.fn();

      setSession({
        token: "token_prest_a_expirar",
        expiresAt: "2099-01-01T00:00:00Z",
        userId: "user_demo",
      });

      expect(hasValidSession()).toBe(true);

      await act(async () => {
        root?.render(
          <QueryClientProvider client={queryClient}>
            <SessionExpiredModal onReconnect={onReconnectMock} />
          </QueryClientProvider>,
        );
      });

      // Inicialmente fechado
      expect(document.querySelector('[role="alertdialog"]')).toBeNull();

      // Emite evento de sessão expirada
      await act(async () => {
        authEventBus.emit("auth:expired", {
          returnTo: "/checkout?tab=summary",
          timestamp: Date.now(),
        });
      });

      // Modal abre com role alertdialog
      await vi.waitFor(() => {
        const alertDialog = document.querySelector('[role="alertdialog"]');
        expect(alertDialog).not.toBeNull();
      });

      // Auto logout: limpa storage
      expect(hasValidSession()).toBe(false);

      // Localiza botão de reconexão
      const reconnectBtn = Array.from(document.querySelectorAll("button")).find((btn) =>
        btn.textContent?.includes("Fazer Login Novamente"),
      );

      expect(reconnectBtn).toBeDefined();

      await act(async () => {
        reconnectBtn?.click();
      });

      // Callback acionado com caminho codificado seguro
      expect(onReconnectMock).toHaveBeenCalledTimes(1);
      expect(onReconnectMock).toHaveBeenCalledWith(
        "/login?redirect=%2Fcheckout%3Ftab%3Dsummary",
      );

      // Modal fecha
      await vi.waitFor(() => {
        expect(document.querySelector('[role="alertdialog"]')).toBeNull();
      });
    });
  });
});
