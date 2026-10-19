/**
 * Testes unitários do motor de cenários e injeção de falhas (src/mocks/scenarios).
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ScenarioEngine, scenarioEngine } from "@/mocks/scenarios";

describe("ScenarioEngine (src/mocks/scenarios)", () => {
  beforeEach(() => {
    sessionStorage.clear();
    scenarioEngine.reset();
  });

  afterEach(() => {
    sessionStorage.clear();
    scenarioEngine.reset();
    vi.restoreAllMocks();
  });

  it("deve inicializar com o cenário 'default' e configurações corretas", () => {
    const current = scenarioEngine.getScenario();
    expect(current.name).toBe("default");
    expect(current.latencyMs).toBe(100);
    expect(current.faultRate).toBe(0);
    expect(current.forcedErrors).toBeUndefined();
  });

  it("deve alternar para cenários pré-configurados corretamente", () => {
    scenarioEngine.setScenario("slow_network");
    expect(scenarioEngine.getScenario().latencyMs).toBe(2000);
    expect(scenarioEngine.getScenario().faultRate).toBe(0);

    scenarioEngine.setScenario("flaky_connection");
    expect(scenarioEngine.getScenario().latencyMs).toBe(250);
    expect(scenarioEngine.getScenario().faultRate).toBe(0.35);

    scenarioEngine.setScenario("auth_expired");
    expect(scenarioEngine.getScenario().forcedErrors).toBeDefined();
    expect(scenarioEngine.getScenario().forcedErrors?.["/api/auth/me"]?.status).toBe(401);
  });

  it("deve permitir sobrescrever latência e taxa de falha com valores protegidos", () => {
    scenarioEngine.setLatency(750);
    expect(scenarioEngine.getScenario().latencyMs).toBe(750);

    scenarioEngine.setLatency(-50);
    expect(scenarioEngine.getScenario().latencyMs).toBe(0);

    scenarioEngine.setFaultRate(0.5);
    expect(scenarioEngine.getScenario().faultRate).toBe(0.5);

    scenarioEngine.setFaultRate(1.5);
    expect(scenarioEngine.getScenario().faultRate).toBe(1);

    scenarioEngine.setFaultRate(-0.2);
    expect(scenarioEngine.getScenario().faultRate).toBe(0);
  });

  it("deve persistir e restaurar o estado no sessionStorage", () => {
    scenarioEngine.setScenario("flaky_connection");
    scenarioEngine.setLatency(999);

    // Nova instância deve ler do sessionStorage preenchido
    const secondEngine = new ScenarioEngine();
    const config = secondEngine.getScenario();

    expect(config.name).toBe("flaky_connection");
    expect(config.latencyMs).toBe(999);
    expect(config.faultRate).toBe(0.35);
  });

  it("deve lidar graciosamente com sessionStorage corrompido", () => {
    sessionStorage.setItem("jungle:mock:scenario", "invalid-json{{");
    const safeEngine = new ScenarioEngine();
    expect(safeEngine.getScenario().name).toBe("default");
  });

  it("deve retornar null em rotas limpas no cenário default", async () => {
    const response = await scenarioEngine.executeMiddleware("/api/nfts", {
      skipDelay: true,
    });
    expect(response).toBeNull();
  });

  it("deve disparar erros forçados correspondentes em rotas configuradas", async () => {
    // 1. Cenário auth_expired
    scenarioEngine.setScenario("auth_expired");
    const authRes = await scenarioEngine.executeMiddleware("/api/auth/me", {
      skipDelay: true,
    });
    expect(authRes).not.toBeNull();
    expect(authRes?.status).toBe(401);

    const authBody = (await authRes?.json()) as { code: string; message: string };
    expect(authBody.code).toBe("session_expired");

    // 2. Cenário out_of_stock com query params e URL completa
    scenarioEngine.setScenario("out_of_stock");
    const stockRes = await scenarioEngine.executeMiddleware(
      "https://jungle.market/api/quotes?category=art",
      { skipDelay: true },
    );
    expect(stockRes).not.toBeNull();
    expect(stockRes?.status).toBe(409);

    const stockBody = (await stockRes?.json()) as { code: string; message: string };
    expect(stockBody.code).toBe("conflict_availability");

    // 3. Cenário checkout_conflict
    scenarioEngine.setScenario("checkout_conflict");
    const conflictRes = await scenarioEngine.executeMiddleware("/api/orders", {
      skipDelay: true,
    });
    expect(conflictRes).not.toBeNull();
    expect(conflictRes?.status).toBe(409);

    const conflictBody = (await conflictRes?.json()) as { code: string; message: string };
    expect(conflictBody.code).toBe("conflict_price_changed");
  });

  it("deve simular falhas transitórias probabilísticas quando faultRate é atingido", async () => {
    scenarioEngine.setFaultRate(1); // 100% de taxa de falha

    const res = await scenarioEngine.executeMiddleware("/api/nfts", {
      skipDelay: true,
    });
    expect(res).not.toBeNull();
    expect(res?.status).toBe(503);

    const body = (await res?.json()) as { code: string; message: string };
    expect(body.code).toBe("transient_failure");
    expect(res?.headers.get("x-mock-fault-reason")).toBe("flaky_rate");
  });

  it("deve resetar o cenário e limpar o storage", () => {
    scenarioEngine.setScenario("slow_network");
    expect(sessionStorage.getItem("jungle:mock:scenario")).not.toBeNull();

    scenarioEngine.reset();
    expect(scenarioEngine.getScenario().name).toBe("default");
    expect(sessionStorage.getItem("jungle:mock:scenario")).toBeNull();
  });
});
