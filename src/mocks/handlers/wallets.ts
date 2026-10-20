/**
 * Handlers REST do MSW para gerenciamento de carteiras Web3 mockadas.
 *
 * Implementa listagem isolada por usuário, validação estrita de endereços 0x (422),
 * controle de unicidade de papéis (no máximo 1 primary e 1 secondary) e simulação
 * de cenários de conexão e desconexão de carteira integrada ao scenarioEngine.
 */
import { http, HttpResponse } from "msw";

import type { Network } from "@/contracts/catalog";
import { asId, type ApiErrorBody, type IsoDate } from "@/contracts/common";
import type {
  Session,
  Wallet,
  WalletConnectionResult,
  WalletRole,
} from "@/contracts/identity";
import { db } from "@/mocks/db";
import { usersRepository } from "@/mocks/db/repositories/users";
import { walletsRepository } from "@/mocks/db/repositories/wallets";
import { scenarioEngine } from "@/mocks/scenarios";

/** Extrai a sessão ativa associada ao token Bearer da requisição. */
function getActiveSession(request: Request): Session | null {
  const authHeader = request.headers.get("Authorization");
  if (!authHeader) {
    return null;
  }

  const token = authHeader.startsWith("Bearer ")
    ? authHeader.slice(7).trim()
    : authHeader.trim();

  if (!token) {
    return null;
  }

  // 1. Busca na base de sessões ativas
  const session = usersRepository.findSessionByToken(token);
  if (session) {
    return session;
  }

  // 2. Fallback determinístico para tokens de teste padronizados (ex.: mock-token-user_demo)
  if (token === "mock-token-user_demo" || token.includes("user_demo")) {
    const demoUser = usersRepository.findById("user_demo");
    if (demoUser) {
      return {
        token,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() as IsoDate,
        user: usersRepository.sanitize(demoUser),
      };
    }
  }

  return null;
}

/** Resposta padrão para acessos não autenticados ou com sessão inválida/expirada. */
function unauthorizedResponse(): HttpResponse<ApiErrorBody> {
  return HttpResponse.json<ApiErrorBody>(
    {
      code: "unauthorized",
      message:
        "Autenticação obrigatória para acessar ou gerenciar as carteiras vinculadas.",
    },
    { status: 401 },
  );
}

