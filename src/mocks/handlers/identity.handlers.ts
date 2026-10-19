/**
 * Handlers REST do MSW para identidade, autenticação e carteiras Web3.
 *
 * Implementa fluxos determinísticos de login, cadastro com conflito de email (409),
 * verificação de sessão (/api/auth/me), logout e gerenciamento de carteiras.
 */
import { http, HttpResponse } from "msw";

import type { Network } from "@/contracts/catalog";
import { type ApiErrorBody, asId, type IsoDate } from "@/contracts/common";
import type {
  Credentials,
  RegisterInput,
  Session,
  User,
  Wallet,
  WalletConnectionResult,
} from "@/contracts/identity";
import { db, type DbUser, dbHelpers } from "@/mocks/db";
import { scenarioEngine } from "@/mocks/scenarios";

/** Extrai e valida o usuário associado ao token do cabeçalho Authorization. */
function extractUserFromHeader(request: Request): DbUser | null {
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

  // 1. Extração por token padronizado: mock-token-{userId}-{timestamp}
  if (token.startsWith("mock-token-")) {
    const remainder = token.slice("mock-token-".length);
    // Identificador pode ser user_demo, user_12345...
    for (const user of db.users.values()) {
      if (remainder.startsWith(user.id)) {
        return user;
      }
    }
  }

  // 2. Busca direta por ID ou correspondência de token demo
  const directUser = dbHelpers.findUserById(token);
  if (directUser) {
    return directUser;
  }

  if (token.toLowerCase().includes("demo")) {
    return dbHelpers.findUserById("user_demo") ?? null;
  }

  return null;
}

function sanitizeUser(dbUser: DbUser): User {
  return {
    id: dbUser.id,
    name: dbUser.name,
    email: dbUser.email,
    avatarUrl: dbUser.avatarUrl,
    createdAt: dbUser.createdAt,
  };
}

function createSession(user: DbUser): Session {
  return {
    token: `mock-token-${user.id}-${Date.now()}`,
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() as IsoDate,
    user: sanitizeUser(user),
  };
}

