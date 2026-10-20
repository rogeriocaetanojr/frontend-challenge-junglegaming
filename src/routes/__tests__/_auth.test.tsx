/**
 * Testes unitários do layout de rota protegida _auth (src/routes/_auth.tsx).
 */
import { act } from "react";
import { createRoot } from "react-dom/client";
import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  isRedirect,
  RouterProvider,
} from "@tanstack/react-router";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { clearSession, hasValidSession, setSession } from "@/lib/auth/session-store";
import { AuthLayout, Route } from "../_auth";

// @ts-expect-error IS_REACT_ACT_ENVIRONMENT flag
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

describe("Rota de Layout Protegida (src/routes/_auth.tsx)", () => {
  beforeEach(() => {
    clearSession();
  });

  afterEach(() => {
    clearSession();
  });

  describe("beforeLoad Guard de Autenticação", () => {
    type BeforeLoadFn = (args: {
      context?: {
        queryClient?: {
          ensureQueryData: (options: unknown) => Promise<unknown>;
        };
        auth?: {
          isAuthenticated?: boolean;
          user?: unknown;
          session?: unknown;
        };
      };
      location: {
        pathname: string;
        search?: string;
        searchStr?: string;
        href?: string;
      };
    }) => Promise<unknown>;

    interface RedirectResult {
      options: {
        to: string;
        search?: {
          redirect?: string;
        };
      };
    }

    it("deve disparar redirect para /login com search.redirect seguro quando desautenticado", async () => {
      const beforeLoad = Route.options.beforeLoad as unknown as BeforeLoadFn;
      expect(beforeLoad).toBeDefined();

      let thrownError: unknown = null;
      try {
        await beforeLoad({
          context: {
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

    it("deve sanitizar caminhos maliciosos prevenindo open redirects", async () => {
      const beforeLoad = Route.options.beforeLoad as unknown as BeforeLoadFn;

      let thrownError: unknown = null;
      try {
        await beforeLoad({
          context: {
            auth: { isAuthenticated: false },
          },
          location: {
            pathname: "//evil.com",
            search: "",
          },
        });
      } catch (err) {
        thrownError = err;
      }

      expect(isRedirect(thrownError)).toBe(true);
      const redirectResult = thrownError as RedirectResult;
      expect(redirectResult.options.to).toBe("/login");
      expect(redirectResult.options.search?.redirect).toBe("/");
    });

    it("não deve disparar redirect quando context.auth.isAuthenticated for true com dados de user", async () => {
      const beforeLoad = Route.options.beforeLoad as unknown as BeforeLoadFn;

      let thrownError: unknown = null;
      try {
        await beforeLoad({
          context: {
            auth: {
              isAuthenticated: true,
              user: {
                id: "usr_1",
                name: "Alice",
                email: "alice@example.com",
                createdAt: "2026-01-01T00:00:00.000Z",
              },
              session: {
                token: "valid_token",
                expiresAt: "2099-01-01T00:00:00Z",
                user: {
                  id: "usr_1",
                  name: "Alice",
                  email: "alice@example.com",
                  createdAt: "2026-01-01T00:00:00.000Z",
                },
              },
            },
          },
          location: {
            pathname: "/profile",
            search: "",
          },
        });
      } catch (err) {
        thrownError = err;
      }

      expect(thrownError).toBeNull();
    });

    it("deve resolver sessão concorrentemente via ensureQueryData quando possuir token em sessionStore", async () => {
      setSession({
        token: "stored_jwt_token",
        expiresAt: "2099-01-01T00:00:00Z",
        userId: "usr_stored",
      });

      const mockUser = {
        id: "usr_stored",
        name: "Stored User",
        email: "stored@example.com",
        createdAt: "2026-01-01T00:00:00.000Z",
      };

      const mockSession = {
        token: "stored_jwt_token",
        expiresAt: "2099-01-01T00:00:00Z",
        user: mockUser,
      };

      const ensureQueryDataMock = vi.fn().mockResolvedValue(mockSession);

      const beforeLoad = Route.options.beforeLoad as unknown as BeforeLoadFn;

      const contextObj = {
        queryClient: {
          ensureQueryData: ensureQueryDataMock,
        },
        auth: {
          isAuthenticated: false,
          user: null,
          session: null,
        },
      };

      let result: unknown = null;
      let thrownError: unknown = null;
      try {
        result = await beforeLoad({
          context: contextObj,
          location: {
            pathname: "/settings",
            search: "",
          },
        });
      } catch (err) {
        thrownError = err;
      }

      // Não deve ter lançado redirect
      expect(thrownError).toBeNull();
      // Deve ter chamado ensureQueryData para hidratar a sessão
      expect(ensureQueryDataMock).toHaveBeenCalledTimes(1);
      // Deve atualizar o contexto da rota permitindo a passagem
      expect(contextObj.auth.isAuthenticated).toBe(true);
      expect(contextObj.auth.user).toEqual(mockUser);
      // E retornado o contexto enriquecido
      expect(result).toEqual({
        auth: {
          isAuthenticated: true,
          user: mockUser,
          session: mockSession,
        },
      });
    });

    it("deve limpar storage e redirecionar para login caso a sessão resolvida seja inválida ou rejeitada pelo backend", async () => {
      setSession({
        token: "expired_token",
        expiresAt: "2099-01-01T00:00:00Z",
        userId: "usr_expired",
      });

      // Backend rejeita ou retorna null (401 convertido para null em sessionQueryOptions)
      const ensureQueryDataMock = vi.fn().mockResolvedValue(null);

      const beforeLoad = Route.options.beforeLoad as unknown as BeforeLoadFn;

      let thrownError: unknown = null;
      try {
        await beforeLoad({
          context: {
            queryClient: {
              ensureQueryData: ensureQueryDataMock,
            },
            auth: {
              isAuthenticated: false,
              user: null,
              session: null,
            },
          },
          location: {
            pathname: "/orders",
            search: "?filter=completed",
          },
        });
      } catch (err) {
        thrownError = err;
      }

      expect(thrownError).toBeDefined();
      expect(isRedirect(thrownError)).toBe(true);
      const redirectResult = thrownError as RedirectResult;
      expect(redirectResult.options.to).toBe("/login");
      expect(redirectResult.options.search?.redirect).toBe("/orders?filter=completed");

      // Deve ter limpado a sessão em sessionStore
      expect(hasValidSession()).toBe(false);
    });

    it("deve limpar storage e redirecionar para login caso ensureQueryData lance um erro de rede/API", async () => {
      setSession({
        token: "broken_token",
        expiresAt: "2099-01-01T00:00:00Z",
        userId: "usr_broken",
      });

      const ensureQueryDataMock = vi.fn().mockRejectedValue(new Error("Network Error"));

      const beforeLoad = Route.options.beforeLoad as unknown as BeforeLoadFn;

      let thrownError: unknown = null;
      try {
        await beforeLoad({
          context: {
            queryClient: {
              ensureQueryData: ensureQueryDataMock,
            },
            auth: {
              isAuthenticated: false,
              user: null,
              session: null,
            },
          },
          location: {
            pathname: "/vault",
            search: "",
          },
        });
      } catch (err) {
        thrownError = err;
      }

      expect(thrownError).toBeDefined();
      expect(isRedirect(thrownError)).toBe(true);
      expect(hasValidSession()).toBe(false);
    });
  });

  describe("Renderização de AuthLayout", () => {
    let container: HTMLDivElement | null = null;
    let root: ReturnType<typeof createRoot> | null = null;

    beforeEach(() => {
      container = document.createElement("div");
      document.body.appendChild(container);
      root = createRoot(container);
    });

    afterEach(() => {
      if (root) {
        act(() => {
          root?.unmount();
        });
      }
      container?.remove();
    });

    it("deve renderizar o layout com Outlet em um roteador ativo", async () => {
      const rootRoute = createRootRoute({
        component: AuthLayout,
      });

      const indexRoute = createRoute({
        getParentRoute: () => rootRoute,
        path: "/",
        component: () => (
          <div data-testid="protected-child">Conteúdo Protegido Renderizado</div>
        ),
      });

      const routeTree = rootRoute.addChildren([indexRoute]);
      const history = createMemoryHistory({ initialEntries: ["/"] });
      const testRouter = createRouter({
        routeTree,
        history,
      });

      await act(async () => {
        root?.render(<RouterProvider router={testRouter} />);
      });

      expect(
        container?.querySelector('[data-testid="protected-child"]')?.textContent,
      ).toBe("Conteúdo Protegido Renderizado");
    });
  });
});
