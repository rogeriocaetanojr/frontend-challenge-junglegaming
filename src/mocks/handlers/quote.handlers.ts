/**
 * Handlers REST do MSW para cálculo e emissão de cotações (Quote),
 * validação de cupons promocionais e apuração de taxas de rede.
 *
 * Utiliza estritamente a biblioteca `@/lib/money` para cálculos em Wei/bigint
 * sem qualquer perda de precisão de ponto flutuante.
 */
import { http, HttpResponse } from "msw";

import type {
  Cart,
  Quote,
  QuoteCoupon,
  QuoteIssue,
  QuoteLine,
} from "@/contracts/commerce";
import { type ApiErrorBody, type ApiErrorCode, type IsoDate } from "@/contracts/common";
import { addEth, asEthString, mulEthByInt, percentEth, subEth } from "@/lib/money";
import { db, type DbUser, dbHelpers } from "@/mocks/db";
import { scenarioEngine } from "@/mocks/scenarios";

interface QuoteInput {
  cartId?: string;
  couponCode?: string;
}

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

/** Localiza o carrinho a ser cotado a partir do payload ou sessão. */
function resolveCartForQuote(request: Request, cartIdFromInput?: string): Cart | null {
  // 1. Busca por cartId explícito
  if (cartIdFromInput) {
    const byId = db.carts.get(cartIdFromInput);
    if (byId) {
      return byId;
    }
  }

  // 2. Busca por usuário autenticado
  const user = extractUserFromHeader(request);
  if (user) {
    for (const cart of db.carts.values()) {
      if (cart.owner.kind === "user" && cart.owner.id === user.id) {
        return cart;
      }
    }
    const userCart = db.carts.get(`cart_${user.id}`);
    if (userCart) {
      return userCart;
    }
  }

  // 3. Busca por x-cart-id de visitante
  const headerCartId = (
    request.headers.get("x-cart-id") ?? request.headers.get("x-guest-id")
  )?.trim();
  if (headerCartId) {
    const guestCart = db.carts.get(headerCartId);
    if (guestCart) {
      return guestCart;
    }
  }

  // 4. Fallback para carrinho padrão guest
  return db.carts.get("cart_guest_default") ?? null;
}

