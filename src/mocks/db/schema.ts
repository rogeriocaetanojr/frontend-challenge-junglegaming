/**
 * Esquema tipado do banco de dados em memória para os mocks do MSW.
 *
 * Utiliza as interfaces de contrato estabelecidas em `src/contracts/`
 * para garantir sincronia estrita entre os dados mockados e o contrato da API.
 */
import type { Nft } from "@/contracts/catalog";
import type { Cart, Order, Quote } from "@/contracts/commerce";
import type { IsoDate } from "@/contracts/common";
import type { User, Wallet } from "@/contracts/identity";

/**
 * Entidade de usuário persistida no banco em memória,
 * contendo o hash/segredo da credencial para validação de login.
 */
export type DbUser = User & {
  passwordHash: string;
};

/**
 * Registro de cupom promocional no banco em memória.
 * O desconto é armazenado em basis points (bps), onde 100 bps = 1%.
 */
export interface DbCoupon {
  code: string;
  bps: number;
  expiresAt: IsoDate;
  active: boolean;
}

/**
 * Registro de idempotência para criação de pedidos.
 * Associa (userId, idempotencyKey) ao hash canônico da requisição e ao pedido gerado.
 */
export interface IdempotencyRecord {
  userId: string;
  key: string;
  requestHash: string;
  orderId: string;
  createdAt: IsoDate;
}

/**
 * Estrutura do banco de dados em memória.
 * Cada coleção é mantida em um `Map` para buscas e mutações O(1).
 */
export interface InMemoryDatabase {
  nfts: Map<string, Nft>;
  users: Map<string, DbUser>;
  wallets: Map<string, Wallet>;
  carts: Map<string, Cart>;
  quotes: Map<string, Quote>;
  orders: Map<string, Order>;
  coupons: Map<string, DbCoupon>;
  idempotency: Map<string, IdempotencyRecord>;
}
