/**
 * Handlers REST do MSW para o carrinho de compras.
 *
 * Implementa identificação de sessão (guest vs user autenticado), controle de concorrência
 * otimista via versionamento monotônico (`version`), validação estrita de estoque (`available`)
 * e operações atômicas de inclusão, alteração, remoção e limpeza.
 */
import { http, HttpResponse } from "msw";

import type { Cart, CartLine } from "@/contracts/commerce";
import { type ApiErrorBody, asId } from "@/contracts/common";
import { db, type DbUser, dbHelpers } from "@/mocks/db";
import { scenarioEngine } from "@/mocks/scenarios";

interface CartItemInput {
  nftId: string;
  editionId: string;
  quantity: number;
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

/** Localiza ou cria o carrinho correspondente ao requisitante (autenticado ou visitante). */
function getOrCreateCart(request: Request): Cart {
  const user = extractUserFromHeader(request);

  if (user) {
    // 1. Busca carrinho existente vinculado a este usuário
    for (const cart of db.carts.values()) {
      if (cart.owner.kind === "user" && cart.owner.id === user.id) {
        return cart;
      }
    }

    // 2. Cria novo carrinho para o usuário
    const userCartId = `cart_${user.id}`;
    const newCart: Cart = {
      id: userCartId,
      owner: { kind: "user", id: user.id },
      lines: [],
      version: 1,
    };
    db.carts.set(userCartId, newCart);
    return newCart;
  }

  // 3. Visitante anônimo (guest) via x-cart-id ou padrão
  const headerCartId = request.headers.get("x-cart-id")?.trim();
  const guestCartId = headerCartId || "cart_guest_default";

  const existingGuestCart = db.carts.get(guestCartId);
  if (existingGuestCart) {
    return existingGuestCart;
  }

  const newGuestCart: Cart = {
    id: guestCartId,
    owner: { kind: "guest", id: guestCartId },
    lines: [],
    version: 1,
  };
  db.carts.set(guestCartId, newGuestCart);
  return newGuestCart;
}

export const cartHandlers = [
  // 1. Obtenção do carrinho atual
  http.get("*/api/cart", async ({ request }) => {
    const fault = await scenarioEngine.executeMiddleware(request.url);
    if (fault) {
      return fault;
    }

    const cart = getOrCreateCart(request);
    return HttpResponse.json<Cart>(cart, { status: 200 });
  }),

  // 2. Adição de item ao carrinho
  http.post("*/api/cart/items", async ({ request }) => {
    const fault = await scenarioEngine.executeMiddleware(request.url);
    if (fault) {
      return fault;
    }

    let body: Partial<CartItemInput>;
    try {
      body = (await request.json()) as Partial<CartItemInput>;
    } catch {
      return HttpResponse.json<ApiErrorBody>(
        { code: "validation_error", message: "Corpo JSON inválido." },
        { status: 400 },
      );
    }

    const { nftId, editionId, quantity } = body;

    if (!nftId || !editionId || typeof quantity !== "number" || quantity <= 0) {
      return HttpResponse.json<ApiErrorBody>(
        {
          code: "validation_error",
          message: "nftId, editionId e quantidade inteira positiva são obrigatórios.",
        },
        { status: 400 },
      );
    }

    // Valida existência do NFT e da edição
    const nft = dbHelpers.findNftById(nftId);
    if (!nft) {
      return HttpResponse.json<ApiErrorBody>(
        { code: "not_found", message: `NFT com id '${nftId}' não encontrado.` },
        { status: 404 },
      );
    }

    const edition = nft.editions.find((ed) => ed.id === editionId);
    if (!edition) {
      return HttpResponse.json<ApiErrorBody>(
        {
          code: "not_found",
          message: `Edição com id '${editionId}' não encontrada para o NFT '${nftId}'.`,
        },
        { status: 404 },
      );
    }

    const cart = getOrCreateCart(request);
    const existingLine = cart.lines.find(
      (line) => line.nftId === nftId && line.editionId === editionId,
    );
    const totalQuantity = (existingLine ? existingLine.quantity : 0) + quantity;

    // Validação de estoque disponível
    if (totalQuantity > edition.available) {
      return HttpResponse.json<ApiErrorBody>(
        {
          code: "conflict_availability",
          message: `Quantidade solicitada (${totalQuantity}) excede o estoque disponível da edição (${edition.available}).`,
        },
        { status: 409 },
      );
    }

    if (existingLine) {
      existingLine.quantity = totalQuantity;
    } else {
      const newLine: CartLine = {
        nftId: asId<"nft">(nftId),
        editionId: asId<"edition">(editionId),
        quantity,
      };
      cart.lines.push(newLine);
    }

    cart.version += 1;
    db.carts.set(cart.id, cart);

    return HttpResponse.json<Cart>(cart, { status: 200 });
  }),

  // 3. Atualização de quantidade de um item existente
  http.patch("*/api/cart/items", async ({ request }) => {
    const fault = await scenarioEngine.executeMiddleware(request.url);
    if (fault) {
      return fault;
    }

    let body: Partial<CartItemInput>;
    try {
      body = (await request.json()) as Partial<CartItemInput>;
    } catch {
      return HttpResponse.json<ApiErrorBody>(
        { code: "validation_error", message: "Corpo JSON inválido." },
        { status: 400 },
      );
    }

    const { nftId, editionId, quantity } = body;

    if (!nftId || !editionId || typeof quantity !== "number") {
      return HttpResponse.json<ApiErrorBody>(
        {
          code: "validation_error",
          message: "nftId, editionId e quantity são obrigatórios.",
        },
        { status: 400 },
      );
    }

    const cart = getOrCreateCart(request);

    // Se quantidade menor ou igual a zero, remove a linha
    if (quantity <= 0) {
      cart.lines = cart.lines.filter(
        (line) => !(line.nftId === nftId && line.editionId === editionId),
      );
      cart.version += 1;
      db.carts.set(cart.id, cart);
      return HttpResponse.json<Cart>(cart, { status: 200 });
    }

    // Valida estoque para a nova quantidade
    const nft = dbHelpers.findNftById(nftId);
    const edition = nft?.editions.find((ed) => ed.id === editionId);

    if (edition && quantity > edition.available) {
      return HttpResponse.json<ApiErrorBody>(
        {
          code: "conflict_availability",
          message: `Quantidade solicitada (${quantity}) excede o estoque disponível (${edition.available}).`,
        },
        { status: 409 },
      );
    }

    const existingLine = cart.lines.find(
      (line) => line.nftId === nftId && line.editionId === editionId,
    );

    if (existingLine) {
      existingLine.quantity = quantity;
    } else {
      cart.lines.push({
        nftId: asId<"nft">(nftId),
        editionId: asId<"edition">(editionId),
        quantity,
      });
    }

    cart.version += 1;
    db.carts.set(cart.id, cart);

    return HttpResponse.json<Cart>(cart, { status: 200 });
  }),

  // 4. Remoção de item do carrinho
  http.delete("*/api/cart/items", async ({ request }) => {
    const fault = await scenarioEngine.executeMiddleware(request.url);
    if (fault) {
      return fault;
    }

    const url = new URL(request.url);
    let nftId = url.searchParams.get("nftId");
    let editionId = url.searchParams.get("editionId");

    if (!nftId || !editionId) {
      try {
        const body = (await request.json()) as Partial<CartItemInput>;
        nftId = nftId || body.nftId || null;
        editionId = editionId || body.editionId || null;
      } catch {
        // Ignora ausência de body caso venha apenas em query param
      }
    }

    if (!nftId || !editionId) {
      return HttpResponse.json<ApiErrorBody>(
        {
          code: "validation_error",
          message: "nftId e editionId são obrigatórios para exclusão da linha.",
        },
        { status: 400 },
      );
    }

    const cart = getOrCreateCart(request);
    cart.lines = cart.lines.filter(
      (line) => !(line.nftId === nftId && line.editionId === editionId),
    );
    cart.version += 1;
    db.carts.set(cart.id, cart);

    return HttpResponse.json<Cart>(cart, { status: 200 });
  }),

  // 5. Limpeza total do carrinho
  http.delete("*/api/cart/clear", async ({ request }) => {
    const fault = await scenarioEngine.executeMiddleware(request.url);
    if (fault) {
      return fault;
    }

    const cart = getOrCreateCart(request);
    cart.lines = [];
    cart.version += 1;
    db.carts.set(cart.id, cart);

    return HttpResponse.json<Cart>(cart, { status: 200 });
  }),

  // 6. Merge idempotente de carrinho guest para usuário autenticado
  http.post("*/api/cart/merge", async ({ request }) => {
    const fault = await scenarioEngine.executeMiddleware(request.url);
    if (fault) {
      return fault;
    }

    const user = extractUserFromHeader(request);
    if (!user) {
      return HttpResponse.json<ApiErrorBody>(
        {
          code: "unauthorized",
          message: "Autenticação obrigatória para mesclar o carrinho.",
        },
        { status: 401 },
      );
    }

    let body: { guestCartId?: string } = {};
    try {
      body = (await request.json()) as { guestCartId?: string };
    } catch {
      // Aceita payload vazio caso o id venha no header
    }

    const guestCartId =
      body.guestCartId ||
      request.headers.get("x-cart-id")?.trim() ||
      "cart_guest_default";

    const userCart = getOrCreateCart(request);
    const guestCart = db.carts.get(guestCartId);

    if (guestCart && guestCart.lines.length > 0) {
      for (const guestLine of guestCart.lines) {
        const existingLine = userCart.lines.find(
          (l) => l.nftId === guestLine.nftId && l.editionId === guestLine.editionId,
        );

        if (existingLine) {
          existingLine.quantity += guestLine.quantity;
        } else {
          userCart.lines.push({
            nftId: guestLine.nftId,
            editionId: guestLine.editionId,
            quantity: guestLine.quantity,
          });
        }
      }

      // Esvazia o carrinho anônimo para garantir idempotência em chamadas subsequentes
      guestCart.lines = [];
      guestCart.version += 1;
      db.carts.set(guestCart.id, guestCart);

      userCart.version += 1;
      db.carts.set(userCart.id, userCart);
    }

    return HttpResponse.json<Cart>(userCart, { status: 200 });
  }),
];
