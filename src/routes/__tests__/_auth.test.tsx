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
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { clearSession, setSession } from "@/lib/auth/session-store";
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
    }) => void;

    interface RedirectResult {
      options: {
        to: string;
        search?: {
          redirect?: string;
        };
      };
    }

    it("deve disparar redirect para /login com search.redirect seguro quando desautenticado", () => {
      const beforeLoad = Route.options.beforeLoad as unknown as BeforeLoadFn;
      expect(beforeLoad).toBeDefined();

      let thrownError: unknown = null;
      try {
        beforeLoad({
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

    it("deve sanitizar caminhos maliciosos prevenindo open redirects", () => {
      const beforeLoad = Route.options.beforeLoad as unknown as BeforeLoadFn;

      let thrownError: unknown = null;
      try {
        beforeLoad({
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

    it("não deve disparar redirect quando context.auth.isAuthenticated for true", () => {
      const beforeLoad = Route.options.beforeLoad as unknown as BeforeLoadFn;

      expect(() => {
        beforeLoad({
          context: {
            auth: {
              isAuthenticated: true,
              user: {
                id: "usr_1",
                name: "Alice",
                email: "alice@example.com",
                role: "collector",
              },
              session: {
                token: "valid_token",
                expiresAt: "2099-01-01T00:00:00Z",
                userId: "usr_1",
              },
            },
          },
          location: {
            pathname: "/profile",
            search: "",
          },
        });
      }).not.toThrow();
    });

    it("não deve disparar redirect quando possuir sessão válida em sessionStore (hasValidSession)", () => {
      setSession({
        token: "stored_token",
        expiresAt: "2099-01-01T00:00:00Z",
        userId: "usr_stored",
      });

      const beforeLoad = Route.options.beforeLoad as unknown as BeforeLoadFn;

      expect(() => {
        beforeLoad({
          context: {
            auth: { isAuthenticated: false },
          },
          location: {
            pathname: "/settings",
            search: "",
          },
        });
      }).not.toThrow();
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
