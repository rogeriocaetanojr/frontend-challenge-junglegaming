/**
 * Gerenciador de Guest ID para Visitantes Anônimos.
 *
 * Persiste um identificador UUID v4 no storage para rastrear o carrinho anônimo
 * e permitir o merge idempotente após a autenticação.
 */
import { getStorage } from "./session-store";

export const GUEST_ID_STORAGE_KEY = "@nft-marketplace:guest_id";

const UUID_V4_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/**
 * Valida se uma string é um UUID v4 canônico.
 */
export function isValidUuid(id: unknown): id is string {
  return typeof id === "string" && UUID_V4_REGEX.test(id);
}

/**
 * Gera um UUID v4 via crypto.randomUUID() com fallback para RFC 4122.
 */
export function generateGuestId(): string {
  if (
    typeof globalThis !== "undefined" &&
    globalThis.crypto &&
    typeof globalThis.crypto.randomUUID === "function"
  ) {
    return globalThis.crypto.randomUUID();
  }

  // Fallback compatível RFC 4122 v4
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Retorna o guestId existente ou gera e persiste um novo se ausente/inválido.
 */
export function getGuestId(): string {
  const storage = getStorage();
  const existing = storage.getItem(GUEST_ID_STORAGE_KEY);

  if (existing && isValidUuid(existing)) {
    return existing;
  }

  const newId = generateGuestId();
  storage.setItem(GUEST_ID_STORAGE_KEY, newId);
  return newId;
}

/**
 * Define ou substitui o guestId manualmente no storage.
 */
export function setGuestId(id: string): void {
  if (!isValidUuid(id)) {
    throw new Error(`Invalid guestId format: '${id}' is not a valid UUID v4`);
  }
  const storage = getStorage();
  storage.setItem(GUEST_ID_STORAGE_KEY, id);
}

/**
 * Limpa o guestId persistido.
 */
export function clearGuestId(): void {
  try {
    const storage = getStorage();
    storage.removeItem(GUEST_ID_STORAGE_KEY);
  } catch {
    // Ignora erros ao limpar
  }
}
