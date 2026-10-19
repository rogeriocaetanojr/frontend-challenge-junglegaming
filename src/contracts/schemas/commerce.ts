/**
 * Schemas Zod para contratos de comércio (carrinho, cotação, pedidos e recibo).
 */
import { z } from "zod";

import type {
  Cart,
  CartLine,
  CartOwner,
  CollectorData,
  Order,
  OrderCreateInput,
  OrderStatus,
  Quote,
  QuoteCoupon,
  QuoteIssue,
  QuoteLine,
  Receipt,
} from "@/contracts/commerce";
import { networkSchema } from "@/contracts/schemas/catalog";
import {
  createIdSchema,
  ethStringSchema,
  isoDateSchema,
} from "@/contracts/schemas/common";

/** Schema para linha do carrinho. */
export const cartLineSchema = z.object({
  nftId: createIdSchema<"nft">(),
  editionId: createIdSchema<"edition">(),
  quantity: z.number().int().positive(),
}) satisfies z.ZodType<CartLine>;

/** Schema para dono do carrinho (visitante ou usuário autenticado). */
export const cartOwnerSchema = z.discriminatedUnion("kind", [
  z.object({
    kind: z.literal("guest"),
    id: z.string().min(1),
  }),
  z.object({
    kind: z.literal("user"),
    id: createIdSchema<"user">(),
  }),
]) satisfies z.ZodType<CartOwner>;

/** Schema para carrinho de compras. */
export const cartSchema = z.object({
  id: z.string().min(1),
  owner: cartOwnerSchema,
  lines: z.array(cartLineSchema),
  version: z.number().int().nonnegative(),
}) satisfies z.ZodType<Cart>;

/** Schema para divergências da cotação. */
export const quoteIssueSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("price_changed"),
    nftId: createIdSchema<"nft">(),
    previous: ethStringSchema,
    current: ethStringSchema,
  }),
  z.object({
    type: z.literal("out_of_stock"),
    nftId: createIdSchema<"nft">(),
    editionId: createIdSchema<"edition">(),
    available: z.number().int().nonnegative(),
  }),
  z.object({
    type: z.literal("insufficient_stock"),
    nftId: createIdSchema<"nft">(),
    editionId: createIdSchema<"edition">(),
    available: z.number().int().nonnegative(),
  }),
  z.object({
    type: z.literal("coupon_invalid"),
    code: z.string(),
  }),
  z.object({
    type: z.literal("coupon_expired"),
    code: z.string(),
  }),
]) satisfies z.ZodType<QuoteIssue>;

/** Schema para linha cotada de NFT. */
export const quoteLineSchema = z.object({
  nftId: createIdSchema<"nft">(),
  editionId: createIdSchema<"edition">(),
  quantity: z.number().int().positive(),
  unitPrice: ethStringSchema,
  lineTotal: ethStringSchema,
}) satisfies z.ZodType<QuoteLine>;

/** Schema para cupom da cotação. */
export const quoteCouponSchema = z.object({
  code: z.string(),
  status: z.enum(["applied", "invalid", "expired"]),
}) satisfies z.ZodType<QuoteCoupon>;

/** Schema para cotação de checkout. */
export const quoteSchema = z.object({
  quoteId: z.string().min(1),
  cartVersion: z.number().int().nonnegative(),
  priceVersion: z.number().int().nonnegative(),
  expiresAt: isoDateSchema,
  lines: z.array(quoteLineSchema),
  subtotal: ethStringSchema,
  discount: ethStringSchema,
  networkFee: ethStringSchema,
  total: ethStringSchema,
  coupon: quoteCouponSchema.optional(),
  issues: z.array(quoteIssueSchema),
}) satisfies z.ZodType<Quote>;

/** Schema para dados do colecionador. */
export const collectorDataSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  email: z.string().email("E-mail inválido"),
  document: z.string().optional(),
}) satisfies z.ZodType<CollectorData>;

/** Schema para criação de pedido. */
export const orderCreateInputSchema = z.object({
  quoteId: z.string().min(1),
  walletId: createIdSchema<"wallet">(),
  network: networkSchema,
  collector: collectorDataSchema,
}) satisfies z.ZodType<OrderCreateInput>;

/** Schema para recibo imutável. */
export const receiptSchema = z.object({
  lines: z.array(quoteLineSchema),
  subtotal: ethStringSchema,
  discount: ethStringSchema,
  networkFee: ethStringSchema,
  total: ethStringSchema,
  network: networkSchema,
  walletAddress: z.string().min(1),
  txRef: z.string().min(1),
  explorerUrl: z.string().url(),
  collector: collectorDataSchema,
}) satisfies z.ZodType<Receipt>;

/** Schema para status do pedido. */
export const orderStatusSchema = z.enum([
  "pending",
  "confirmed",
  "declined",
]) satisfies z.ZodType<OrderStatus>;

/** Schema para pedido de compra. */
export const orderSchema = z.object({
  id: createIdSchema<"order">(),
  userId: createIdSchema<"user">(),
  status: orderStatusSchema,
  version: z.number().int().nonnegative(),
  snapshot: receiptSchema,
  declineReason: z.string().optional(),
  createdAt: isoDateSchema,
  settledAt: isoDateSchema.optional(),
}) satisfies z.ZodType<Order>;
