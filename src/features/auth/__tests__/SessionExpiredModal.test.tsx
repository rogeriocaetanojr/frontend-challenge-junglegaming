/**
 * Testes unitários do modal de sessão expirada (SessionExpiredModal).
 */
import { act } from "react";
import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { authEventBus } from "@/lib/auth/events";
import { clearSession, hasValidSession, setSession } from "@/lib/auth/session-store";
import { queryKeys } from "@/lib/query/keys";
import { SessionExpiredModal } from "../SessionExpiredModal";

// @ts-expect-error IS_REACT_ACT_ENVIRONMENT flag
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

describe("SessionExpiredModal (src/features/auth/SessionExpiredModal.tsx)", () => {
  let queryClient: QueryClient;
  let container: HTMLDivElement | null = null;
  let root: ReturnType<typeof createRoot> | null = null;

  beforeEach(() => {
    window.scrollTo = vi.fn();
    clearSession();
    authEventBus.resetDeduplication();

    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false, gcTime: Infinity },
      },
    });

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
    // Limpa modais que o Radix renderiza em portais no document.body
    const dialogPortals = document.querySelectorAll(
      '[data-radix-portal], [role="alertdialog"]',
    );
    dialogPortals.forEach((el) => el.remove());
    clearSession();
    authEventBus.resetDeduplication();
  });

  it("deve permanecer fechado na renderização inicial", async () => {
    await act(async () => {
      root?.render(
        <QueryClientProvider client={queryClient}>
          <SessionExpiredModal />
        </QueryClientProvider>,
      );
    });

    const alertDialog = document.querySelector('[role="alertdialog"]');
    expect(alertDialog).toBeNull();
  });

  it("deve abrir automaticamente ao receber evento auth:expired do authEventBus", async () => {
    await act(async () => {
      root?.render(
        <QueryClientProvider client={queryClient}>
          <SessionExpiredModal />
        </QueryClientProvider>,
      );
    });

    await act(async () => {
      authEventBus.emit("auth:expired", {
        returnTo: "/checkout",
        timestamp: Date.now(),
      });
    });

    await vi.waitFor(() => {
      const alertDialog = document.querySelector('[role="alertdialog"]');
      expect(alertDialog).not.toBeNull();
    });

    const alertDialog = document.querySelector('[role="alertdialog"]');
    expect(alertDialog?.getAttribute("aria-labelledby")).toBe("session-expired-title");
    expect(alertDialog?.getAttribute("aria-describedby")).toContain(
      "session-expired-description",
    );

    const title = document.querySelector("#session-expired-title");
    expect(title?.textContent).toBe("Sessão Expirada");

    const description = document.querySelector("#session-expired-description");
    expect(description?.textContent).toContain("expirou por motivos de segurança");
  });

  it("deve executar auto-logout: limpar sessionStore e resetar query cache ao expirar", async () => {
    // Configura sessão prévia ativa
    setSession({
      token: "jwt_ativo",
      expiresAt: "2099-01-01T00:00:00Z",
      userId: "usr_alex",
    });
    queryClient.setQueryData(queryKeys.session(), {
      token: "jwt_ativo",
      userId: "usr_alex",
    });

    expect(hasValidSession()).toBe(true);

    await act(async () => {
      root?.render(
        <QueryClientProvider client={queryClient}>
          <SessionExpiredModal />
        </QueryClientProvider>,
      );
    });

    await act(async () => {
      authEventBus.emit("auth:expired", {
        returnTo: "/profile",
        timestamp: Date.now(),
      });
    });

    // 1. Sessão local foi limpa
    expect(hasValidSession()).toBe(false);

    // 2. Cache TanStack Query de sessão foi resetado para null
    const cachedSession = queryClient.getQueryData(queryKeys.session());
    expect(cachedSession).toBeNull();
  });

  it("deve acionar reconexão com rota de retorno sanitizada ao clicar em 'Fazer Login Novamente'", async () => {
    const onReconnectMock = vi.fn();

    await act(async () => {
      root?.render(
        <QueryClientProvider client={queryClient}>
          <SessionExpiredModal onReconnect={onReconnectMock} />
        </QueryClientProvider>,
      );
    });

    await act(async () => {
      authEventBus.emit("auth:expired", {
        returnTo: "/checkout?tab=summary",
        timestamp: Date.now(),
      });
    });

    await vi.waitFor(() => {
      expect(document.querySelector('[role="alertdialog"]')).not.toBeNull();
    });

    // Localiza botão de reconexão
    const reconnectButton = Array.from(document.querySelectorAll("button")).find((btn) =>
      btn.textContent?.includes("Fazer Login Novamente"),
    );

    expect(reconnectButton).toBeDefined();

    await act(async () => {
      reconnectButton?.click();
    });

    expect(onReconnectMock).toHaveBeenCalledTimes(1);
    expect(onReconnectMock).toHaveBeenCalledWith(
      "/login?redirect=%2Fcheckout%3Ftab%3Dsummary",
    );

    // Modal deve ser fechado
    await vi.waitFor(() => {
      expect(document.querySelector('[role="alertdialog"]')).toBeNull();
    });
  });

  it("deve sanitizar rota maliciosa ao tentar open redirect em auth:expired", async () => {
    const onReconnectMock = vi.fn();

    await act(async () => {
      root?.render(
        <QueryClientProvider client={queryClient}>
          <SessionExpiredModal onReconnect={onReconnectMock} />
        </QueryClientProvider>,
      );
    });

    await act(async () => {
      authEventBus.emit("auth:expired", {
        returnTo: "https://evil-phishing.com/steal",
        timestamp: Date.now(),
      });
    });

    await vi.waitFor(() => {
      expect(document.querySelector('[role="alertdialog"]')).not.toBeNull();
    });

    const reconnectButton = Array.from(document.querySelectorAll("button")).find((btn) =>
      btn.textContent?.includes("Fazer Login Novamente"),
    );

    await act(async () => {
      reconnectButton?.click();
    });

    // Destino seguro sanitizado para '/'
    expect(onReconnectMock).toHaveBeenCalledWith("/login?redirect=%2F");
  });

  it("deve fechar o modal ao clicar em 'Continuar como visitante'", async () => {
    await act(async () => {
      root?.render(
        <QueryClientProvider client={queryClient}>
          <SessionExpiredModal />
        </QueryClientProvider>,
      );
    });

    await act(async () => {
      authEventBus.emit("auth:expired", {
        returnTo: "/catalog",
        timestamp: Date.now(),
      });
    });

    await vi.waitFor(() => {
      expect(document.querySelector('[role="alertdialog"]')).not.toBeNull();
    });

    const dismissButton = Array.from(document.querySelectorAll("button")).find((btn) =>
      btn.textContent?.includes("Continuar como visitante"),
    );

    expect(dismissButton).toBeDefined();

    await act(async () => {
      dismissButton?.click();
    });

    await vi.waitFor(() => {
      expect(document.querySelector('[role="alertdialog"]')).toBeNull();
    });
  });
});
