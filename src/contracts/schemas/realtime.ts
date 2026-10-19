/**
 * Schemas Zod para eventos em tempo real (Socket.IO).
 */
import { z } from "zod";

import type {
  NftUpdatedEvent,
  NftUpdatedPayload,
  OrderUpdatedEvent,
  OrderUpdatedPayload,
  RealtimeResourceKind,
  RealtimeResourceRef,
} from "@/contracts/realtime";
import { orderStatusSchema } from "@/contracts/schemas/commerce";
import {
  createIdSchema,
  ethStringSchema,
  isoDateSchema,
} from "@/contracts/schemas/common";

/** Schema para tipos de recurso que emitem eventos. */
export const realtimeResourceKindSchema = z.enum([
  "nft",
  "order",
]) satisfies z.ZodType<RealtimeResourceKind>;

/** Schema para referência de recurso em tempo real. */
export const realtimeResourceRefSchema = z.object({
  kind: realtimeResourceKindSchema,
  id: z.string().min(1),
}) satisfies z.ZodType<RealtimeResourceRef>;

/** Schema para payload do evento nft.updated. */
export const nftUpdatedPayloadSchema = z.object({
  price: ethStringSchema,
  available: z.number().int().nonnegative(),
}) satisfies z.ZodType<NftUpdatedPayload>;

/** Schema para payload do evento order.updated. */
export const orderUpdatedPayloadSchema = z.object({
  status: orderStatusSchema,
  settledAt: isoDateSchema.optional(),
  declineReason: z.string().optional(),
}) satisfies z.ZodType<OrderUpdatedPayload>;

/** Schema para evento completo nft.updated. */
export const nftUpdatedEventSchema = z.object({
  eventId: z.string().min(1),
  type: z.literal("nft.updated"),
  resource: realtimeResourceRefSchema,
  version: z.number().int().nonnegative(),
  occurredAt: isoDateSchema,
  userId: createIdSchema<"user">().optional(),
  payload: nftUpdatedPayloadSchema,
}) satisfies z.ZodType<NftUpdatedEvent>;

/** Schema para evento completo order.updated. */
export const orderUpdatedEventSchema = z.object({
  eventId: z.string().min(1),
  type: z.literal("order.updated"),
  resource: realtimeResourceRefSchema,
  version: z.number().int().nonnegative(),
  occurredAt: isoDateSchema,
  userId: createIdSchema<"user">().optional(),
  payload: orderUpdatedPayloadSchema,
}) satisfies z.ZodType<OrderUpdatedEvent>;
