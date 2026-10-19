/**
 * Estrutura padronizada de erro da camada HTTP/API.
 */
export class ApiError<T = unknown> extends Error {
  readonly statusCode: number;
  readonly details?: T;

  constructor(message: string, statusCode: number, details?: T) {
    super(message);
    this.name = "ApiError";
    this.statusCode = statusCode;
    this.details = details;
    Object.setPrototypeOf(this, ApiError.prototype);
  }
}

/**
 * Opções de configuração para requisições HTTP isoladas de dependências externas.
 */
export interface RequestConfig {
  headers?: Record<string, string>;
  params?: Record<string, unknown>;
  signal?: AbortSignal;
  timeout?: number;
  withCredentials?: boolean;
}

/**
 * Resposta padrão retornada pelo cliente HTTP.
 */
export interface HttpResponse<T> {
  data: T;
  status: number;
  statusText: string;
}
