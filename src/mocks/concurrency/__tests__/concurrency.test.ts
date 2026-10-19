/**
 * Testes unitários do controle de concorrência otimista e simulador de corridas.
 */
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import {
  applyOptimisticLock,
  normalizeVersion,
  OptimisticLockError,
  raceSimulator,
  validateVersion,
} from "@/mocks/concurrency";

describe("Concurrency and Optimistic Locking (src/mocks/concurrency)", () => {
  beforeEach(() => {
    raceSimulator.reset();
  });

  afterEach(() => {
    raceSimulator.reset();
  });

  describe("normalizeVersion", () => {
    it("deve normalizar números inteiros", () => {
      expect(normalizeVersion(1)).toBe(1);
      expect(normalizeVersion(42)).toBe(42);
      expect(normalizeVersion(3.7)).toBe(3);
    });

    it("deve converter strings numéricas e remover prefixos/aspas de ETag", () => {
      expect(normalizeVersion("5")).toBe(5);
      expect(normalizeVersion('"7"')).toBe(7);
      expect(normalizeVersion('W/"12"')).toBe(12);
      expect(normalizeVersion("w/'3'")).toBe(3);
    });

    it("deve retornar undefined para valores vazios ou inválidos", () => {
      expect(normalizeVersion(null)).toBeUndefined();
      expect(normalizeVersion(undefined)).toBeUndefined();
      expect(normalizeVersion("")).toBeUndefined();
      expect(normalizeVersion("invalid-etag")).toBeUndefined();
    });
  });

  describe("validateVersion", () => {
    it("deve retornar 409 conflict_version_mismatch quando a versão esperada estiver defasada", () => {
      const currentVersion = 3;
      const outdatedExpectedVersion = 2;

      const result = validateVersion(currentVersion, outdatedExpectedVersion);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error?.status).toBe(409);
      expect(result.error?.body.code).toBe("conflict_version_mismatch");
      expect(result.error?.body.currentVersion).toBe(3);
      expect(result.error?.body.expectedVersion).toBe(2);
      expect(result.error?.body.message).toContain("Conflito de concorrência");
    });

    it("deve retornar 409 quando a versão esperada for à frente da versão atual", () => {
      const currentVersion = 1;
      const futureVersion = 2;

      const result = validateVersion(currentVersion, futureVersion);

      expect(result.success).toBe(false);
      expect(result.error?.status).toBe(409);
      expect(result.error?.body.code).toBe("conflict_version_mismatch");
    });

    it("deve ter sucesso e incrementar a versão quando a versão esperada coincidir", () => {
      const currentVersion = 5;
      const expectedVersion = 5;

      const result = validateVersion(currentVersion, expectedVersion);

      expect(result.success).toBe(true);
      expect(result.nextVersion).toBe(6);
      expect(result.error).toBeUndefined();
    });

    it("deve ter sucesso e incrementar a versão quando a versão esperada for omitida (null/undefined)", () => {
      const currentVersion = 2;

      const resultWithoutVersion = validateVersion(currentVersion);
      expect(resultWithoutVersion.success).toBe(true);
      expect(resultWithoutVersion.nextVersion).toBe(3);

      const resultWithNull = validateVersion(currentVersion, null);
      expect(resultWithNull.success).toBe(true);
      expect(resultWithNull.nextVersion).toBe(3);
    });

    it("deve aceitar versões enviadas como string no formato ETag", () => {
      const currentVersion = 4;
      const expectedVersionHeader = 'W/"4"';

      const result = validateVersion(currentVersion, expectedVersionHeader);

      expect(result.success).toBe(true);
      expect(result.nextVersion).toBe(5);
    });
  });

  describe("applyOptimisticLock", () => {
    it("deve incrementar atomicamente a propriedade version do objeto quando válido", () => {
      const entity = { id: "nft-1", price: "2.5", version: 1 };

      const result = applyOptimisticLock(entity, 1);

      expect(result.success).toBe(true);
      expect(result.nextVersion).toBe(2);
      expect(entity.version).toBe(2);
    });

    it("não deve alterar a versão da entidade quando houver conflito de versão", () => {
      const entity = { id: "cart-1", itemsCount: 3, version: 4 };

      const result = applyOptimisticLock(entity, 2);

      expect(result.success).toBe(false);
      expect(result.error?.status).toBe(409);
      expect(entity.version).toBe(4); // Permanece inalterado
    });
  });

  describe("OptimisticLockError", () => {
    it("deve criar uma instância de erro com código e status 409", () => {
      const error = new OptimisticLockError(5, 3);

      expect(error.status).toBe(409);
      expect(error.code).toBe("conflict_version_mismatch");
      expect(error.currentVersion).toBe(5);
      expect(error.expectedVersion).toBe(3);
      expect(error.message).toContain("atual=5, esperada=3");
    });
  });

  describe("RaceSimulator", () => {
    it("deve simular atrasos arbitrários e registrar requisições em trânsito", async () => {
      raceSimulator.setDelay("test_key", 20);
      expect(raceSimulator.getDelay("test_key")).toBe(20);

      const promise = raceSimulator.delayForRace("test_key");
      expect(raceSimulator.inFlightCount).toBe(1);

      await promise;
      expect(raceSimulator.inFlightCount).toBe(0);
      expect(raceSimulator.getResolutionHistory()).toContain("test_key");
    });

    it("deve simular respostas fora de ordem com uma requisição rápida ultrapassando uma lenta", async () => {
      raceSimulator.scheduleRace({
        slowKey: "req_slow_A",
        slowDelayMs: 60,
        fastKey: "req_fast_B",
        fastDelayMs: 10,
      });

      const start = Date.now();
      const results: string[] = [];

      const promiseSlow = raceSimulator
        .delayForRace("req_slow_A")
        .then(() => results.push("req_slow_A"));

      const promiseFast = raceSimulator
        .delayForRace("req_fast_B")
        .then(() => results.push("req_fast_B"));

      await Promise.all([promiseSlow, promiseFast]);

      // A rápida terminou antes da lenta
      expect(results).toEqual(["req_fast_B", "req_slow_A"]);
      expect(raceSimulator.getResolutionHistory()).toEqual(["req_fast_B", "req_slow_A"]);
      expect(Date.now() - start).toBeGreaterThanOrEqual(50);
    });

    it("deve permitir retenção determinística e liberação manual via hold e release", async () => {
      raceSimulator.hold("gated_request");

      let resolved = false;
      const promise = raceSimulator.delayForRace("gated_request").then(() => {
        resolved = true;
      });

      expect(raceSimulator.inFlightCount).toBe(1);
      expect(resolved).toBe(false);

      // Aguarda um pequeno intervalo para garantir que a Promise continua suspensa
      await new Promise((r) => setTimeout(r, 20));
      expect(resolved).toBe(false);

      // Libera a chave retida
      raceSimulator.release("gated_request");
      await promise;

      expect(resolved).toBe(true);
      expect(raceSimulator.inFlightCount).toBe(0);
    });

    it("deve reproduzir um cenário real de corrida concorrente com detecção de conflito OCC", async () => {
      // Estado compartilhado em memória
      const sharedResource = {
        id: "nft_concurrency_demo",
        price: "1.00",
        version: 1,
      };

      // Dois clientes leem o recurso na versão 1
      const client1ExpectedVersion = sharedResource.version; // 1
      const client2ExpectedVersion = sharedResource.version; // 1

      // O Cliente 1 tem conexão lenta (demora 50ms)
      // O Cliente 2 tem conexão rápida (demora 10ms)
      raceSimulator.scheduleRace({
        slowKey: "client_1_slow",
        slowDelayMs: 50,
        fastKey: "client_2_fast",
        fastDelayMs: 10,
      });

      // Executa as duas tentativas de mutação de forma concorrente
      const task1 = (async () => {
        await raceSimulator.delayForRace("client_1_slow");
        return applyOptimisticLock(sharedResource, client1ExpectedVersion);
      })();

      const task2 = (async () => {
        await raceSimulator.delayForRace("client_2_fast");
        return applyOptimisticLock(sharedResource, client2ExpectedVersion);
      })();

      const [client1Result, client2Result] = await Promise.all([task1, task2]);

      // Cliente 2 chegou primeiro: deve ter obtido sucesso e atualizado a versão para 2
      expect(client2Result?.success).toBe(true);
      expect(client2Result?.nextVersion).toBe(2);

      // Cliente 1 chegou depois trazendo a versão defasada 1: deve receber 409
      expect(client1Result?.success).toBe(false);
      expect(client1Result?.error?.status).toBe(409);
      expect(client1Result?.error?.body.code).toBe("conflict_version_mismatch");
      expect(client1Result?.error?.body.currentVersion).toBe(2);
      expect(client1Result?.error?.body.expectedVersion).toBe(1);

      // A versão final do recurso preserva a atomicidade
      expect(sharedResource.version).toBe(2);
    });
  });
});
