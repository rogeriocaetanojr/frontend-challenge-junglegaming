/**
 * Testes de integração dos handlers REST de identidade e autenticação com MSW.
 */
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";

import type { ApiErrorBody } from "@/contracts/common";
import type { Session, User, Wallet, WalletConnectionResult } from "@/contracts/identity";
import { resetDb } from "@/mocks/db";
import { scenarioEngine } from "@/mocks/scenarios";
import { server } from "@/mocks/server";

const BASE_URL = "http://localhost/api";

describe("Identity Handlers (src/mocks/handlers/identity.handlers.ts)", () => {
  beforeAll(() => {
    server.listen();
  });

  afterEach(() => {
    server.resetHandlers();
    resetDb();
    scenarioEngine.reset();
  });

  afterAll(() => {
    server.close();
  });

  describe("POST /api/auth/login", () => {
    it("deve autenticar o usuário demo com credenciais válidas e retornar sessão", async () => {
      const res = await fetch(`${BASE_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: "demo@jungle.com",
          password: "Password123!",
        }),
      });

      expect(res.status).toBe(200);

      const session = (await res.json()) as Session;
      expect(session.token).toBeDefined();
      expect(session.expiresAt).toBeDefined();
      expect(session.user.email).toBe("demo@jungle.com");
      expect(session.user.name).toBe("Alex Jungle");
    });

    it("deve retornar 401 unauthorized para senha incorreta ou usuário inexistente", async () => {
      const res = await fetch(`${BASE_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: "demo@jungle.com",
          password: "WrongPassword!",
        }),
      });

      expect(res.status).toBe(401);

      const error = (await res.json()) as ApiErrorBody;
      expect(error.code).toBe("unauthorized");
      expect(error.message).toContain("Credenciais inválidas");
    });
  });

  describe("POST /api/auth/register", () => {
    it("deve cadastrar um novo usuário com sucesso e criar carteira padrão", async () => {
      const res = await fetch(`${BASE_URL}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "Novo Colecionador",
          email: "novo@jungle.com",
          password: "SecurePassword123!",
        }),
      });

      expect(res.status).toBe(201);

      const session = (await res.json()) as Session;
      expect(session.token).toBeDefined();
      expect(session.user.name).toBe("Novo Colecionador");
      expect(session.user.email).toBe("novo@jungle.com");

      // Verifica se a carteira primária foi criada automaticamente
      const walletsRes = await fetch(`${BASE_URL}/wallets`, {
        headers: { Authorization: `Bearer ${session.token}` },
      });
      expect(walletsRes.status).toBe(200);

      const wallets = (await walletsRes.json()) as Wallet[];
      expect(wallets).toHaveLength(1);
      expect(wallets[0]!.role).toBe("primary");
      expect(wallets[0]!.network).toBe("ethereum");
    });

    it("deve retornar 409 email_taken quando tentar cadastrar e-mail já existente", async () => {
      const res = await fetch(`${BASE_URL}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "Impostor",
          email: "demo@jungle.com",
          password: "Password123!",
        }),
      });

      expect(res.status).toBe(409);

      const error = (await res.json()) as ApiErrorBody;
      expect(error.code).toBe("email_taken");
    });
  });

  describe("GET /api/auth/me", () => {
    it("deve retornar dados do usuário autenticado via cabeçalho Authorization", async () => {
      const res = await fetch(`${BASE_URL}/auth/me`, {
        headers: { Authorization: "Bearer mock-token-user_demo" },
      });

      expect(res.status).toBe(200);

      const user = (await res.json()) as User;
      expect(user.id).toBe("user_demo");
      expect(user.email).toBe("demo@jungle.com");
      expect(user.name).toBe("Alex Jungle");
    });

    it("deve retornar 401 unauthorized quando cabeçalho estiver ausente ou inválido", async () => {
      const res = await fetch(`${BASE_URL}/auth/me`);
      expect(res.status).toBe(401);

      const error = (await res.json()) as ApiErrorBody;
      expect(error.code).toBe("unauthorized");
    });

    it("deve retornar 401 session_expired quando o cenário auth_expired estiver ativo", async () => {
      scenarioEngine.setScenario("auth_expired");

      const res = await fetch(`${BASE_URL}/auth/me`, {
        headers: { Authorization: "Bearer mock-token-user_demo" },
      });

      expect(res.status).toBe(401);

      const error = (await res.json()) as ApiErrorBody;
      expect(error.code).toBe("session_expired");
    });
  });

  describe("POST /api/auth/logout", () => {
    it("deve deslogar com sucesso retornando status 200", async () => {
      const res = await fetch(`${BASE_URL}/auth/logout`, {
        method: "POST",
      });
      expect(res.status).toBe(200);

      const data = (await res.json()) as { success: boolean };
      expect(data.success).toBe(true);
    });
  });

  describe("GET /api/wallets e POST /api/wallets/connect", () => {
    it("deve listar as carteiras do usuário demo autenticado", async () => {
      const res = await fetch(`${BASE_URL}/wallets`, {
        headers: { Authorization: "Bearer mock-token-user_demo" },
      });

      expect(res.status).toBe(200);

      const wallets = (await res.json()) as Wallet[];
      expect(wallets).toHaveLength(2);
      expect(wallets.some((w) => w.network === "ethereum")).toBe(true);
      expect(wallets.some((w) => w.network === "polygon")).toBe(true);
    });

    it("deve conectar uma nova carteira com sucesso", async () => {
      const res = await fetch(`${BASE_URL}/wallets/connect`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer mock-token-user_demo",
        },
        body: JSON.stringify({
          network: "arbitrum",
          address: "0x1234567890abcdef1234567890abcdef12345678",
          label: "Arbitrum Vault",
        }),
      });

      expect(res.status).toBe(201);

      const result = (await res.json()) as WalletConnectionResult;
      expect(result.connected).toBe(true);
      expect(result.wallet?.network).toBe("arbitrum");
      expect(result.wallet?.address).toBe("0x1234567890abcdef1234567890abcdef12345678");
      expect(result.wallet?.role).toBe("secondary");

      // Valida persistência na listagem
      const listRes = await fetch(`${BASE_URL}/wallets`, {
        headers: { Authorization: "Bearer mock-token-user_demo" },
      });
      const updatedWallets = (await listRes.json()) as Wallet[];
      expect(updatedWallets).toHaveLength(3);
    });
  });
});
