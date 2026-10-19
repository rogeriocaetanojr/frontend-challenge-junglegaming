import axios, {
  type AxiosError,
  type AxiosInstance,
  type InternalAxiosRequestConfig,
} from "axios";

import { ApiError, type RequestConfig } from "./types";

let currentToken: string | null = null;

/**
 * Permite que módulos de autenticação definam o token de sessão em memória.
 */
export function setAuthToken(token: string | null): void {
  currentToken = token;
  if (typeof window !== "undefined") {
    if (token) {
      localStorage.setItem("auth_token", token);
    } else {
      localStorage.removeItem("auth_token");
    }
  }
}

/**
 * Recupera o token de autenticação atual (em memória ou localStorage).
 */
export function getAuthToken(): string | null {
  if (currentToken) return currentToken;
  if (typeof window !== "undefined") {
    return localStorage.getItem("auth_token");
  }
  return null;
}

/**
 * Criação da instância centralizada do Axios configurada conforme o edital.
 */
const axiosInstance: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "/api",
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Interceptor de Requisição: Injeção automática de Bearer token
axiosInstance.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = getAuthToken();
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: unknown) => Promise.reject(error),
);

// Interceptor de Resposta: Normalização de erros e tratamento de 401
axiosInstance.interceptors.response.use(
  (response) => response,
  (error: AxiosError<{ message?: string; error?: string }>) => {
    const statusCode = error.response?.status || 0;
    const responseData = error.response?.data;

    const message =
      responseData?.message ||
      responseData?.error ||
      error.message ||
      "Ocorreu um erro inesperado na comunicação com o servidor.";

    // Notificação ou gatilho em caso de não-autorizado (401)
    if (statusCode === 401 && typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("http:unauthorized"));
    }

    return Promise.reject(
      new ApiError(message, statusCode, responseData || error.toJSON?.()),
    );
  },
);

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
