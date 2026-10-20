/**
 * Gerenciador de Sessão com Storage Local Versionado e Seguro.
 *
 * Persiste { token, expiresAt, userId } de forma resiliente contra dados corrompidos.
 * SEGURANÇA: Nunca armazena senhas, hashes ou credenciais sensíveis.
 */

export const SESSION_STORAGE_KEY = "@nft-marketplace:session";
export const STORAGE_VERSION = 1;

export interface StoredSession {
  token: string;
  expiresAt: string;
  userId: string;
}

export interface StoredSessionEnvelope {
  storageVersion: number;
  session: StoredSession;
}

/**
 * Storage em memória para ambientes SSR, testes sem localStorage ou
 * navegadores com cookies/storage bloqueados.
 */
class MemoryStorage implements Storage {
  private store = new Map<string, string>();

  get length(): number {
    return this.store.size;
  }

  clear(): void {
    this.store.clear();
  }

  getItem(key: string): string | null {
    return this.store.get(key) ?? null;
  }

  key(index: number): string | null {
    return Array.from(this.store.keys())[index] ?? null;
  }

  removeItem(key: string): void {
    this.store.delete(key);
  }

  setItem(key: string, value: string): void {
    this.store.set(key, value);
  }
}

const memoryStorageFallback = new MemoryStorage();

/**
 * Obtém a implementação ativa do Storage (localStorage ou fallback em memória).
 */
export function getStorage(): Storage {
  try {
    if (typeof window !== "undefined" && window.localStorage) {
      const testKey = "__storage_verify__";
      window.localStorage.setItem(testKey, "1");
      window.localStorage.removeItem(testKey);
      return window.localStorage;
    }
  } catch {
    // Storage desabilitado ou restrito por permissões do navegador
  }
  return memoryStorageFallback;
}

/**
 * Salva a sessão no storage com versionamento de schema.
 * Descarta estritamente quaisquer propriedades sensíveis não permitidas.
 */
export function setSession(input: StoredSession): void {
  if (!input || typeof input !== "object") {
    throw new Error("Invalid session input: session must be an object");
  }

  const token = String(input.token ?? "").trim();
  const expiresAt = String(input.expiresAt ?? "").trim();
  const userId = String(input.userId ?? "").trim();

  if (!token || !expiresAt || !userId) {
    throw new Error("Invalid session input: token, expiresAt, and userId are required");
  }

  const expTime = Date.parse(expiresAt);
  if (isNaN(expTime)) {
    throw new Error("Invalid session input: expiresAt must be a valid ISO date string");
  }

  // SEGURANÇA: Mantém estritamente token, expiresAt e userId, descartando
  // senhas, segredos ou dados sensíveis que o chamador possa ter repassado.
  const sanitized: StoredSession = {
    token,
    expiresAt,
    userId,
  };

  const envelope: StoredSessionEnvelope = {
    storageVersion: STORAGE_VERSION,
    session: sanitized,
  };

  const storage = getStorage();
  storage.setItem(SESSION_STORAGE_KEY, JSON.stringify(envelope));
}

/**
 * Recupera a sessão ativa do storage.
 * Retorna null e limpa o storage se os dados estiverem corrompidos, expirados
 * ou pertencerem a uma versão incompatível de schema.
 */
export function getSession(): StoredSession | null {
  const storage = getStorage();
  const raw = storage.getItem(SESSION_STORAGE_KEY);

  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw);

    if (!parsed || typeof parsed !== "object") {
      clearSession();
      return null;
    }

    // Validação de versionamento do schema
    if (parsed.storageVersion !== STORAGE_VERSION) {
      clearSession();
      return null;
    }

    const session = parsed.session;
    if (!session || typeof session !== "object") {
      clearSession();
      return null;
    }

    const { token, expiresAt, userId } = session;

    if (
      typeof token !== "string" ||
      !token.trim() ||
      typeof expiresAt !== "string" ||
      !expiresAt.trim() ||
      typeof userId !== "string" ||
      !userId.trim()
    ) {
      clearSession();
      return null;
    }

    // Validação de expiração temporal
    const expTime = Date.parse(expiresAt);
    if (isNaN(expTime) || expTime <= Date.now()) {
      clearSession();
      return null;
    }

    return {
      token: token.trim(),
      expiresAt: expiresAt.trim(),
      userId: userId.trim(),
    };
  } catch {
    // Payload JSON inválido/corrompido: fallback resiliente com limpeza
    clearSession();
    return null;
  }
}

/**
 * Remove a sessão do storage local.
 */
export function clearSession(): void {
  try {
    const storage = getStorage();
    storage.removeItem(SESSION_STORAGE_KEY);
  } catch {
    // Ignora erros ao tentar limpar em ambientes restritos
  }
}

/**
 * Verifica se existe uma sessão válida e não-expirada.
 */
export function hasValidSession(): boolean {
  return getSession() !== null;
}
