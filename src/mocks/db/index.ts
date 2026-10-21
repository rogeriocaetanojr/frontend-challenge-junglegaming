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
import type {
  DbCoupon,
  DbFavorite,
  DbUser,
  IdempotencyRecord,
  InMemoryDatabase,
} from "./schema";
import {
  SEED_CARTS,
  SEED_COUPONS,
  SEED_FAVORITES,
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
  favorites: new Map<string, DbFavorite[]>(),
};

/**
 * Limpa todas as coleções e as repovoa com clones estruturados das seeds iniciais.
 * Deve ser chamado antes de cada suíte ou caso de teste para garantir isolamento.
 */
const CARTS_STORAGE_KEY = "@nft-marketplace:mock:carts";

/** Persiste os carrinhos do mock no navegador (sustenta o refresh da página). */
export function saveCarts(): void {
  try {
    localStorage.setItem(CARTS_STORAGE_KEY, JSON.stringify([...db.carts.values()]));
  } catch {
    // Storage indisponível: o carrinho segue válido apenas em memória
  }
}

function readPersistedCarts(): Cart[] {
  try {
    const raw = localStorage.getItem(CARTS_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Cart[]) : [];
  } catch {
    // Dados corrompidos são ignorados e o cenário padrão é mantido
    return [];
  }
}

const FAVORITES_STORAGE_KEY = "@nft-marketplace:mock:favorites";

/** Persiste os favoritos do mock no navegador (sustenta o refresh da página). */
export function saveFavorites(): void {
  try {
    localStorage.setItem(
      FAVORITES_STORAGE_KEY,
      JSON.stringify([...db.favorites.entries()]),
    );
  } catch {
    // Storage indisponível: os favoritos seguem válidos apenas em memória
  }
}

function readPersistedFavorites(): [string, DbFavorite[]][] {
  try {
    const raw = localStorage.getItem(FAVORITES_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as [string, DbFavorite[]][]) : [];
  } catch {
    return [];
  }
}

const IDENTITY_STORAGE_KEY = "@nft-marketplace:mock:identity";

interface PersistedIdentity {
  users: [string, DbUser][];
  sessions: [string, Session][];
  wallets: [string, Wallet][];
}

/** Persiste usuários, sessões e carteiras do mock (perfil e login sobrevivem ao refresh). */
export function saveIdentity(): void {
  try {
    const snapshot: PersistedIdentity = {
      users: [...db.users.entries()],
      sessions: [...db.sessions.entries()],
      wallets: [...db.wallets.entries()],
    };
    localStorage.setItem(IDENTITY_STORAGE_KEY, JSON.stringify(snapshot));
  } catch {
    // Storage indisponível: os dados seguem válidos apenas em memória
  }
}

function readPersistedIdentity(): PersistedIdentity | null {
  try {
    const raw = localStorage.getItem(IDENTITY_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as PersistedIdentity) : null;
  } catch {
    return null;
  }
}

export function resetDb(): InMemoryDatabase {
  try {
    localStorage.removeItem(CARTS_STORAGE_KEY);
    localStorage.removeItem(FAVORITES_STORAGE_KEY);
    localStorage.removeItem(IDENTITY_STORAGE_KEY);
  } catch {
    // Storage indisponível
  }
  db.nfts.clear();
  db.users.clear();
  db.wallets.clear();
  db.carts.clear();
  db.quotes.clear();
  db.orders.clear();
  db.coupons.clear();
  db.idempotency.clear();
  db.sessions.clear();
  db.favorites.clear();

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

  for (const [userId, favorites] of Object.entries(structuredClone(SEED_FAVORITES))) {
    db.favorites.set(userId, favorites);
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
// Na carga do app, o carrinho persistido sobrevive ao refresh; o reset explícito o descarta
const persistedCarts = import.meta.env.MODE === "test" ? [] : readPersistedCarts();
const persistedFavorites =
  import.meta.env.MODE === "test" ? [] : readPersistedFavorites();
const persistedIdentity =
  import.meta.env.MODE === "test" ? null : readPersistedIdentity();
resetDb();
if (persistedIdentity) {
  for (const [id, user] of persistedIdentity.users) db.users.set(id, user);
  for (const [token, session] of persistedIdentity.sessions)
    db.sessions.set(token, session);
  db.wallets.clear();
  for (const [id, wallet] of persistedIdentity.wallets) db.wallets.set(id, wallet);
  saveIdentity();
}
if (persistedFavorites.length > 0) {
  for (const [userId, favorites] of persistedFavorites) {
    db.favorites.set(userId, favorites);
  }
  saveFavorites();
}
if (persistedCarts.length > 0) {
  for (const cart of persistedCarts) {
    db.carts.set(cart.id, cart);
  }
  saveCarts();
}