export const identityHandlers = [
  // 1. Login com credenciais (e-mail e senha)
  http.post("*/api/auth/login", async ({ request }) => {
    const fault = await scenarioEngine.executeMiddleware(request.url);
    if (fault) {
      return fault;
    }

    let body: Partial<Credentials>;
    try {
      body = (await request.json()) as Partial<Credentials>;
    } catch {
      return HttpResponse.json<ApiErrorBody>(
        { code: "validation_error", message: "Corpo da requisição JSON inválido." },
        { status: 400 },
      );
    }

    const email = body.email?.trim().toLowerCase();
    const password = body.password;

    if (!email || !password) {
      return HttpResponse.json<ApiErrorBody>(
        {
          code: "validation_error",
          message: "E-mail e senha são obrigatórios para autenticação.",
        },
        { status: 400 },
      );
    }

    const user = dbHelpers.findUserByEmail(email);
    if (!user || user.passwordHash !== password) {
      return HttpResponse.json<ApiErrorBody>(
        {
          code: "unauthorized",
          message: "Credenciais inválidas. Verifique o e-mail e a senha informados.",
        },
        { status: 401 },
      );
    }

    const session = createSession(user);
    return HttpResponse.json<Session>(session, { status: 200 });
  }),

  // 2. Cadastro de novo usuário
  http.post("*/api/auth/register", async ({ request }) => {
    const fault = await scenarioEngine.executeMiddleware(request.url);
    if (fault) {
      return fault;
    }

    let body: Partial<RegisterInput>;
    try {
      body = (await request.json()) as Partial<RegisterInput>;
    } catch {
      return HttpResponse.json<ApiErrorBody>(
        { code: "validation_error", message: "Corpo da requisição JSON inválido." },
        { status: 400 },
      );
    }

    const name = body.name?.trim();
    const email = body.email?.trim().toLowerCase();
    const password = body.password;

    if (!name || !email || !password) {
      return HttpResponse.json<ApiErrorBody>(
        {
          code: "validation_error",
          message: "Nome, e-mail e senha são obrigatórios para cadastro.",
        },
        { status: 400 },
      );
    }

    // Validação de e-mail duplicado
    if (dbHelpers.findUserByEmail(email)) {
      return HttpResponse.json<ApiErrorBody>(
        {
          code: "email_taken",
          message: "Este endereço de e-mail já está cadastrado no marketplace.",
        },
        { status: 409 },
      );
    }

    const userId = asId<"user">(`user_${Date.now()}`);
    const newUser: DbUser = {
      id: userId,
      name,
      email,
      avatarUrl: "/images/nfts/emerald-ape.png",
      createdAt: new Date().toISOString() as IsoDate,
      passwordHash: password,
    };
    db.users.set(newUser.id, newUser);

    // Criação automática de carteira primária padrão
    const walletId = asId<"wallet">(`wallet_${Date.now()}`);
    const hex = Array.from({ length: 40 }, () =>
      Math.floor(Math.random() * 16).toString(16),
    ).join("");
    const defaultWallet: Wallet = {
      id: walletId,
      userId,
      role: "primary",
      network: "ethereum",
      address: `0x${hex}`,
      label: "Main Ethereum Wallet",
    };
    db.wallets.set(defaultWallet.id, defaultWallet);

    const session = createSession(newUser);
    return HttpResponse.json<Session>(session, { status: 201 });
  }),

  // 3. Obtenção do usuário autenticado atual (/api/auth/me)
  http.get("*/api/auth/me", async ({ request }) => {
    const fault = await scenarioEngine.executeMiddleware(request.url);
    if (fault) {
      return fault;
    }

    const user = extractUserFromHeader(request);
    if (!user) {
      return HttpResponse.json<ApiErrorBody>(
        {
          code: "unauthorized",
          message:
            "Sessão não autenticada. Cabeçalho de autorização ausente ou inválido.",
        },
        { status: 401 },
      );
    }

    return HttpResponse.json<User>(sanitizeUser(user));
  }),

  // 4. Logout da sessão
  http.post("*/api/auth/logout", async ({ request }) => {
    const fault = await scenarioEngine.executeMiddleware(request.url);
    if (fault) {
      return fault;
    }

    return HttpResponse.json({ success: true }, { status: 200 });
  }),

  // 5. Listagem de carteiras do usuário autenticado
  http.get("*/api/wallets", async ({ request }) => {
    const fault = await scenarioEngine.executeMiddleware(request.url);
    if (fault) {
      return fault;
    }

    const user = extractUserFromHeader(request);
    if (!user) {
      return HttpResponse.json<ApiErrorBody>(
        {
          code: "unauthorized",
          message: "Autenticação obrigatória para acessar as carteiras vinculadas.",
        },
        { status: 401 },
      );
    }

    const wallets = dbHelpers.findWalletsByUserId(user.id);
    return HttpResponse.json<Wallet[]>(wallets);
  }),

  // 6. Conexão de carteira Web3
  http.post("*/api/wallets/connect", async ({ request }) => {
    const fault = await scenarioEngine.executeMiddleware(request.url);
    if (fault) {
      return fault;
    }

    const user = extractUserFromHeader(request) ?? dbHelpers.findUserById("user_demo");

    if (!user) {
      return HttpResponse.json<ApiErrorBody>(
        {
          code: "unauthorized",
          message: "Nenhum usuário ativo para vincular a carteira.",
        },
        { status: 401 },
      );
    }

    interface ConnectPayload {
      network?: Network;
      address?: string;
      label?: string;
    }

    let body: ConnectPayload = {};
    try {
      body = (await request.json()) as ConnectPayload;
    } catch {
      // Aceita payload vazio gerando carteira padrão
    }

    const existingWallets = dbHelpers.findWalletsByUserId(user.id);
    const network = body.network ?? "ethereum";
    const hex = Array.from({ length: 40 }, () =>
      Math.floor(Math.random() * 16).toString(16),
    ).join("");
    const address = body.address ?? `0x${hex}`;
    const label =
      body.label ?? `Carteira ${network.charAt(0).toUpperCase() + network.slice(1)}`;

    const wallet: Wallet = {
      id: asId<"wallet">(`wallet_${Date.now()}`),
      userId: user.id,
      role: existingWallets.length === 0 ? "primary" : "secondary",
      network,
      address,
      label,
    };

    db.wallets.set(wallet.id, wallet);

    const result: WalletConnectionResult = {
      connected: true,
      wallet,
    };

    return HttpResponse.json<WalletConnectionResult>(result, { status: 201 });
  }),
];
