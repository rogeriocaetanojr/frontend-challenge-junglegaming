/**
 * Tipos e interfaces para o motor de cenários e injeção de falhas do MSW.
 */
import type { ApiErrorCode } from "@/contracts/common";

/** Nomes de cenários predefinidos suportados pelo marketplace. */
export type ScenarioName =
  | "default"
  | "slow_network"
  | "flaky_connection"
  | "price_surge"
  | "out_of_stock"
  | "auth_expired"
  | "checkout_conflict"
  | "order_timeout"
  | "order-timeout"
  | "wallet_rejected"
  | "wallet-rejected";

/** Definição de erro HTTP forçado para rotas específicas. */
export interface ForcedErrorDefinition {
  status: number;
  code: ApiErrorCode | string;
  message: string;
}

/** Configuração ativa de um cenário de simulação de rede e resiliência. */
export interface ScenarioConfig {
  name: ScenarioName;
  description: string;
  /** Latência artificial simulada em milissegundos antes de cada resposta. */
  latencyMs: number;
  /** Taxa de falha probabilística entre 0 (0%) e 1 (100%). */
  faultRate: number;
  /**
   * Mapeamento de rota (ou fragmento de rota) para erro forçado imediato.
   * Exemplo: `{ "/api/auth/me": { status: 401, code: "session_expired", message: "..." } }`
   */
  forcedErrors?: Record<string, ForcedErrorDefinition>;
}

/** Representação desestruturada de uma falha detectada pelo middleware. */
export interface ScenarioFaultResult {
  status: number;
  code: ApiErrorCode | string;
  message: string;
  reason: "forced_error" | "flaky_rate";
}
