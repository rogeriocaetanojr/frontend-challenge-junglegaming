import type { AxiosError, InternalAxiosRequestConfig } from "axios";
import axios, { AxiosHeaders } from "axios";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { authEventBus, clearReturnTo } from "@/lib/auth/events";
import { clearGuestId, getGuestId, isValidUuid } from "@/lib/auth/guest-id";
import { clearSession, hasValidSession, setSession } from "@/lib/auth/session-store";

import {
  attachInterceptors,
  authRequestInterceptor,
  errorResponseInterceptor,
} from "../interceptors";
import { ApiError } from "../types";

describe("Axios Interceptors (src/lib/http/interceptors.ts)", () => {
  beforeEach(() => {
    localStorage.clear();
    clearSession();
    clearGuestId();
    clearReturnTo();
    authEventBus.reset();
    vi.restoreAllMocks();
  });

  afterEach(() => {
    authEventBus.reset();
    clearReturnTo();
  });

  describe("authRequestInterceptor", () => {
    it("deve injetar cabeçalho X-Guest-Id quando não houver sessão ativa (usuário anônimo)", () => {
      const config = {
        headers: new AxiosHeaders(),
      } as InternalAxiosRequestConfig;

      const result = authRequestInterceptor(config);

      const guestHeader = result.headers.get("X-Guest-Id") as string;
      expect(guestHeader).toBeDefined();
      expect(isValidUuid(guestHeader)).toBe(true);
      expect(result.headers.get("Authorization")).toBeUndefined();
    });

    it("deve injetar cabeçalho Authorization: Bearer <token> e remover X-Guest-Id quando houver sessão ativa", () => {
      const token = "mock-jwt-valid-token-123";
      setSession({
        token,
        expiresAt: new Date(Date.now() + 3600000).toISOString(),
        userId: "usr_active_01",
      });

      const config = {
        headers: new AxiosHeaders({ "X-Guest-Id": "old-guest-id" }),
      } as InternalAxiosRequestConfig;

      const result = authRequestInterceptor(config);

      expect(result.headers.get("Authorization")).toBe(`Bearer ${token}`);
      expect(result.headers.get("X-Guest-Id")).toBeUndefined();
    });

    it("deve alternar dinamicamente entre autenticado e anônimo conforme o estado da sessão", () => {
      const config1 = {
        headers: new AxiosHeaders(),
      } as InternalAxiosRequestConfig;

      // 1. Visitante anônimo
      const resAnon = authRequestInterceptor(config1);
      const guestId = getGuestId();
      expect(resAnon.headers.get("X-Guest-Id")).toBe(guestId);
      expect(resAnon.headers.get("Authorization")).toBeUndefined();

      // 2. Realiza login
      setSession({
        token: "user-token-abc",
        expiresAt: new Date(Date.now() + 100000).toISOString(),
        userId: "user-abc",
      });

      const config2 = {
        headers: new AxiosHeaders(),
      } as InternalAxiosRequestConfig;
      const resAuth = authRequestInterceptor(config2);
      expect(resAuth.headers.get("Authorization")).toBe("Bearer user-token-abc");
      expect(resAuth.headers.get("X-Guest-Id")).toBeUndefined();

      // 3. Realiza logout
      clearSession();

      const config3 = {
        headers: new AxiosHeaders(),
      } as InternalAxiosRequestConfig;
      const resLogout = authRequestInterceptor(config3);
      expect(resLogout.headers.get("Authorization")).toBeUndefined();
      expect(resLogout.headers.get("X-Guest-Id")).toBe(guestId);
    });

    it("deve funcionar corretamente mesmo se headers for um objeto literal sem os métodos de AxiosHeaders", () => {
      const config = {
        headers: {},
      } as unknown as InternalAxiosRequestConfig;

      const res = authRequestInterceptor(config);
      expect(res.headers["X-Guest-Id"]).toBeDefined();
      expect(isValidUuid(res.headers["X-Guest-Id"])).toBe(true);
    });
  });

  describe("errorResponseInterceptor e Integração com authEventBus", () => {
    it("deve limpar a sessão e emitir 'auth:expired' quando receber 401 e havia sessão ativa", async () => {
      setSession({
        token: "valid-session-token",
        expiresAt: new Date(Date.now() + 60000).toISOString(),
        userId: "user-123",
      });
      expect(hasValidSession()).toBe(true);

      const expiredSpy = vi.fn();
      authEventBus.on("auth:expired", expiredSpy);

      const mockError = {
        response: {
          status: 401,
          data: { message: "Token has expired" },
        },
        message: "Request failed with status code 401",
      } as AxiosError<{ message?: string }>;

      await expect(errorResponseInterceptor(mockError)).rejects.toThrow(ApiError);

      expect(hasValidSession()).toBe(false);
      expect(expiredSpy).toHaveBeenCalledTimes(1);
      expect(expiredSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          returnTo: expect.any(String),
        }),
      );
    });

    it("deve emitir 'auth:unauthorized' quando receber 401 e não havia sessão ativa prévia", async () => {
      expect(hasValidSession()).toBe(false);

      const unauthSpy = vi.fn();
      const expiredSpy = vi.fn();
      authEventBus.on("auth:unauthorized", unauthSpy);
      authEventBus.on("auth:expired", expiredSpy);

      const mockError = {
        response: {
          status: 401,
          data: { message: "Unauthorized credentials" },
        },
        message: "Request failed with status code 401",
      } as AxiosError<{ message?: string }>;

      await expect(errorResponseInterceptor(mockError)).rejects.toThrow(ApiError);

      expect(unauthSpy).toHaveBeenCalledTimes(1);
      expect(expiredSpy).not.toHaveBeenCalled();
    });

    it("deve deduplicar 'auth:expired' quando múltiplas requisições receberem 401 simultaneamente", async () => {
      setSession({
        token: "token-concurrent",
        expiresAt: new Date(Date.now() + 60000).toISOString(),
        userId: "user-concurrent",
      });

      const expiredSpy = vi.fn();
      authEventBus.on("auth:expired", expiredSpy);

      const mockError = {
        response: {
          status: 401,
          data: { message: "Session invalid" },
        },
        message: "401",
      } as AxiosError<{ message?: string }>;

      // Dispara 3 erros 401 quase simultaneamente
      await Promise.allSettled([
        errorResponseInterceptor(mockError),
        errorResponseInterceptor(mockError),
        errorResponseInterceptor(mockError),
      ]);

      // Graças à deduplicação do authEventBus, disparou apenas uma vez
      expect(expiredSpy).toHaveBeenCalledTimes(1);
    });

    it("deve disparar evento 'http:unauthorized' na janela para retrocompatibilidade", async () => {
      const dispatchSpy = vi.spyOn(window, "dispatchEvent");

      const mockError = {
        response: {
          status: 401,
          data: { message: "Unauthorized access" },
        },
        message: "Request failed with status code 401",
      } as AxiosError<{ message?: string }>;

      await expect(errorResponseInterceptor(mockError)).rejects.toThrow(ApiError);

      expect(dispatchSpy).toHaveBeenCalledWith(
        expect.objectContaining({ type: "http:unauthorized" }),
      );
    });

    it("deve rejeitar com ApiError e NÃO aplicar retry automático", async () => {
      const mockError = {
        response: {
          status: 401,
          data: { message: "No retry allowed" },
        },
        message: "Request failed with status code 401",
      } as AxiosError<{ message?: string }>;

      const rejection = errorResponseInterceptor(mockError);
      await expect(rejection).rejects.toThrow(ApiError);

      try {
        await rejection;
      } catch (err) {
        expect(err).toBeInstanceOf(ApiError);
        const apiError = err as ApiError;
        expect(apiError.statusCode).toBe(401);
        expect(apiError.message).toBe("No retry allowed");
      }
    });
  });

  describe("attachInterceptors", () => {
    it("deve conectar os interceptors a uma instância do Axios", () => {
      const instance = axios.create();
      const requestSpy = vi.spyOn(instance.interceptors.request, "use");
      const responseSpy = vi.spyOn(instance.interceptors.response, "use");

      attachInterceptors(instance);

      expect(requestSpy).toHaveBeenCalledWith(
        authRequestInterceptor,
        expect.any(Function),
      );
      expect(responseSpy).toHaveBeenCalledWith(
        expect.any(Function),
        errorResponseInterceptor,
      );
    });
  });
});