export const walletsHandlers = [
  // 1. Listagem de carteiras pertencentes exclusivamente ao usuário autenticado
  http.get("*/api/wallets", async ({ request }) => {
    const fault = await scenarioEngine.executeMiddleware(request.url);
    if (fault) {
      return fault;
    }

    const session = getActiveSession(request);
    if (!session) {
      return unauthorizedResponse();
    }

    const wallets = walletsRepository.findByUserId(session.user.id);
    return HttpResponse.json<Wallet[]>(wallets, { status: 200 });
  }),

  // 2. Conexão direta de nova carteira (compatibilidade com fluxos gerais e legados)
  http.post("*/api/wallets/connect", async ({ request }) => {
    const fault = await scenarioEngine.executeMiddleware(request.url);
    if (fault) {
      return fault;
    }

    const session = getActiveSession(request);
    if (!session) {
      return unauthorizedResponse();
    }

    // Avalia se o cenário ativo está forçado para recusa
    const scenario = scenarioEngine.getScenario();
    if (scenario.name === "wallet_rejected" || scenario.name === "wallet-rejected") {
      return HttpResponse.json(
        {
          connected: false,
          result: "refused",
          reason:
            "A conexão com a carteira Web3 foi recusada pelo provedor ou pelo usuário.",
        },
        { status: 400 },
      );
    }

    interface ConnectBody {
      network?: Network;
      address?: string;
      label?: string;
      role?: WalletRole;
    }

    let body: ConnectBody = {};
    try {
      body = (await request.json()) as ConnectBody;
    } catch {
      // Aceita body vazio gerando carteira padrão
    }

    const address =
      body.address ??
      `0x${Array.from({ length: 40 }, () => Math.floor(Math.random() * 16).toString(16)).join("")}`;

    if (!walletsRepository.isValidAddress(address)) {
      return HttpResponse.json<ApiErrorBody>(
        {
          code: "validation_error",
          message: "Endereço da carteira inválido.",
          fieldErrors: {
            address: [
              "Endereço de carteira inválido. Deve começar com 0x seguido de 40 dígitos hexadecimais.",
            ],
          },
        },
        { status: 422 },
      );
    }

    const existingWallets = walletsRepository.findByUserId(session.user.id);
    const id = asId<"wallet">(`wallet_${Date.now()}`);
    const wallet: Wallet = {
      id,
      userId: session.user.id,
      role: body.role ?? (existingWallets.length === 0 ? "primary" : "secondary"),
      network: body.network ?? "ethereum",
      address,
      label: body.label ?? `Carteira ${body.network ?? "Ethereum"}`,
      connected: true,
      connectedAt: new Date().toISOString() as IsoDate,
    };

    db.wallets.set(wallet.id, wallet);

    const result: WalletConnectionResult = {
      connected: true,
      wallet,
    };

    return HttpResponse.json<WalletConnectionResult>(result, { status: 201 });
  }),

  // 3. Cadastro de nova carteira para o usuário autenticado
  http.post("*/api/wallets", async ({ request }) => {
    const fault = await scenarioEngine.executeMiddleware(request.url);
    if (fault) {
      return fault;
    }

    const session = getActiveSession(request);
    if (!session) {
      return unauthorizedResponse();
    }

    interface CreateBody {
      address?: string;
      network?: Network;
      role?: WalletRole;
      label?: string;
    }

    let body: CreateBody;
    try {
      body = (await request.json()) as CreateBody;
    } catch {
      return HttpResponse.json<ApiErrorBody>(
        { code: "validation_error", message: "Corpo JSON inválido." },
        { status: 400 },
      );
    }

    if (!body.address || !walletsRepository.isValidAddress(body.address)) {
      return HttpResponse.json<ApiErrorBody>(
        {
          code: "validation_error",
          message:
            "Endereço da carteira inválido. Deve seguir o formato hexadecimal Ethereum (0x seguido de 40 dígitos hexadecimais).",
          fieldErrors: {
            address: [
              "Endereço de carteira inválido. Deve começar com 0x seguido de 40 dígitos hexadecimais.",
            ],
          },
        },
        { status: 422 },
      );
    }

    const wallet = walletsRepository.create({
      userId: session.user.id,
      address: body.address,
      network: body.network ?? "ethereum",
      role: body.role,
      label: body.label,
    });

    return HttpResponse.json<Wallet>(wallet, { status: 201 });
  }),

  // 4. Atualização de carteira existente (endereço, rede, papel ou rótulo)
  http.put("*/api/wallets/:id", async ({ request, params }) => {
    const fault = await scenarioEngine.executeMiddleware(request.url);
    if (fault) {
      return fault;
    }

    const session = getActiveSession(request);
    if (!session) {
      return unauthorizedResponse();
    }

    const id = params.id as string;
    const existing = walletsRepository.findById(id);

    if (!existing || existing.userId !== session.user.id) {
      return HttpResponse.json<ApiErrorBody>(
        {
          code: "not_found",
          message: "Carteira não encontrada para este usuário.",
        },
        { status: 404 },
      );
    }

    interface UpdateBody {
      address?: string;
      network?: Network;
      role?: WalletRole;
      label?: string;
    }

    let body: UpdateBody;
    try {
      body = (await request.json()) as UpdateBody;
    } catch {
      return HttpResponse.json<ApiErrorBody>(
        { code: "validation_error", message: "Corpo JSON inválido." },
        { status: 400 },
      );
    }

    if (body.address !== undefined && !walletsRepository.isValidAddress(body.address)) {
      return HttpResponse.json<ApiErrorBody>(
        {
          code: "validation_error",
          message:
            "Endereço da carteira inválido. Deve seguir o formato hexadecimal Ethereum (0x seguido de 40 dígitos hexadecimais).",
          fieldErrors: {
            address: [
              "Endereço de carteira inválido. Deve começar com 0x seguido de 40 dígitos hexadecimais.",
            ],
          },
        },
        { status: 422 },
      );
    }

    const updated = walletsRepository.update(id, {
      address: body.address,
      network: body.network,
      role: body.role,
      label: body.label,
    });

    return HttpResponse.json<Wallet>(updated!, { status: 200 });
  }),

  // 5. Simulação de conexão de carteira por ID
  http.post("*/api/wallets/:id/connect", async ({ request, params }) => {
    const fault = await scenarioEngine.executeMiddleware(request.url);
    const scenario = scenarioEngine.getScenario();
    if (
      fault ||
      scenario.name === "wallet_rejected" ||
      scenario.name === "wallet-rejected"
    ) {
      return HttpResponse.json(
        {
          connected: false,
          result: "refused",
          reason:
            "A conexão com a carteira Web3 foi recusada pelo provedor ou pelo usuário.",
        },
        { status: 400 },
      );
    }

    const session = getActiveSession(request);
    if (!session) {
      return unauthorizedResponse();
    }

    const id = params.id as string;
    const wallet = walletsRepository.findById(id);

    if (!wallet || wallet.userId !== session.user.id) {
      return HttpResponse.json<ApiErrorBody>(
        {
          code: "not_found",
          message: "Carteira não encontrada para este usuário.",
        },
        { status: 404 },
      );
    }

    const connectedWallet = walletsRepository.connect(id)!;

    return HttpResponse.json(
      {
        connected: true,
        result: "connected",
        wallet: connectedWallet,
        connectedAt: connectedWallet.connectedAt,
      },
      { status: 200 },
    );
  }),

  // 6. Simulação de desconexão de carteira por ID
  http.post("*/api/wallets/:id/disconnect", async ({ request, params }) => {
    const fault = await scenarioEngine.executeMiddleware(request.url);
    if (fault) {
      return fault;
    }

    const session = getActiveSession(request);
    if (!session) {
      return unauthorizedResponse();
    }

    const id = params.id as string;
    const wallet = walletsRepository.findById(id);

    if (!wallet || wallet.userId !== session.user.id) {
      return HttpResponse.json<ApiErrorBody>(
        {
          code: "not_found",
          message: "Carteira não encontrada para este usuário.",
        },
        { status: 404 },
      );
    }

    const disconnectedWallet = walletsRepository.disconnect(id)!;

    return HttpResponse.json(
      {
        connected: false,
        result: "disconnected",
        wallet: disconnectedWallet,
      },
      { status: 200 },
    );
  }),
];
