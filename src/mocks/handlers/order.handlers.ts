/**
 * Handlers REST do MSW para criação de pedidos (Order), liquidação de checkout,
 * dedução atômica de estoque e emissão de recibo imutável (Receipt).
 */
import { http, HttpResponse } from "msw";

import type { Order, OrderCreateInput, Receipt } from "@/contracts/commerce";
import {
  type ApiErrorBody,
  type ApiErrorCode,
  asId,
  type IsoDate,
} from "@/contracts/common";
import { db, type DbUser, dbHelpers } from "@/mocks/db";
import { scenarioEngine } from "@/mocks/scenarios";

/** Extrai usuário autenticado do cabeçalho Authorization. */
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

  if (token.startsWith("mock-token-")) {
    const remainder = token.slice("mock-token-".length);
    for (const user of db.users.values()) {
      if (remainder.startsWith(user.id)) {
        return user;
      }
    }
  }

  const directUser = dbHelpers.findUserById(token);
  if (directUser) {
    return directUser;
  }

  if (token.toLowerCase().includes("demo")) {
    return dbHelpers.findUserById("user_demo") ?? null;
  }

  return null;
}

export const orderHandlers = [
  // 1. Criação e liquidação de pedido a partir de uma cotação válida
  http.post("*/api/orders", async ({ request }) => {
    const fault = await scenarioEngine.executeMiddleware(request.url);
    if (fault) {
      return fault;
    }

    const user = extractUserFromHeader(request);
    if (!user) {
      return HttpResponse.json<ApiErrorBody>(
        {
          code: "unauthorized",
          message: "Autenticação obrigatória para finalizar o pedido.",
        },
        { status: 401 },
      );
    }

    let input: Partial<OrderCreateInput>;
    try {
      input = (await request.json()) as Partial<OrderCreateInput>;
    } catch {
      return HttpResponse.json<ApiErrorBody>(
        { code: "validation_error", message: "Corpo da requisição JSON inválido." },
        { status: 400 },
      );
    }

    const { quoteId, walletId, network, collector } = input;

    if (!quoteId || !walletId || !network || !collector?.email || !collector?.name) {
      return HttpResponse.json<ApiErrorBody>(
        {
          code: "validation_error",
          message: "quoteId, walletId, network e dados do collector são obrigatórios.",
        },
        { status: 400 },
      );
    }

    // 1. Validação da cotação
    const quote = db.quotes.get(quoteId);
    if (!quote) {
      return HttpResponse.json<ApiErrorBody>(
        {
          code: "not_found",
          message: `Cotação com id '${quoteId}' não encontrada.`,
        },
        { status: 404 },
      );
    }

    // 2. Validação de expiração da cotação
    if (new Date(quote.expiresAt).getTime() < Date.now()) {
      return HttpResponse.json<ApiErrorBody | { code: string; message: string }>(
        {
          code: "quote_expired" as unknown as ApiErrorCode,
          message: "A cotação informada expirou. Gere uma nova cotação para prosseguir.",
        },
        { status: 409 },
      );
    }

    // 3. Validação da carteira
    const wallet = db.wallets.get(walletId);
    if (!wallet) {
      return HttpResponse.json<ApiErrorBody | { code: string; message: string }>(
        {
          code: "invalid_wallet" as unknown as ApiErrorCode,
          message: `Carteira informada '${walletId}' não foi encontrada ou é inválida.`,
        },
        { status: 400 },
      );
    }

    // 4. Verificação de estoque prévia
    for (const line of quote.lines) {
      const nft = dbHelpers.findNftById(line.nftId);
      const edition = nft?.editions.find((ed) => ed.id === line.editionId);
      if (!edition || edition.available < line.quantity) {
        return HttpResponse.json<ApiErrorBody | { code: string; message: string }>(
          {
            code: "insufficient_stock" as unknown as ApiErrorCode,
            message: `Estoque insuficiente para a edição '${line.editionId}'.`,
          },
          { status: 409 },
        );
      }
    }

    // 5. Dedução atômica de estoque das edições
    for (const line of quote.lines) {
      const nft = dbHelpers.findNftById(line.nftId);
      const edition = nft?.editions.find((ed) => ed.id === line.editionId);
      if (edition) {
        edition.available -= line.quantity;
      }
    }

    // 6. Limpeza automática do carrinho do usuário
    for (const cart of db.carts.values()) {
      if (cart.owner.kind === "user" && cart.owner.id === user.id) {
        cart.lines = [];
        cart.version += 1;
      }
    }
    const userCart = db.carts.get(`cart_${user.id}`);
    if (userCart) {
      userCart.lines = [];
      userCart.version += 1;
    }

    // 7. Geração de recibo imutável (Receipt)
    const hex64 = Array.from({ length: 64 }, () =>
      Math.floor(Math.random() * 16).toString(16),
    ).join("");
    const txRef = `0x${hex64}`;
    const explorerUrl =
      network === "polygon"
        ? `https://polygonscan.com/tx/${txRef}`
        : `https://etherscan.io/tx/${txRef}`;

    const receipt: Receipt = {
      lines: quote.lines,
      subtotal: quote.subtotal,
      discount: quote.discount,
      networkFee: quote.networkFee,
      total: quote.total,
      network,
      walletAddress: wallet.address,
      txRef,
      explorerUrl,
      collector: {
        name: collector.name,
        email: collector.email,
        ...(collector.document && { document: collector.document }),
      },
    };

    const now = new Date().toISOString() as IsoDate;
    const orderId = asId<"order">(`order_${Date.now()}`);

    const order: Order = {
      id: orderId,
      userId: user.id,
      status: "confirmed",
      version: 1,
      snapshot: receipt,
      createdAt: now,
      settledAt: now,
    };

    db.orders.set(order.id, order);

    return HttpResponse.json<Order>(order, { status: 201 });
  }),

  // 2. Listagem de pedidos do usuário autenticado
  http.get("*/api/orders", async ({ request }) => {
    const fault = await scenarioEngine.executeMiddleware(request.url);
    if (fault) {
      return fault;
    }

    const user = extractUserFromHeader(request);
    if (!user) {
      return HttpResponse.json<ApiErrorBody>(
        {
          code: "unauthorized",
          message: "Autenticação necessária para listar pedidos.",
        },
        { status: 401 },
      );
    }

    const userOrders = Array.from(db.orders.values())
      .filter((o) => o.userId === user.id)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return HttpResponse.json<Order[]>(userOrders, { status: 200 });
  }),

  // 3. Detalhe de pedido por ID
  http.get("*/api/orders/:id", async ({ params, request }) => {
    const fault = await scenarioEngine.executeMiddleware(request.url);
    if (fault) {
      return fault;
    }

    const { id } = params;
    const order = db.orders.get(String(id));

    if (!order) {
      return HttpResponse.json<ApiErrorBody>(
        {
          code: "not_found",
          message: `Pedido com id '${String(id)}' não encontrado.`,
        },
        { status: 404 },
      );
    }

    return HttpResponse.json<Order>(order, { status: 200 });
  }),
];
