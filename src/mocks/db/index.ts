/**
 * Instância singleton do banco de dados em memória e rotinas de ciclo de vida.
 *
 * Utilizado pelos handlers do MSW e pelas suítes de testes para simular
 * persistência com isolamento e capacidade de reset determinístico.
 */
import type { Nft } from "@/contracts/catalog";
import type { Cart, Order, Quote } from "@/contracts/commerce";
import type { IsoDate } from "@/contracts/common";
import type { Session, Wallet } from "@/contracts/identity";
import type { DbCoupon, DbUser, IdempotencyRecord, InMemoryDatabase } from "./schema";
import {
  SEED_CARTS,
  SEED_COUPONS,
  SEED_NFTS,
  SEED_ORDERS,
  SEED_QUOTES,
  SEED_USERS,
  SEED_WALLETS,
} from "./seeds";

export * from "./schema";
export * from "./seeds";

/** Instância singleton do banco em memória. */
export const db: InMemoryDatabase = {
  nfts: new Map<string, Nft>(),
  users: new Map<string, DbUser>(),
  wallets: new Map<string, Wallet>(),
  carts: new Map<string, Cart>(),
  quotes: new Map<string, Quote>(),
  orders: new Map<string, Order>(),
  coupons: new Map<string, DbCoupon>(),
  idempotency: new Map<string, IdempotencyRecord>(),
  sessions: new Map<string, Session>(),
};

/**
 * Limpa todas as coleções e as repovoa com clones estruturados das seeds iniciais.
 * Deve ser chamado antes de cada suíte ou caso de teste para garantir isolamento.
 */
export function resetDb(): InMemoryDatabase {
  db.nfts.clear();
  db.users.clear();
  db.wallets.clear();
  db.carts.clear();
  db.quotes.clear();
  db.orders.clear();
  db.coupons.clear();
  db.idempotency.clear();
  db.sessions.clear();

  for (const nft of structuredClone(SEED_NFTS)) {
    db.nfts.set(nft.id, nft);
  }

  for (const user of structuredClone(SEED_USERS)) {
    db.users.set(user.id, user);
  }

  for (const wallet of structuredClone(SEED_WALLETS)) {
    db.wallets.set(wallet.id, wallet);
  }

  for (const cart of structuredClone(SEED_CARTS)) {
    db.carts.set(cart.id, cart);
  }

  for (const quote of structuredClone(SEED_QUOTES)) {
    db.quotes.set(quote.quoteId, quote);
  }

  for (const order of structuredClone(SEED_ORDERS)) {
    db.orders.set(order.id, order);
  }

  for (const coupon of structuredClone(SEED_COUPONS)) {
    db.coupons.set(coupon.code.toUpperCase(), coupon);
  }

  // Sessão padrão para o usuário demo
  const demoUser = db.users.get("user_demo");
  if (demoUser) {
    const defaultSession: Session = {
      token: "mock-token-user_demo",
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() as IsoDate,
      user: {
        id: demoUser.id,
        name: demoUser.name,
        email: demoUser.email,
        bio: demoUser.bio,
        avatarUrl: demoUser.avatarUrl,
        createdAt: demoUser.createdAt,
      },
    };
    db.sessions.set(defaultSession.token, defaultSession);
  }

  return db;
}

/** Retorna a instância atual do banco em memória. */
export function getDb(): InMemoryDatabase {
  return db;
}

/** Helpers de consulta convenientes para handlers do MSW. */
export const dbHelpers = {
  findNftById(id: string): Nft | undefined {
    return db.nfts.get(id);
  },

  findUserById(id: string): DbUser | undefined {
    return db.users.get(id);
  },

  findUserByEmail(email: string): DbUser | undefined {
    const normalized = email.trim().toLowerCase();
    for (const user of db.users.values()) {
      if (user.email.toLowerCase() === normalized) {
        return user;
      }
    }
    return undefined;
  },

  findWalletsByUserId(userId: string): Wallet[] {
    const results: Wallet[] = [];
    for (const wallet of db.wallets.values()) {
      if (wallet.userId === userId) {
        results.push(wallet);
      }
    }
    return results;
  },

  findCartById(id: string): Cart | undefined {
    return db.carts.get(id);
  },

  findCouponByCode(code: string): DbCoupon | undefined {
    return db.coupons.get(code.trim().toUpperCase());
  },
};

// Popula o banco singleton na inicialização do módulo.
resetDb();
