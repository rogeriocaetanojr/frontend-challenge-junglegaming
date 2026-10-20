/**
 * Barramento de Eventos de Autenticação Tipado (Auth Event Bus).
 *
 * Gerencia emissão e escuta de eventos do ciclo de vida de autenticação:
 * - 'auth:expired': sessão expirada por 401 (com deduplicação sob concorrência).
 * - 'auth:unauthorized': acesso negado 401 para visitante sem sessão.
 * - 'auth:login': login efetuado com sucesso.
 * - 'auth:logout': logout manual ou programático.
 *
 * Captura e preserva a rota de retorno (returnTo) para retomada de fluxo.
 */
import { getStorage } from "./session-store";

export const RETURN_TO_STORAGE_KEY = "@nft-marketplace:return_to";

export interface AuthExpiredPayload {
  returnTo: string;
  timestamp: number;
}

export interface AuthUnauthorizedPayload {
  returnTo: string;
  timestamp: number;
}

export interface AuthLoginPayload {
  userId: string;
  token: string;
}

export interface AuthLogoutPayload {
  reason?: string;
}

export interface AuthEventMap {
  "auth:expired": AuthExpiredPayload;
  "auth:unauthorized": AuthUnauthorizedPayload;
  "auth:login": AuthLoginPayload;
  "auth:logout": AuthLogoutPayload;
}

export type AuthEventType = keyof AuthEventMap;
export type AuthEventHandler<T extends AuthEventType> = (
  payload: AuthEventMap[T],
) => void;

/**
 * Captura a rota atual do navegador para viabilizar retorno pós-autenticação.
 */
export function captureReturnTo(): string {
  if (typeof window !== "undefined" && window.location) {
    const { pathname, search } = window.location;
    return `${pathname || "/"}${search || ""}`;
  }
  return "/";
}

/**
 * Obtém a rota de retorno salva no storage.
 */
export function getReturnTo(): string | null {
  const storage = getStorage();
  return storage.getItem(RETURN_TO_STORAGE_KEY);
}

/**
 * Define e persiste a rota de retorno.
 */
export function setReturnTo(path: string): void {
  if (!path) return;
  const storage = getStorage();
  storage.setItem(RETURN_TO_STORAGE_KEY, path);
}

/**
 * Limpa a rota de retorno salva.
 */
export function clearReturnTo(): void {
  try {
    const storage = getStorage();
    storage.removeItem(RETURN_TO_STORAGE_KEY);
  } catch {
    // Ignora erros ao limpar
  }
}

/**
 * Barramento de eventos tipado com deduplicação de expiração e captura de returnTo.
 */
export class AuthEventBus {
  private listeners = new Map<AuthEventType, Set<(payload: unknown) => void>>();

  private lastExpiredTimestamp = 0;
  private deduplicationWindowMs = 2000;

  /**
   * Configura a janela de deduplicação (em milissegundos).
   */
  setDeduplicationWindow(windowMs: number): void {
    this.deduplicationWindowMs = windowMs;
  }

  /**
   * Registra um listener para um evento de autenticação.
   * Retorna uma função de cancelamento (unsubscribe).
   */
  on<T extends AuthEventType>(event: T, handler: AuthEventHandler<T>): () => void {
    let set = this.listeners.get(event);
    if (!set) {
      set = new Set();
      this.listeners.set(event, set);
    }
    set.add(handler as (payload: unknown) => void);
    return () => this.off(event, handler);
  }

  /**
   * Remove um listener previamente registrado.
   */
  off<T extends AuthEventType>(event: T, handler: AuthEventHandler<T>): void {
    const set = this.listeners.get(event);
    if (set) {
      set.delete(handler as (payload: unknown) => void);
    }
  }

  /**
   * Emite um evento para todos os listeners registrados.
   * Aplica deduplicação estrita para 'auth:expired' dentro da janela de expiração.
   * Retorna true se o evento foi emitido, ou false se foi ignorado por deduplicação.
   */
  emit<T extends AuthEventType>(event: T, payload: AuthEventMap[T]): boolean {
    const now = Date.now();

    if (event === "auth:expired") {
      if (now - this.lastExpiredTimestamp < this.deduplicationWindowMs) {
        // Chamada concorrente deduplicada dentro da janela de tolerância
        return false;
      }
      this.lastExpiredTimestamp = now;

      const expiredPayload = payload as AuthExpiredPayload;
      if (expiredPayload.returnTo) {
        setReturnTo(expiredPayload.returnTo);
      }
    } else if (event === "auth:unauthorized") {
      const unauthPayload = payload as AuthUnauthorizedPayload;
      if (unauthPayload.returnTo) {
        setReturnTo(unauthPayload.returnTo);
      }
    } else if (event === "auth:login") {
      // Login bem-sucedido: reseta o timestamp de expiração para novas ocorrências
      this.lastExpiredTimestamp = 0;
    }

    const currentListeners = this.listeners.get(event);

    if (currentListeners && currentListeners.size > 0) {
      // Itera sobre cópia para evitar efeitos colaterais de unsubscribe durante o disparo
      Array.from(currentListeners).forEach((handler) => {
        try {
          handler(payload);
        } catch (err) {
          console.error(`[authEventBus] Erro ao executar handler de '${event}':`, err);
        }
      });
    }

    return true;
  }

  /**
   * Reseta especificamente o timestamp de deduplicação sem desinscrever os listeners.
   */
  resetDeduplication(): void {
    this.lastExpiredTimestamp = 0;
  }

  /**
   * Reseta os listeners e os estados de controle de concorrência.
   */
  reset(): void {
    this.listeners.clear();
    this.lastExpiredTimestamp = 0;
    this.deduplicationWindowMs = 2000;
  }
}

/**
 * Instância singleton do barramento de eventos de autenticação.
 */
export const authEventBus = new AuthEventBus();

if (typeof window !== "undefined") {
  (window as unknown as { __authEventBus?: AuthEventBus }).__authEventBus = authEventBus;
}
