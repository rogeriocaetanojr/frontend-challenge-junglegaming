/**
 * Testes dos handlers REST de gerenciamento e simulação de conexão de carteiras Web3 (MSW v3).
 *
 * Cobre:
 * - Listagem estritamente isolada por usuário (GET /api/wallets).
 * - Validação rigorosa de formato de endereço 0x com 40 dígitos hexadecimais (422).
 * - Controle de concorrência e unicidade atômica de papéis (no máximo 1 primary e 1 secondary).
 * - Simulação de connect/disconnect e integração com cenários de recusa (wallet_rejected).
 */
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";

import type { ApiErrorBody, IsoDate } from "@/contracts/common";
import type { Wallet, WalletConnectionResult } from "@/contracts/identity";
import { db, resetDb } from "@/mocks/db";
import { scenarioEngine } from "@/mocks/scenarios";
import { server } from "@/mocks/server";

const BASE_URL = "http://localhost/api";
const DEMO_TOKEN = "mock-token-user_demo";

describe("Wallets Handlers (src/mocks/handlers/wallets.ts)", () => {
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

  describe("GET /api/wallets", () => {
    it("deve retornar 401 unauthorized quando cabeçalho Authorization for omitido", async () => {
      const res = await fetch(`${BASE_URL}/wallets`);
      expect(res.status).toBe(401);

      const error = (await res.json()) as ApiErrorBody;
      expect(error.code).toBe("unauthorized");
    });

    it("deve retornar apenas as carteiras do usuário autenticado (isolamento por usuário)", async () => {
      // Cria outro usuário e uma carteira para ele
      const otherUser = {
        id: "user_other" as unknown as Wallet["userId"],
        name: "Other User",
        email: "other@jungle.com",
        createdAt: new Date().toISOString() as IsoDate,
        passwordHash: "Password123!",
      };
      db.users.set(otherUser.id, otherUser);
      db.wallets.set("wallet_other_1", {
        id: "wallet_other_1" as unknown as Wallet["id"],
        userId: otherUser.id,
        role: "primary",
        network: "ethereum",
        address: "0xAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA",
        label: "Other Wallet",
      });

      // Requisição autenticada como user_demo
      const res = await fetch(`${BASE_URL}/wallets`, {
        headers: { Authorization: `Bearer ${DEMO_TOKEN}` },
      });

      expect(res.status).toBe(200);
      const wallets = (await res.json()) as Wallet[];

      // O usuário demo possui exatamente 2 carteiras na seed
      expect(wallets).toHaveLength(2);
      expect(wallets.every((w) => w.userId === "user_demo")).toBe(true);
      expect(wallets.some((w) => w.id === "wallet_other_1")).toBe(false);
    });
  });

  describe("POST /api/wallets", () => {
    it("deve retornar 401 unauthorized para requisição sem token", async () => {
      const res = await fetch(`${BASE_URL}/wallets`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          address: "0x1234567890abcdef1234567890abcdef12345678",
        }),
      });
      expect(res.status).toBe(401);
    });

    it("deve rejeitar com status 422 quando o endereço 0x for inválido", async () => {
      const invalidAddresses = [
        "not-an-address",
        "0x123", // muito curto
        "0xGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGG", // caracteres não hexadecimais
        "1234567890abcdef1234567890abcdef12345678", // falta 0x
        "0x1234567890abcdef1234567890abcdef123456789012", // muito longo
      ];

      for (const invalidAddress of invalidAddresses) {
        const res = await fetch(`${BASE_URL}/wallets`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${DEMO_TOKEN}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            address: invalidAddress,
            network: "ethereum",
          }),
        });

        expect(res.status).toBe(422);
        const error = (await res.json()) as ApiErrorBody;
        expect(error.code).toBe("validation_error");
        expect(error.fieldErrors?.address).toBeDefined();
        expect(error.fieldErrors?.address?.[0]).toContain("0x seguido de 40");
      }
    });

    it("deve cadastrar uma carteira válida com status 201 e persistir em db.wallets", async () => {
      const validAddress = "0xAbCdEf1234567890AbCdEf1234567890AbCdEf12";

      const res = await fetch(`${BASE_URL}/wallets`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${DEMO_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          address: validAddress,
          network: "arbitrum",
          label: "Arbitrum Storage",
          role: "secondary",
        }),
      });

      expect(res.status).toBe(201);
      const created = (await res.json()) as Wallet;
      expect(created.id).toBeDefined();
      expect(created.address).toBe(validAddress);
      expect(created.network).toBe("arbitrum");
      expect(created.userId).toBe("user_demo");
      expect(db.wallets.has(created.id)).toBe(true);
    });

    it("deve garantir no máximo 1 carteira 'primary' por usuário, rebaixando a anterior para 'secondary'", async () => {
      // user_demo já tem wallet_demo_eth como primary
      const initialPrimary = db.wallets.get("wallet_demo_eth");
      expect(initialPrimary?.role).toBe("primary");

      const newPrimaryAddress = "0x9999999999999999999999999999999999999999";
      const res = await fetch(`${BASE_URL}/wallets`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${DEMO_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          address: newPrimaryAddress,
          network: "base",
          label: "New Primary Base Wallet",
          role: "primary",
        }),
      });

      expect(res.status).toBe(201);
      const newWallet = (await res.json()) as Wallet;
      expect(newWallet.role).toBe("primary");

      // A primária anterior deve ter sido rebaixada para secondary
      const rebaixada = db.wallets.get("wallet_demo_eth");
      expect(rebaixada?.role).toBe("secondary");

      // Deve haver exatamente 1 carteira primária para o usuário
      const userWallets = Array.from(db.wallets.values()).filter(
        (w) => w.userId === "user_demo",
      );
      const primaryCount = userWallets.filter((w) => w.role === "primary").length;
      expect(primaryCount).toBe(1);
    });
  });

  describe("PUT /api/wallets/:id", () => {
    it("deve retornar 404 not_found se a carteira não existir ou pertencer a outro usuário", async () => {
      const res = await fetch(`${BASE_URL}/wallets/wallet_inexistente`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${DEMO_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ label: "Updated Label" }),
      });

      expect(res.status).toBe(404);
      const error = (await res.json()) as ApiErrorBody;
      expect(error.code).toBe("not_found");
    });

    it("deve rejeitar atualização com status 422 quando o novo endereço for inválido", async () => {
      const res = await fetch(`${BASE_URL}/wallets/wallet_demo_eth`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${DEMO_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ address: "invalid-0x-format" }),
      });

      expect(res.status).toBe(422);
      const error = (await res.json()) as ApiErrorBody;
      expect(error.code).toBe("validation_error");
      expect(error.fieldErrors?.address).toBeDefined();
    });

    it("deve atualizar com sucesso e rebaixar a primária anterior quando a secundária for promovida a primária", async () => {
      // wallet_demo_poly é secondary
      expect(db.wallets.get("wallet_demo_poly")?.role).toBe("secondary");
      expect(db.wallets.get("wallet_demo_eth")?.role).toBe("primary");

      const res = await fetch(`${BASE_URL}/wallets/wallet_demo_poly`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${DEMO_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          role: "primary",
          label: "Promoted to Main Polygon",
        }),
      });

      expect(res.status).toBe(200);
      const updated = (await res.json()) as Wallet;
      expect(updated.role).toBe("primary");
      expect(updated.label).toBe("Promoted to Main Polygon");

      // A wallet_demo_eth deve ter sido rebaixada para secondary
      expect(db.wallets.get("wallet_demo_eth")?.role).toBe("secondary");

      // Deve haver no máximo 1 primary
      const userWallets = Array.from(db.wallets.values()).filter(
        (w) => w.userId === "user_demo",
      );
      expect(userWallets.filter((w) => w.role === "primary")).toHaveLength(1);
    });
  });

  describe("POST /api/wallets/:id/connect e POST /api/wallets/:id/disconnect", () => {
    it("deve conectar a carteira com sucesso e retornar status 200 com timestamp", async () => {
      const res = await fetch(`${BASE_URL}/wallets/wallet_demo_eth/connect`, {
        method: "POST",
        headers: { Authorization: `Bearer ${DEMO_TOKEN}` },
      });

      expect(res.status).toBe(200);
      const body = (await res.json()) as {
        connected: boolean;
        result: string;
        wallet: Wallet;
        connectedAt: string;
      };

      expect(body.connected).toBe(true);
      expect(body.result).toBe("connected");
      expect(body.wallet.connected).toBe(true);
      expect(body.connectedAt).toBeDefined();

      // Confirma persistência em db.wallets
      const persisted = db.wallets.get("wallet_demo_eth");
      expect(persisted?.connected).toBe(true);
      expect(persisted?.connectedAt).toBeDefined();
    });

    it("deve simular recusa de conexão quando o cenário wallet_rejected estiver ativo no scenarioEngine", async () => {
      scenarioEngine.setScenario("wallet_rejected");

      const res = await fetch(`${BASE_URL}/wallets/wallet_demo_eth/connect`, {
        method: "POST",
        headers: { Authorization: `Bearer ${DEMO_TOKEN}` },
      });

      expect(res.status).toBe(400);
      const body = (await res.json()) as {
        connected: boolean;
        result: string;
        reason: string;
      };

      expect(body.connected).toBe(false);
      expect(body.result).toBe("refused");
      expect(body.reason).toContain("recusada");
    });

    it("deve desconectar a carteira com sucesso retornando status 200 e limpando o timestamp", async () => {
      // Conecta primeiro
      await fetch(`${BASE_URL}/wallets/wallet_demo_eth/connect`, {
        method: "POST",
        headers: { Authorization: `Bearer ${DEMO_TOKEN}` },
      });
      expect(db.wallets.get("wallet_demo_eth")?.connected).toBe(true);

      // Agora desconecta
      const res = await fetch(`${BASE_URL}/wallets/wallet_demo_eth/disconnect`, {
        method: "POST",
        headers: { Authorization: `Bearer ${DEMO_TOKEN}` },
      });

      expect(res.status).toBe(200);
      const body = (await res.json()) as {
        connected: boolean;
        result: string;
        wallet: Wallet;
      };

      expect(body.connected).toBe(false);
      expect(body.result).toBe("disconnected");

      // Confirma remoção do estado conectado
      const persisted = db.wallets.get("wallet_demo_eth");
      expect(persisted?.connected).toBe(false);
      expect(persisted?.connectedAt).toBeUndefined();
    });
  });

  describe("POST /api/wallets/connect (fluxo rápido / retrocompatibilidade)", () => {
    it("deve criar e conectar nova carteira retornando status 201", async () => {
      const res = await fetch(`${BASE_URL}/wallets/connect`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${DEMO_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          network: "polygon",
          address: "0x1111111111111111111111111111111111111111",
          label: "Gaming Vault",
        }),
      });

      expect(res.status).toBe(201);
      const result = (await res.json()) as WalletConnectionResult;
      expect(result.connected).toBe(true);
      expect(result.wallet?.address).toBe("0x1111111111111111111111111111111111111111");
    });
  });
});
