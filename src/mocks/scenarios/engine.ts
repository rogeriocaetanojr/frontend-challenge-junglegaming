/**
 * Motor singleton de cenários e injeção de falhas para o Mock Service Worker (MSW).
 *
 * Permite alternar dinamicamente entre perfis de rede (latência, taxas de perda
 * probabilística e respostas de erro forçadas) com persistência em sessionStorage.
 */
import { delay, HttpResponse } from "msw";

import type { ApiErrorBody, ApiErrorCode } from "@/contracts/common";
import { SCENARIO_REGISTRY } from "./registry";
import type {
  ForcedErrorDefinition,
  ScenarioConfig,
  ScenarioFaultResult,
  ScenarioName,
} from "./types";

const STORAGE_KEY = "jungle:mock:scenario";

interface PersistedState {
  name: ScenarioName;
  latencyMs: number;
  faultRate: number;
}

function generateRequestId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `req_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

function extractPathname(target?: string): string {
  if (!target) return "";
  try {
    if (target.startsWith("http://") || target.startsWith("https://")) {
      return new URL(target).pathname;
    }
  } catch {
    // Se não puder ser parseado como URL completa, segue normalização de caminho
  }
  return target.split("?")[0]?.split("#")[0] ?? "";
}

function findForcedError(
  forcedErrors: Record<string, ForcedErrorDefinition> | undefined,
  targetPathname: string,
): ForcedErrorDefinition | undefined {
  if (!forcedErrors || !targetPathname) return undefined;

  // 1. Busca exata
  if (forcedErrors[targetPathname]) {
    return forcedErrors[targetPathname];
  }

  // 2. Busca por sufixo ou correspondência de prefixo de endpoint
  for (const [routePattern, errorDef] of Object.entries(forcedErrors)) {
    if (
      targetPathname === routePattern ||
      targetPathname.startsWith(`${routePattern}/`) ||
      targetPathname.endsWith(routePattern)
    ) {
      return errorDef;
    }
  }

  return undefined;
}

export class ScenarioEngine {
  private currentConfig: ScenarioConfig;

  constructor() {
    this.currentConfig = this.loadFromStorage();
  }

  /** Carrega as configurações previamente salvas em sessionStorage com fallback seguro. */
  private loadFromStorage(): ScenarioConfig {
    try {
      if (typeof window !== "undefined" && window.sessionStorage) {
        const stored = window.sessionStorage.getItem(STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored) as Partial<PersistedState>;
          if (parsed.name && SCENARIO_REGISTRY[parsed.name]) {
            const base = structuredClone(SCENARIO_REGISTRY[parsed.name]);
            if (typeof parsed.latencyMs === "number" && parsed.latencyMs >= 0) {
              base.latencyMs = parsed.latencyMs;
            }
            if (
              typeof parsed.faultRate === "number" &&
              parsed.faultRate >= 0 &&
              parsed.faultRate <= 1
            ) {
              base.faultRate = parsed.faultRate;
            }
            return base;
          }
        }
      }
    } catch {
      // Ignora indisponibilidade de storage (SSR, sandbox ou bloqueio de cookies)
    }

    return structuredClone(SCENARIO_REGISTRY.default);
  }

  /** Salva as preferências atuais no sessionStorage. */
  private saveToStorage(): void {
    try {
      if (typeof window !== "undefined" && window.sessionStorage) {
        const payload: PersistedState = {
          name: this.currentConfig.name,
          latencyMs: this.currentConfig.latencyMs,
          faultRate: this.currentConfig.faultRate,
        };
        window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
      }
    } catch {
      // Falha silenciosa em ambientes sem suporte a storage
    }
  }

  /** Retorna uma cópia da configuração ativa do cenário. */
  public getScenario(): ScenarioConfig {
    return structuredClone(this.currentConfig);
  }

  /** Altera o cenário ativo para um dos cenários predefinidos do registro. */
  public setScenario(name: ScenarioName): ScenarioConfig {
    const template = SCENARIO_REGISTRY[name] ?? SCENARIO_REGISTRY.default;
    this.currentConfig = structuredClone(template);
    this.saveToStorage();
    return this.getScenario();
  }

  /** Ajusta a latência artificial simulada em milissegundos. */
  public setLatency(ms: number): void {
    this.currentConfig.latencyMs = Math.max(0, Math.floor(ms));
    this.saveToStorage();
  }

  /** Ajusta a taxa de falha probabilística (entre 0 e 1). */
  public setFaultRate(rate: number): void {
    this.currentConfig.faultRate = Math.min(1, Math.max(0, rate));
    this.saveToStorage();
  }

  /** Restaura o cenário para o padrão 'default' e limpa o storage. */
  public reset(): void {
    this.currentConfig = structuredClone(SCENARIO_REGISTRY.default);
    try {
      if (typeof window !== "undefined" && window.sessionStorage) {
        window.sessionStorage.removeItem(STORAGE_KEY);
      }
    } catch {
      // Ignora falha de limpeza
    }
  }

  /**
   * Avalia síncronamente se uma rota sofre erro forçado ou taxa de falha probabilística,
   * sem aplicar latência nem instanciar HttpResponse.
   */
  public evaluateFault(pathnameOrUrl?: string): ScenarioFaultResult | null {
    const pathname = extractPathname(pathnameOrUrl);

    // 1. Erro forçado por rota
    const forced = findForcedError(this.currentConfig.forcedErrors, pathname);
    if (forced) {
      return {
        status: forced.status,
        code: forced.code,
        message: forced.message,
        reason: "forced_error",
      };
    }

    // 2. Falha de conexão transitória aleatória (flaky network)
    if (
      this.currentConfig.faultRate > 0 &&
      Math.random() < this.currentConfig.faultRate
    ) {
      return {
        status: 503,
        code: "transient_failure",
        message: "Falha de conexão transitória simulada pelo motor de cenários.",
        reason: "flaky_rate",
      };
    }

    return null;
  }

  /**
   * Middleware assíncrono executado antes de processar um handler do MSW:
   * 1. Aplica o atraso artificial configurado (`latencyMs`).
   * 2. Verifica se a rota possui erro forçado.
   * 3. Aplica injeção de falha probabilística (`faultRate`).
   *
   * @returns `HttpResponse` de erro se uma falha for disparada, ou `null` para prosseguir normalmente.
   */
  public async executeMiddleware(
    pathnameOrUrl?: string,
    options?: { skipDelay?: boolean },
  ): Promise<Response | null> {
    // 1. Simulação de atraso de rede
    if (!options?.skipDelay && this.currentConfig.latencyMs > 0) {
      await delay(this.currentConfig.latencyMs);
    }

    // 2. Avaliação de falha
    const fault = this.evaluateFault(pathnameOrUrl);
    if (!fault) {
      return null;
    }

    const errorBody: ApiErrorBody = {
      code: fault.code as ApiErrorCode,
      message: fault.message,
      requestId: generateRequestId(),
    };

    return HttpResponse.json(errorBody, {
      status: fault.status,
      headers: {
        "x-mock-scenario": this.currentConfig.name,
        "x-mock-fault-reason": fault.reason,
      },
    });
  }
}

/** Instância singleton do motor de cenários. */
export const scenarioEngine = new ScenarioEngine();
