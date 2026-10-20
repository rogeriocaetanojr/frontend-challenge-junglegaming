import { beforeEach, describe, expect, it } from "vitest";

import {
  clearSession,
  getSession,
  hasValidSession,
  SESSION_STORAGE_KEY,
  setSession,
  STORAGE_VERSION,
  type StoredSession,
} from "../session-store";

describe("SessionStore (src/lib/auth/session-store.ts)", () => {
  beforeEach(() => {
    localStorage.clear();
    clearSession();
  });

  const validSession: StoredSession = {
    token: "mock-jwt-token-alex-vance",
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    userId: "usr_mock_001",
  };

  it("deve salvar e recuperar uma sessão válida com token, expiresAt e userId", () => {
    setSession(validSession);

    expect(hasValidSession()).toBe(true);
    const retrieved = getSession();
    expect(retrieved).not.toBeNull();
    expect(retrieved?.token).toBe(validSession.token);
    expect(retrieved?.expiresAt).toBe(validSession.expiresAt);
    expect(retrieved?.userId).toBe(validSession.userId);
  });

  it("deve limpar a sessão via clearSession() e atualizar hasValidSession() para false", () => {
    setSession(validSession);
    expect(hasValidSession()).toBe(true);

    clearSession();
    expect(hasValidSession()).toBe(false);
    expect(getSession()).toBeNull();
  });

  it("deve retornar null e limpar o storage quando o JSON estiver corrompido", () => {
    localStorage.setItem(SESSION_STORAGE_KEY, "{ invalid-json-payload %%%");

    expect(getSession()).toBeNull();
    expect(hasValidSession()).toBe(false);
    expect(localStorage.getItem(SESSION_STORAGE_KEY)).toBeNull();
  });

  it("deve retornar null e descartar a sessão se o storageVersion for incompatível", () => {
    const outdatedEnvelope = {
      storageVersion: 999, // Versão diferente da esperada
      session: validSession,
    };
    localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(outdatedEnvelope));

    expect(getSession()).toBeNull();
    expect(hasValidSession()).toBe(false);
    expect(localStorage.getItem(SESSION_STORAGE_KEY)).toBeNull();
  });

  it("deve expirar automaticamente e limpar o storage quando expiresAt estiver no passado", () => {
    const expiredSession: StoredSession = {
      token: "expired-token",
      expiresAt: new Date(Date.now() - 1000 * 60).toISOString(), // 1 min atrás
      userId: "usr_expired",
    };

    setSession(expiredSession);

    expect(hasValidSession()).toBe(false);
    expect(getSession()).toBeNull();
    expect(localStorage.getItem(SESSION_STORAGE_KEY)).toBeNull();
  });

  it("deve retornar null se algum campo essencial estiver ausente ou vazio", () => {
    const incompleteEnvelope = {
      storageVersion: STORAGE_VERSION,
      session: {
        token: "some-token",
        // expiresAt ausente
        userId: "user-1",
      },
    };
    localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(incompleteEnvelope));

    expect(getSession()).toBeNull();
    expect(localStorage.getItem(SESSION_STORAGE_KEY)).toBeNull();
  });

  it("REGRA ELIMINATÓRIA DE SEGURANÇA: nunca deve persistir senhas, credenciais ou dados sensíveis", () => {
    // Simula tentativa de passar payload com campos sensíveis
    const maliciousInput = {
      token: "valid-safe-token",
      expiresAt: new Date(Date.now() + 60000).toISOString(),
      userId: "usr_safe",
      password: "PlainTextPassword123!",
      passwordHash: "pbkdf2_hash_secret_string",
      credentials: { email: "attacker@test.com", password: "pwned" },
    } as unknown as StoredSession;

    setSession(maliciousInput);

    const rawInStorage = localStorage.getItem(SESSION_STORAGE_KEY);
    expect(rawInStorage).not.toBeNull();
    expect(rawInStorage).not.toContain("PlainTextPassword123!");
    expect(rawInStorage).not.toContain("pbkdf2_hash_secret_string");
    expect(rawInStorage).not.toContain("password");
    expect(rawInStorage).not.toContain("credentials");

    const parsed = JSON.parse(rawInStorage!);
    expect(parsed.session).toEqual({
      token: "valid-safe-token",
      expiresAt: maliciousInput.expiresAt,
      userId: "usr_safe",
    });
  });

  it("deve lançar erro ao tentar persistir sessão com campos vazios ou formato inválido", () => {
    expect(() =>
      setSession({
        token: "",
        expiresAt: new Date().toISOString(),
        userId: "u1",
      }),
    ).toThrow();

    expect(() =>
      setSession({
        token: "tok",
        expiresAt: "not-a-date",
        userId: "u1",
      }),
    ).toThrow();
  });
});
