/**
 * Testes unitários do componente visual ScenarioSwitcher (src/mocks/ui).
 */
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import * as dbModule from "@/mocks/db";
import { scenarioEngine } from "@/mocks/scenarios";
import { ScenarioSwitcher } from "@/mocks/ui";

// Configura o ambiente de act do React 19 para testes com jsdom
// @ts-expect-error IS_REACT_ACT_ENVIRONMENT flag
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

/**
 * Dispara eventos de alteração de valor simulando a interação do usuário
 * com inputs controlados pelo React.
 */
function changeInputValue(input: HTMLInputElement | HTMLSelectElement, value: string) {
  const descriptor = Object.getOwnPropertyDescriptor(
    Object.getPrototypeOf(input),
    "value",
  );
  descriptor?.set?.call(input, value);
  input.dispatchEvent(new Event("input", { bubbles: true }));
  input.dispatchEvent(new Event("change", { bubbles: true }));
}

describe("ScenarioSwitcher (src/mocks/ui/scenario-switcher.tsx)", () => {
  let container: HTMLDivElement | null = null;
  let root: ReturnType<typeof createRoot> | null = null;

  beforeEach(() => {
    scenarioEngine.reset();
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => {
      root?.unmount();
    });
    container?.remove();
    container = null;
    root = null;
    scenarioEngine.reset();
    vi.restoreAllMocks();
  });

  it("deve renderizar inicialmente fechado e abrir ao clicar no botão disparador", async () => {
    await act(async () => {
      root!.render(<ScenarioSwitcher />);
    });

    // Painel está fechado inicialmente
    expect(
      container!.querySelector('[data-testid="scenario-switcher-drawer"]'),
    ).toBeNull();

    // Botão disparador está visível com badge do cenário default
    const toggleBtn = container!.querySelector(
      '[data-testid="scenario-switcher-toggle"]',
    ) as HTMLButtonElement;
    expect(toggleBtn).not.toBeNull();
    expect(toggleBtn.textContent).toContain("default");

    // Clica para abrir o painel
    await act(async () => {
      toggleBtn.click();
    });

    // Painel agora está visível
    const drawer = container!.querySelector('[data-testid="scenario-switcher-drawer"]');
    expect(drawer).not.toBeNull();

    // Clica no botão de fechar
    const closeBtn = container!.querySelector(
      '[data-testid="scenario-switcher-close"]',
    ) as HTMLButtonElement;
    expect(closeBtn).not.toBeNull();

    await act(async () => {
      closeBtn.click();
    });

    // Painel fechou novamente
    expect(
      container!.querySelector('[data-testid="scenario-switcher-drawer"]'),
    ).toBeNull();
  });

  it("deve alterar o cenário ativo e refletir no scenarioEngine", async () => {
    const setScenarioSpy = vi.spyOn(scenarioEngine, "setScenario");

    await act(async () => {
      root!.render(<ScenarioSwitcher />);
    });

    // Abre o drawer
    const toggleBtn = container!.querySelector(
      '[data-testid="scenario-switcher-toggle"]',
    ) as HTMLButtonElement;
    await act(async () => {
      toggleBtn.click();
    });

    const select = container!.querySelector(
      '[data-testid="scenario-select"]',
    ) as HTMLSelectElement;
    expect(select).not.toBeNull();
    expect(select.value).toBe("default");

    // Altera para 'slow_network'
    await act(async () => {
      changeInputValue(select, "slow_network");
    });

    expect(setScenarioSpy).toHaveBeenCalledWith("slow_network");
    expect(scenarioEngine.getScenario().name).toBe("slow_network");
    expect(scenarioEngine.getScenario().latencyMs).toBe(2000);

    // Altera para 'checkout_conflict'
    await act(async () => {
      changeInputValue(select, "checkout_conflict");
    });

    expect(setScenarioSpy).toHaveBeenCalledWith("checkout_conflict");
    expect(scenarioEngine.getScenario().name).toBe("checkout_conflict");
  });

  it("deve permitir alterar latência e taxa de falhas nos sliders", async () => {
    const setLatencySpy = vi.spyOn(scenarioEngine, "setLatency");
    const setFaultRateSpy = vi.spyOn(scenarioEngine, "setFaultRate");

    await act(async () => {
      root!.render(<ScenarioSwitcher />);
    });

    const toggleBtn = container!.querySelector(
      '[data-testid="scenario-switcher-toggle"]',
    ) as HTMLButtonElement;
    await act(async () => {
      toggleBtn.click();
    });

    const latencySlider = container!.querySelector(
      '[data-testid="latency-slider"]',
    ) as HTMLInputElement;
    expect(latencySlider).not.toBeNull();

    await act(async () => {
      changeInputValue(latencySlider, "750");
    });

    expect(setLatencySpy).toHaveBeenCalledWith(750);
    expect(scenarioEngine.getScenario().latencyMs).toBe(750);

    const faultSlider = container!.querySelector(
      '[data-testid="fault-rate-slider"]',
    ) as HTMLInputElement;
    expect(faultSlider).not.toBeNull();

    await act(async () => {
      changeInputValue(faultSlider, "0.45");
    });

    expect(setFaultRateSpy).toHaveBeenCalledWith(0.45);
    expect(scenarioEngine.getScenario().faultRate).toBe(0.45);
  });

  it("deve acionar resetDb e resetar o scenarioEngine ao clicar no botão de reset", async () => {
    const resetDbSpy = vi.spyOn(dbModule, "resetDb");
    const resetEngineSpy = vi.spyOn(scenarioEngine, "reset");

    // Configura um cenário não-padrão antes
    scenarioEngine.setScenario("checkout_conflict");

    await act(async () => {
      root!.render(<ScenarioSwitcher />);
    });

    const toggleBtn = container!.querySelector(
      '[data-testid="scenario-switcher-toggle"]',
    ) as HTMLButtonElement;
    await act(async () => {
      toggleBtn.click();
    });

    const resetBtn = container!.querySelector(
      '[data-testid="reset-db-button"]',
    ) as HTMLButtonElement;
    expect(resetBtn).not.toBeNull();

    await act(async () => {
      resetBtn.click();
    });

    expect(resetDbSpy).toHaveBeenCalledTimes(1);
    expect(resetEngineSpy).toHaveBeenCalledTimes(1);
    expect(scenarioEngine.getScenario().name).toBe("default");

    const statusMsg = container!.querySelector('[data-testid="status-message"]');
    expect(statusMsg?.textContent).toContain("sucesso");
  });
});
