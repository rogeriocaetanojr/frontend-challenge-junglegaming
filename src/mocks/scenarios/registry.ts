/**
 * Registro de cenários pré-configurados para testes de resiliência e simulação de rede.
 */
import type { ScenarioConfig, ScenarioName } from "./types";

export const SCENARIO_REGISTRY: Record<ScenarioName, ScenarioConfig> = {
  default: {
    name: "default",
    description: "Comportamento nominal do marketplace com latência normal de rede.",
    latencyMs: 100,
    faultRate: 0,
  },
  slow_network: {
    name: "slow_network",
    description:
      "Conexão de banda estreita ou 3G lento para testar skeletons e estados de loading.",
    latencyMs: 2000,
    faultRate: 0,
  },
  flaky_connection: {
    name: "flaky_connection",
    description:
      "Conexão instável simulando 35% de falhas 503 transitórias para validar retentativas e mensagens de erro.",
    latencyMs: 250,
    faultRate: 0.35,
  },
  price_surge: {
    name: "price_surge",
    description:
      "Oscilações dinâmicas de preço simulando revalidação de carrinho e avisos ao usuário.",
    latencyMs: 150,
    faultRate: 0,
  },
  out_of_stock: {
    name: "out_of_stock",
    description:
      "Força indisponibilidade de estoque nas cotações e tentativas de compra.",
    latencyMs: 100,
    faultRate: 0,
    forcedErrors: {
      "/api/quotes": {
        status: 409,
        code: "conflict_availability",
        message: "Um ou mais itens solicitados estão temporariamente fora de estoque.",
      },
      "/api/commerce/quote": {
        status: 409,
        code: "conflict_availability",
        message: "Um ou mais itens solicitados estão temporariamente fora de estoque.",
      },
    },
  },
  auth_expired: {
    name: "auth_expired",
    description:
      "Sessão expirada forçando erro 401 session_expired em endpoints autenticados.",
    latencyMs: 100,
    faultRate: 0,
    forcedErrors: {
      "/api/auth/me": {
        status: 401,
        code: "session_expired",
        message: "Sua sessão expirou. Por favor, autentique-se novamente.",
      },
      "/api/wallets": {
        status: 401,
        code: "session_expired",
        message: "Sua sessão expirou. Por favor, autentique-se novamente.",
      },
      "/api/orders": {
        status: 401,
        code: "session_expired",
        message: "Sua sessão expirou. Por favor, autentique-se novamente.",
      },
    },
  },
  checkout_conflict: {
    name: "checkout_conflict",
    description:
      "Conflito de concorrência com alteração de preço (409 conflict_price_changed) na finalização.",
    latencyMs: 200,
    faultRate: 0,
    forcedErrors: {
      "/api/orders": {
        status: 409,
        code: "conflict_price_changed",
        message: "O preço de um dos itens foi alterado no momento da confirmação.",
      },
      "/api/checkout": {
        status: 409,
        code: "conflict_price_changed",
        message: "O preço de um dos itens foi alterado no momento da confirmação.",
      },
    },
  },
  order_timeout: {
    name: "order_timeout",
    description:
      "Simula criação de pedido com atraso de rede excessivo para validação de timeout no cliente.",
    latencyMs: 1500,
    faultRate: 0,
  },
  "order-timeout": {
    name: "order-timeout",
    description:
      "Simula criação de pedido com atraso de rede excessivo para validação de timeout no cliente.",
    latencyMs: 1500,
    faultRate: 0,
  },
  wallet_rejected: {
    name: "wallet_rejected",
    description:
      "Simula recusa do usuário ou provedor Web3 na tentativa de conexão da carteira.",
    latencyMs: 150,
    faultRate: 0,
    forcedErrors: {
      "/api/wallets": {
        status: 400,
        code: "wallet_connection_refused",
        message: "A conexão com a carteira Web3 foi recusada pelo usuário ou provedor.",
      },
    },
  },
  "wallet-rejected": {
    name: "wallet-rejected",
    description:
      "Simula recusa do usuário ou provedor Web3 na tentativa de conexão da carteira.",
    latencyMs: 150,
    faultRate: 0,
    forcedErrors: {
      "/api/wallets": {
        status: 400,
        code: "wallet_connection_refused",
        message: "A conexão com a carteira Web3 foi recusada pelo usuário ou provedor.",
      },
    },
  },
};
