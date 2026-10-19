/**
 * Contratos de comércio: carrinho, cotação, pedidos e recibo imutável.
 *
 * Todos os valores monetários usam `EthString`. A cotação (`Quote`) é a
 * única fonte de verdade de preço no checkout; o pedido congela esses
 * valores em um `Receipt` imutável no momento da criação.
 */
import type { Network } from "@/contracts/catalog";
import type { EthString, Id, IsoDate } from "@/contracts/common";
import type { User } from "@/contracts/identity";

/** Linha do carrinho: uma edição específica de um NFT e a quantidade desejada. */
export interface CartLine {
  nftId: Id<"nft">;
  editionId: Id<"edition">;
  quantity: number;
}

/** Dono do carrinho: visitante anônimo ou usuário autenticado. */
export type CartOwner = { kind: "guest"; id: string } | { kind: "user"; id: User["id"] };

/** Carrinho versionado para controle de concorrência otimista. */
export interface Cart {
  id: string;
  owner: CartOwner;
  lines: CartLine[];
  version: number;
}

/** Divergências detectadas pelo servidor ao gerar a cotação. */
export type QuoteIssue =
  | { type: "price_changed"; nftId: Id<"nft">; previous: EthString; current: EthString }
  | {
      type: "out_of_stock" | "insufficient_stock";
      nftId: Id<"nft">;
      editionId: Id<"edition">;
      available: number;
    }
  | { type: "coupon_invalid" | "coupon_expired"; code: string };

/** Linha precificada da cotação. */
export interface QuoteLine {
  nftId: Id<"nft">;
  editionId: Id<"edition">;
  quantity: number;
  unitPrice: EthString;
  lineTotal: EthString;
}

/** Situação do cupom informado na cotação. */
export interface QuoteCoupon {
  code: string;
  status: "applied" | "invalid" | "expired";
}

/** Cotação emitida pelo servidor, válida até `expiresAt`. */
export interface Quote {
  quoteId: string;
  cartVersion: number;
  priceVersion: number;
  expiresAt: IsoDate;
  lines: QuoteLine[];
  subtotal: EthString;
  discount: EthString;
  networkFee: EthString;
  total: EthString;
  coupon?: QuoteCoupon;
  issues: QuoteIssue[];
}

/** Dados do colecionador informados no checkout. */
export interface CollectorData {
  name: string;
  email: string;
  document?: string;
}

/** Payload de criação de pedido a partir de uma cotação válida. */
export interface OrderCreateInput {
  quoteId: string;
  walletId: Id<"wallet">;
  network: Network;
  collector: CollectorData;
}

/**
 * Recibo imutável: snapshot dos valores no momento da criação do pedido.
 * Não deve ser recalculado nem alterado após emitido.
 */
export interface Receipt {
  readonly lines: ReadonlyArray<Readonly<QuoteLine>>;
  readonly subtotal: EthString;
  readonly discount: EthString;
  readonly networkFee: EthString;
  readonly total: EthString;
  readonly network: Network;
  readonly walletAddress: string;
  readonly txRef: string;
  readonly explorerUrl: string;
  readonly collector: Readonly<CollectorData>;
}

/** Ciclo de vida do pedido. */
export type OrderStatus = "pending" | "confirmed" | "declined";

/** Pedido com snapshot imutável e versão para reconciliação. */
export interface Order {
  id: Id<"order">;
  userId: User["id"];
  status: OrderStatus;
  version: number;
  snapshot: Receipt;
  /** Preenchido apenas quando `status` é `"declined"`. */
  declineReason?: string;
  createdAt: IsoDate;
  /** Momento em que o pedido saiu de `"pending"`. */
  settledAt?: IsoDate;
}
