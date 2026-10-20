/**
 * Testes unitários do módulo de idempotência e hash canônico SHA-256.
 */
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { resetDb } from "@/mocks/db";
import {
  clearIdempotencyRecords,
  computeCanonicalHash,
  findIdempotencyRecord,
  saveIdempotencyRecord,
  stableStringify,
} from "@/mocks/lib/idempotency";

describe("Idempotency Library (src/mocks/lib/idempotency.ts)", () => {
  beforeEach(() => {
    resetDb();
  });

  afterEach(() => {
    clearIdempotencyRecords();
  });

  describe("stableStringify", () => {
    it("deve gerar a mesma representação JSON independente da ordem das propriedades do objeto", () => {
      const objA = { b: 2, a: 1, c: { y: "test", x: 10 } };
      const objB = { a: 1, c: { x: 10, y: "test" }, b: 2 };

      expect(stableStringify(objA)).toBe(stableStringify(objB));
      expect(stableStringify(objA)).toBe('{"a":1,"b":2,"c":{"x":10,"y":"test"}}');
    });

    it("deve lidar corretamente com arrays e valores primitivos", () => {
      expect(stableStringify([3, 2, 1])).toBe("[3,2,1]");
      expect(stableStringify("hello")).toBe('"hello"');
      expect(stableStringify(123)).toBe("123");
      expect(stableStringify(null)).toBe("null");
    });
  });

  describe("computeCanonicalHash", () => {
    it("deve gerar o mesmo hash SHA-256 para payloads estruturalmente idênticos com chaves em ordens diferentes", async () => {
      const payload1 = {
        quoteId: "quote_123",
        walletId: "wallet_demo",
        network: "ethereum",
        collector: { name: "Alex", email: "alex@jungle.com" },
      };

      const payload2 = {
        network: "ethereum",
        collector: { email: "alex@jungle.com", name: "Alex" },
        walletId: "wallet_demo",
        quoteId: "quote_123",
      };

      const hash1 = await computeCanonicalHash(payload1);
      const hash2 = await computeCanonicalHash(payload2);

      expect(hash1).toBe(hash2);
      expect(hash1).toMatch(/^[a-f0-9]{64}$/);
    });

    it("deve gerar hashes diferentes para payloads com conteúdos distintos", async () => {
      const hashA = await computeCanonicalHash({ id: "1" });
      const hashB = await computeCanonicalHash({ id: "2" });

      expect(hashA).not.toBe(hashB);
    });
  });

  describe("Armazenamento e consulta no db.idempotency", () => {
    it("deve salvar e recuperar registros de idempotência associados a (userId, key)", () => {
      const userId = "user_demo";
      const key = "key_12345";
      const requestHash = "abcde12345";
      const orderId = "order_999";

      expect(findIdempotencyRecord(userId, key)).toBeUndefined();

      const record = saveIdempotencyRecord({
        userId,
        key,
        requestHash,
        orderId,
      });

      expect(record.userId).toBe(userId);
      expect(record.key).toBe(key);
      expect(record.requestHash).toBe(requestHash);
      expect(record.orderId).toBe(orderId);

      const retrieved = findIdempotencyRecord(userId, key);
      expect(retrieved).toBeDefined();
      expect(retrieved?.orderId).toBe(orderId);
      expect(retrieved?.requestHash).toBe(requestHash);
    });
  });
});
