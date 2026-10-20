import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  authEventBus,
  captureReturnTo,
  clearReturnTo,
  getReturnTo,
  RETURN_TO_STORAGE_KEY,
  setReturnTo,
} from "../events";

describe("AuthEventBus (src/lib/auth/events.ts)", () => {
  beforeEach(() => {
    authEventBus.reset();
    clearReturnTo();
    localStorage.clear();
    vi.restoreAllMocks();
  });

  afterEach(() => {
    authEventBus.reset();
    clearReturnTo();
  });

  describe("Gerenciamento de Listeners e Inscrições", () => {
    it("deve registrar e invocar listener ao emitir evento", () => {
      const handler = vi.fn();
      authEventBus.on("auth:logout", handler);

      authEventBus.emit("auth:logout", { reason: "user_action" });

      expect(handler).toHaveBeenCalledTimes(1);
      expect(handler).toHaveBeenCalledWith({ reason: "user_action" });
    });

    it("deve cancelar inscrição via retorno de unsubscribe()", () => {
      const handler = vi.fn();
      const unsubscribe = authEventBus.on("auth:login", handler);

      authEventBus.emit("auth:login", { userId: "u1", token: "tok1" });
      expect(handler).toHaveBeenCalledTimes(1);

      unsubscribe();

      authEventBus.emit("auth:login", { userId: "u2", token: "tok2" });
      expect(handler).toHaveBeenCalledTimes(1);
    });

    it("deve cancelar inscrição via off()", () => {
      const handler = vi.fn();
      authEventBus.on("auth:logout", handler);

      authEventBus.emit("auth:logout", {});
      expect(handler).toHaveBeenCalledTimes(1);

      authEventBus.off("auth:logout", handler);

      authEventBus.emit("auth:logout", {});
      expect(handler).toHaveBeenCalledTimes(1);
    });
  });

  describe("Deduplicação de 'auth:expired' em chamadas concorrentes", () => {
    it("deve disparar 'auth:expired' exatamente UMA única vez em múltiplas chamadas concorrentes", () => {
      const handler = vi.fn();
      authEventBus.on("auth:expired", handler);

      // Simula 5 chamadas quase simultâneas oriundas de requisições paralelas que receberam 401
      const res1 = authEventBus.emit("auth:expired", {
        returnTo: "/checkout",
        timestamp: Date.now(),
      });
      const res2 = authEventBus.emit("auth:expired", {
        returnTo: "/checkout",
        timestamp: Date.now(),
      });
      const res3 = authEventBus.emit("auth:expired", {
        returnTo: "/checkout",
        timestamp: Date.now(),
      });
      const res4 = authEventBus.emit("auth:expired", {
        returnTo: "/checkout",
        timestamp: Date.now(),
      });
      const res5 = authEventBus.emit("auth:expired", {
        returnTo: "/checkout",
        timestamp: Date.now(),
      });

      expect(res1).toBe(true);
      expect(res2).toBe(false);
      expect(res3).toBe(false);
      expect(res4).toBe(false);
      expect(res5).toBe(false);

      expect(handler).toHaveBeenCalledTimes(1);
      expect(handler).toHaveBeenCalledWith(
        expect.objectContaining({ returnTo: "/checkout" }),
      );
    });

    it("deve permitir nova emissão de 'auth:expired' após a janela de deduplicação", () => {
      const handler = vi.fn();
      authEventBus.on("auth:expired", handler);
      authEventBus.setDeduplicationWindow(50); // Janela curta para o teste

      authEventBus.emit("auth:expired", {
        returnTo: "/cart",
        timestamp: Date.now(),
      });
      expect(handler).toHaveBeenCalledTimes(1);

      // Chamada imediata é deduplicada
      authEventBus.emit("auth:expired", {
        returnTo: "/cart",
        timestamp: Date.now(),
      });
      expect(handler).toHaveBeenCalledTimes(1);

      // Avança o tempo além da janela
      const originalNow = Date.now;
      vi.spyOn(Date, "now").mockReturnValue(originalNow() + 100);

      const resLater = authEventBus.emit("auth:expired", {
        returnTo: "/cart",
        timestamp: Date.now(),
      });
      expect(resLater).toBe(true);
      expect(handler).toHaveBeenCalledTimes(2);
    });

    it("deve resetar o controle de deduplicação ao ocorrer novo login ('auth:login')", () => {
      const handler = vi.fn();
      authEventBus.on("auth:expired", handler);

      authEventBus.emit("auth:expired", {
        returnTo: "/profile",
        timestamp: Date.now(),
      });
      expect(handler).toHaveBeenCalledTimes(1);

      // Usuário loga novamente
      authEventBus.emit("auth:login", { userId: "user-new", token: "tok-new" });

      // Nova expiração é disparada sem esperar a janela
      const resAfterLogin = authEventBus.emit("auth:expired", {
        returnTo: "/profile",
        timestamp: Date.now(),
      });
      expect(resAfterLogin).toBe(true);
      expect(handler).toHaveBeenCalledTimes(2);
    });
  });

  describe("Preservação e Captura do Caminho de Retorno (returnTo)", () => {
    it("deve salvar returnTo no storage ao emitir 'auth:expired'", () => {
      authEventBus.emit("auth:expired", {
        returnTo: "/nft/jungle-legendary?tab=bids",
        timestamp: Date.now(),
      });

      expect(getReturnTo()).toBe("/nft/jungle-legendary?tab=bids");
      expect(localStorage.getItem(RETURN_TO_STORAGE_KEY)).toBe(
        "/nft/jungle-legendary?tab=bids",
      );
    });

    it("deve salvar returnTo no storage ao emitir 'auth:unauthorized'", () => {
      authEventBus.emit("auth:unauthorized", {
        returnTo: "/profile/settings",
        timestamp: Date.now(),
      });

      expect(getReturnTo()).toBe("/profile/settings");
    });

    it("deve permitir manipulação direta de returnTo via setReturnTo e clearReturnTo", () => {
      setReturnTo("/orders/123");
      expect(getReturnTo()).toBe("/orders/123");

      clearReturnTo();
      expect(getReturnTo()).toBeNull();
    });

    it("captureReturnTo deve ler pathname + search de window.location", () => {
      window.history.pushState({}, "", "/market/browse?sort=price_asc&category=gaming");

      expect(captureReturnTo()).toBe("/market/browse?sort=price_asc&category=gaming");

      window.history.pushState({}, "", "/");
    });
  });
});
