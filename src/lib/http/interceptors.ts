/**
 * Interceptors do Axios para Autenticação, Rastreamento de Visitantes e Resiliência.
 *
 * 1. Injeta 'Authorization: Bearer <token>' caso haja sessão ativa e válida.
 * 2. Injeta 'X-Guest-Id: <uuid>' caso o usuário seja anônimo/deslogado.
 * 3. Normaliza erros de resposta HTTP para ApiError e dispara 'http:unauthorized' em 401.
 */
import type { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from "axios";

import { getGuestId } from "@/lib/auth/guest-id";
import { getSession } from "@/lib/auth/session-store";

import { ApiError } from "./types";

/**
 * Interceptor de requisição: injeta Bearer token para usuários autenticados
 * ou X-Guest-Id para visitantes anônimos.
 */
export function authRequestInterceptor(
  config: InternalAxiosRequestConfig,
): InternalAxiosRequestConfig {
  const session = getSession();

  if (!config.headers) {
    config.headers = {} as InternalAxiosRequestConfig["headers"];
  }

  if (session?.token) {
    if (typeof config.headers.set === "function") {
      config.headers.set("Authorization", `Bearer ${session.token}`);
      config.headers.delete("X-Guest-Id");
    } else {
      config.headers["Authorization"] = `Bearer ${session.token}`;
      delete config.headers["X-Guest-Id"];
    }
  } else {
    const guestId = getGuestId();
    if (typeof config.headers.set === "function") {
      config.headers.set("X-Guest-Id", guestId);
      config.headers.delete("Authorization");
    } else {
      config.headers["X-Guest-Id"] = guestId;
      delete config.headers["Authorization"];
    }
  }

  return config;
}

/**
 * Interceptor de erro de resposta: normaliza para ApiError e emite evento 401.
 */
export function errorResponseInterceptor(
  error: AxiosError<{ message?: string; error?: string }>,
): Promise<never> {
  const statusCode = error.response?.status || 0;
  const responseData = error.response?.data;

  const message =
    responseData?.message ||
    responseData?.error ||
    error.message ||
    "Ocorreu um erro inesperado na comunicação com o servidor.";

  if (statusCode === 401 && typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("http:unauthorized"));
  }

  return Promise.reject(
    new ApiError(message, statusCode, responseData || error.toJSON?.()),
  );
}

/**
 * Conecta os interceptors na instância do Axios.
 */
export function attachInterceptors(instance: AxiosInstance): void {
  instance.interceptors.request.use(authRequestInterceptor, (error: unknown) =>
    Promise.reject(error),
  );

  instance.interceptors.response.use((response) => response, errorResponseInterceptor);
}