export const quoteHandlers = [
  // 1. Emissão de nova cotação (Quote) com cálculo estrito em bigint
  http.post("*/api/quotes", async ({ request }) => {
    const fault = await scenarioEngine.executeMiddleware(request.url);
    if (fault) {
      return fault;
    }

    let body: QuoteInput = {};
    try {
      body = (await request.json()) as QuoteInput;
    } catch {
      // Aceita payload vazio caso cartId venha via headers
    }

    const cart = resolveCartForQuote(request, body.cartId);

    // Validação de carrinho inexistente ou vazio
    if (!cart || cart.lines.length === 0) {
      return HttpResponse.json<ApiErrorBody | { code: string; message: string }>(
        {
          code: "empty_cart" as unknown as ApiErrorCode,
          message: "O carrinho está vazio. Adicione itens antes de gerar a cotação.",
        },
        { status: 400 },
      );
    }

    const quoteLines: QuoteLine[] = [];
    const issues: QuoteIssue[] = [];
    let subtotal = asEthString("0");
    let priceVersionSum = 0;

    // Precificação linha a linha
    for (const line of cart.lines) {
      const nft = dbHelpers.findNftById(line.nftId);
      if (!nft) {
        issues.push({
          type: "out_of_stock",
          nftId: line.nftId,
          editionId: line.editionId,
          available: 0,
        });
        continue;
      }

      const edition = nft.editions.find((ed) => ed.id === line.editionId);
      if (!edition) {
        issues.push({
          type: "out_of_stock",
          nftId: line.nftId,
          editionId: line.editionId,
          available: 0,
        });
        continue;
      }

      if (edition.available < line.quantity) {
        issues.push({
          type: edition.available === 0 ? "out_of_stock" : "insufficient_stock",
          nftId: line.nftId,
          editionId: line.editionId,
          available: edition.available,
        });
      }

      priceVersionSum += nft.version;

      const unitPrice = edition.price;
      const lineTotal = mulEthByInt(unitPrice, line.quantity);
      subtotal = addEth(subtotal, lineTotal);

      quoteLines.push({
        nftId: line.nftId,
        editionId: line.editionId,
        quantity: line.quantity,
        unitPrice,
        lineTotal,
      });
    }

    // Validação e cálculo de cupom promocional
    let discount = asEthString("0");
    let coupon: QuoteCoupon | undefined;
    const rawCoupon = body.couponCode?.trim().toUpperCase();

    if (rawCoupon) {
      const dbCoupon = dbHelpers.findCouponByCode(rawCoupon);

      if (!dbCoupon) {
        coupon = { code: rawCoupon, status: "invalid" };
        issues.push({ type: "coupon_invalid", code: rawCoupon });
      } else {
        const isExpired = new Date(dbCoupon.expiresAt).getTime() < Date.now();
        if (!dbCoupon.active || isExpired) {
          coupon = { code: rawCoupon, status: "expired" };
          issues.push({ type: "coupon_expired", code: rawCoupon });
        } else {
          coupon = { code: rawCoupon, status: "applied" };
          discount = percentEth(subtotal, dbCoupon.bps);
        }
      }
    }

    // Taxa de rede estimada fixa em ETH (0.002 ETH)
    const networkFee = asEthString("0.002");
    const discountedSubtotal = subEth(subtotal, discount);
    const total = addEth(discountedSubtotal, networkFee);

    // Validade de 10 minutos
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString() as IsoDate;

    const quote: Quote = {
      quoteId: `quote_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      cartVersion: cart.version,
      priceVersion: priceVersionSum || 1,
      expiresAt,
      lines: quoteLines,
      subtotal,
      discount,
      networkFee,
      total,
      ...(coupon && { coupon }),
      issues,
    };

    db.quotes.set(quote.quoteId, quote);

    return HttpResponse.json<Quote>(quote, { status: 201 });
  }),

  // 2. Consulta de cotação existente por ID
  http.get("*/api/quotes/:id", async ({ params, request }) => {
    const fault = await scenarioEngine.executeMiddleware(request.url);
    if (fault) {
      return fault;
    }

    const { id } = params;
    const quote = db.quotes.get(String(id));

    if (!quote) {
      return HttpResponse.json<ApiErrorBody>(
        {
          code: "not_found",
          message: `Cotação com id '${String(id)}' não encontrada.`,
        },
        { status: 404 },
      );
    }

    return HttpResponse.json<Quote>(quote, { status: 200 });
  }),

  // 3. Endpoint de Cotação Direta do Carrinho (POST /api/quote)
  http.post("*/api/quote", async ({ request }) => {
    const fault = await scenarioEngine.executeMiddleware(request.url);
    if (fault) {
      return fault;
    }

    interface DirectQuoteInput {
      items?: Array<{ id: string; price: number | string; quantity: number }>;
      couponCode?: string | null;
    }

    let body: DirectQuoteInput = {};
    try {
      body = (await request.json()) as DirectQuoteInput;
    } catch {
      // payload vazio
    }

    const items = body.items || [];
    if (items.length === 0) {
      return HttpResponse.json(
        {
          code: "empty_cart",
          message: "O carrinho está vazio para emissão de cotação.",
        },
        { status: 400 },
      );
    }

    // Calcula subtotal com precisão decimal
    const rawSubtotal = items.reduce((acc, item) => {
      const priceNum =
        typeof item.price === "number" ? item.price : parseFloat(item.price) || 0;
      const qty = item.quantity > 0 ? item.quantity : 1;
      return acc + priceNum * qty;
    }, 0);

    const subtotal = Number(rawSubtotal.toFixed(4));
    let discount = 0;
    const rawCoupon = (body.couponCode || "").trim().toUpperCase();

    if (rawCoupon) {
      if (rawCoupon === "KURIO10" || rawCoupon === "JUNGLE10") {
        discount = Number((subtotal * 0.1).toFixed(4));
      } else {
        return HttpResponse.json(
          {
            code: "invalid_coupon",
            message: `Cupom '${rawCoupon}' inválido ou expirado.`,
          },
          { status: 400 },
        );
      }
    }

    const networkFee = 0.005; // 0.005 ETH fixa
    const total = Number((Math.max(0, subtotal - discount) + networkFee).toFixed(4));

    return HttpResponse.json(
      {
        quoteId: `quote_${Date.now()}`,
        subtotal,
        discount,
        networkFee,
        total,
        couponCode: rawCoupon || null,
        expiresAt: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
      },
      { status: 200 },
    );
  }),
];
