import axios, { type AxiosInstance } from "axios";

import { clearSession, getSession, setSession } from "@/lib/auth/session-store";

import { attachInterceptors } from "./interceptors";
import type { RequestConfig } from "./types";

/**
 * Permite que módulos legados ou store definam o token de sessão.
 * Sincroniza diretamente com o session-store versionado.
 */
export function setAuthToken(token: string | null): void {
  if (token) {
    const existing = getSession();
    setSession({
      token,
      userId: existing?.userId || "user_demo",
      expiresAt:
        existing?.expiresAt || new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    });
  } else {
    clearSession();
  }
}

/**
 * Recupera o token de autenticação ativo a partir do session-store.
 */
export function getAuthToken(): string | null {
  return getSession()?.token ?? null;
}

/**
 * Criação da instância centralizada do Axios com timeout e headers base.
 */
export const axiosInstance: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "/api",
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Conecta os interceptors de requisição (Bearer / X-Guest-Id) e de resposta (ApiError / 401)
attachInterceptors(axiosInstance);

/**
 * Cliente HTTP isolado que expõe métodos tipados sem vazar tipos do Axios.
 */
export const http = {
  async get<T>(url: string, config?: RequestConfig): Promise<T> {
    const response = await axiosInstance.get<T>(url, config);
    return response.data;
  },

  async post<T>(url: string, data?: unknown, config?: RequestConfig): Promise<T> {
    const response = await axiosInstance.post<T>(url, data, config);
    return response.data;
  },

  async put<T>(url: string, data?: unknown, config?: RequestConfig): Promise<T> {
    const response = await axiosInstance.put<T>(url, data, config);
    return response.data;
  },

  async patch<T>(url: string, data?: unknown, config?: RequestConfig): Promise<T> {
    const response = await axiosInstance.patch<T>(url, data, config);
    return response.data;
  },

  async delete<T>(url: string, config?: RequestConfig): Promise<T> {
    const response = await axiosInstance.delete<T>(url, config);
    return response.data;
  },
};
