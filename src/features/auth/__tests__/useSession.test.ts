/**
 * Testes unitários para queries de autenticação e hook useSession.
 */
import React, { act } from "react";
import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
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

import type { IsoDate } from "@/contracts/common";
import type { Session } from "@/contracts/identity";
import { clearSession, setSession } from "@/lib/auth/session-store";
import { ApiError } from "@/lib/http";
import { queryKeys } from "@/lib/query/keys";
import { db, dbHelpers, resetDb } from "@/mocks/db";
import { scenarioEngine } from "@/mocks/scenarios";
import { server } from "@/mocks/server";

import { SESSION_GC_TIME, SESSION_STALE_TIME, sessionQueryOptions } from "../queries";
import { type UseSessionReturn, useSession } from "../useSession";

// Configura o ambiente de act do React 19 para testes
// @ts-expect-error IS_REACT_ACT_ENVIRONMENT flag
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

describe("Feature Auth: sessionQueryOptions & useSession", () => {
  let queryClient: QueryClient;
  let container: HTMLDivElement | null = null;
  let root: ReturnType<typeof createRoot> | null = null;

  beforeAll(() => {
    server.listen();
  });

  beforeEach(() => {
    clearSession();
    resetDb();
    scenarioEngine.reset();

    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
          gcTime: Infinity,
        },
      },
    });

    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => {
      root?.unmount();
    });
    container?.remove();
    container = null;
    root = null;
    queryClient.clear();
    server.resetHandlers();
    resetDb();
    scenarioEngine.reset();
  });

  afterAll(() => {
    server.close();
  });

  describe("Configuração e Cache de sessionQueryOptions", () => {
    it("deve definir queryKey como ['session']", () => {
      const options = sessionQueryOptions();
      expect(options.queryKey).toEqual(queryKeys.session());
    });

    it("deve configurar staleTime em 5 minutos e gcTime em 10 minutos", () => {
      const options = sessionQueryOptions();
      expect(options.staleTime).toBe(SESSION_STALE_TIME);
      expect(options.staleTime).toBe(300000);
      expect(options.gcTime).toBe(SESSION_GC_TIME);
      expect(options.gcTime).toBe(600000);
    });

    it("função de retry deve retornar false imediatamente para status 401", () => {
      const options = sessionQueryOptions();
      const retryFn = options.retry;
      expect(typeof retryFn).toBe("function");

      if (typeof retryFn === "function") {
        const error401 = new ApiError("Unauthorized", 401);
        expect(retryFn(0, error401)).toBe(false);
        expect(retryFn(1, error401)).toBe(false);

        const error500 = new ApiError("Server Error", 500);
        expect(retryFn(0, error500)).toBe(true);
        expect(retryFn(2, error500)).toBe(false);
      }
    });

    it("deve servir dados cacheados sem refetch imediato respeitando staleTime", async () => {
      const testSession: Session = {
        token: "mock-token-cached",
        expiresAt: new Date(Date.now() + 60000).toISOString() as IsoDate,
        user: {
          id: "user_demo" as Session["user"]["id"],
          name: "Alex Jungle",
          email: "demo@jungle.com",
          createdAt: new Date().toISOString() as IsoDate,
        },
      };

      // Injeta manualmente no cache
      queryClient.setQueryData(queryKeys.session(), testSession);

      const cachedData = await queryClient.fetchQuery(sessionQueryOptions());
      expect(cachedData).toEqual(testSession);
    });
  });

  describe("Hook useSession", () => {
    let hookState: UseSessionReturn | null = null;

    function TestConsumer() {
      hookState = useSession();
      return React.createElement(
        "div",
        null,
        React.createElement(
          "span",
          { "data-testid": "auth-status" },
          hookState.isAuthenticated ? "authenticated" : "guest",
        ),
        React.createElement(
          "span",
          { "data-testid": "user-name" },
          hookState.user?.name ?? "anonymous",
        ),
      );
    }

    it("deve resolver com sessão ativa quando o usuário estiver autenticado", async () => {
      // Cria sessão no banco do MSW e persiste token no session-store
      const demoToken = "mock-token-user_demo";
      setSession({
        token: demoToken,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        userId: "user_demo",
      });

      const demoUser = dbHelpers.findUserById("user_demo");
      if (demoUser) {
        db.sessions.set(demoToken, {
          token: demoToken,
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() as IsoDate,
          user: {
            id: demoUser.id,
            name: demoUser.name,
            email: demoUser.email,
            createdAt: demoUser.createdAt,
          },
        });
      }

      await act(async () => {
        root!.render(
          React.createElement(
            QueryClientProvider,
            { client: queryClient },
            React.createElement(TestConsumer),
          ),
        );
      });

      await act(async () => {
        await vi.waitFor(() => {
          expect(hookState?.isAuthenticated).toBe(true);
        });
      });

      expect(hookState!.user).not.toBeNull();
      expect(hookState!.user?.email).toBe("demo@jungle.com");
      expect(hookState!.session?.token).toBe(demoToken);
      expect(hookState!.error).toBeNull();
    });

    it("deve retornar fallback seguro (null e guest) para usuário deslogado (401)", async () => {
      clearSession(); // Sem token no session-store

      await act(async () => {
        root!.render(
          React.createElement(
            QueryClientProvider,
            { client: queryClient },
            React.createElement(TestConsumer),
          ),
        );
      });

      await act(async () => {
        await vi.waitFor(() => {
          expect(hookState?.isLoading).toBe(false);
        });
      });

      expect(hookState).not.toBeNull();
      expect(hookState!.isAuthenticated).toBe(false);
      expect(hookState!.user).toBeNull();
      expect(hookState!.session).toBeNull();
      expect(hookState!.error).toBeNull();
    });
  });
});
