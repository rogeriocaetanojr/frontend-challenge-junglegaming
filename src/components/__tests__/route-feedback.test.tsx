/**
 * Testes unitários para os componentes de transição de rota (RoutePendingComponent e RouteErrorComponent).
 */
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { RouteErrorComponent } from "../route-error";
import { RoutePendingComponent } from "../route-pending";
import { defaultRouterOptions } from "@/router";

// @ts-expect-error IS_REACT_ACT_ENVIRONMENT flag
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

describe("Feedback de Transições de Rotas (src/components/)", () => {
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
    vi.restoreAllMocks();
  });

  describe("RoutePendingComponent", () => {
    it("deve renderizar com atributos acessíveis role='status' e aria-live='polite'", async () => {
      await act(async () => {
        root?.render(<RoutePendingComponent />);
      });

      const statusEl = container?.querySelector('[role="status"]');
      expect(statusEl).not.toBeNull();
      expect(statusEl?.getAttribute("aria-live")).toBe("polite");

      // Mensagem padrão
      expect(statusEl?.textContent).toContain("Carregando conteúdo da página...");
      // Texto acessível para leitores de tela
      const srOnly = statusEl?.querySelector(".sr-only");
      expect(srOnly).not.toBeNull();
      expect(srOnly?.textContent).toContain("Carregando conteúdo da página");
    });

    it("deve permitir customizar a mensagem de carregamento", async () => {
      await act(async () => {
        root?.render(<RoutePendingComponent message="Sincronizando cotação de gás..." />);
      });

      const statusEl = container?.querySelector('[role="status"]');
      expect(statusEl?.textContent).toContain("Sincronizando cotação de gás...");
    });
  });

  describe("RouteErrorComponent", () => {
    it("deve renderizar com role='alert' e exibir título e mensagem padrão", async () => {
      await act(async () => {
        root?.render(<RouteErrorComponent />);
      });

      const alertEl = container?.querySelector('[role="alert"]');
      expect(alertEl).not.toBeNull();
      expect(alertEl?.textContent).toContain("Falha ao carregar a página");
      expect(alertEl?.textContent).toContain(
        "Ocorreu um erro inesperado ao carregar esta página.",
      );
    });

    it("deve exibir a mensagem extraída do objeto Error", async () => {
      const customError = new Error("Falha de conexão com nó RPC Ethereum");

      await act(async () => {
        root?.render(<RouteErrorComponent error={customError} />);
      });

      const alertEl = container?.querySelector('[role="alert"]');
      expect(alertEl?.textContent).toContain("Falha de conexão com nó RPC Ethereum");
    });

    it("deve acionar o callback reset() ao clicar no botão 'Tentar novamente'", async () => {
      const resetMock = vi.fn();

      await act(async () => {
        root?.render(<RouteErrorComponent reset={resetMock} />);
      });

      const retryButton = Array.from(container?.querySelectorAll("button") ?? []).find(
        (btn) => btn.textContent?.includes("Tentar novamente"),
      );

      expect(retryButton).toBeDefined();

      await act(async () => {
        retryButton?.click();
      });

      expect(resetMock).toHaveBeenCalledTimes(1);
    });

    it("deve navegar para a página inicial ('/') ao clicar em 'Voltar ao início'", async () => {
      const originalLocation = window.location;
      const assignMock = vi.fn();

      Object.defineProperty(window, "location", {
        writable: true,
        configurable: true,
        value: {
          ...originalLocation,
          assign: assignMock,
          href: "/old-path",
        },
      });

      await act(async () => {
        root?.render(<RouteErrorComponent />);
      });

      const homeButton = Array.from(container?.querySelectorAll("button") ?? []).find(
        (btn) => btn.textContent?.includes("Voltar ao início"),
      );

      expect(homeButton).toBeDefined();

      await act(async () => {
        homeButton?.click();
      });

      expect(window.location.href).toBe("/");

      Object.defineProperty(window, "location", {
        writable: true,
        configurable: true,
        value: originalLocation,
      });
    });

    it("não deve renderizar stack trace quando em ambiente de produção (isDev=false)", async () => {
      const errorWithStack = new Error("Erro com stack trace crítico");
      errorWithStack.stack = "Error: stack trace vazado em /secret/path/at.ts:10";

      await act(async () => {
        root?.render(<RouteErrorComponent error={errorWithStack} isDev={false} />);
      });

      const alertEl = container?.querySelector('[role="alert"]');
      expect(alertEl?.textContent).not.toContain("/secret/path/at.ts");
      expect(container?.querySelector("details")).toBeNull();
    });
  });

  describe("Integração com Opções do Roteador", () => {
    it("deve disponibilizar defaultPendingComponent e defaultErrorComponent nas opções padrão", () => {
      expect(defaultRouterOptions.defaultPendingComponent).toBe(RoutePendingComponent);
      expect(defaultRouterOptions.defaultErrorComponent).toBe(RouteErrorComponent);
    });
  });
});
