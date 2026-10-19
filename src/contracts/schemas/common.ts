/**
 * Schemas Zod para primitivas comuns de contrato.
 */
import { z } from "zod";

import type {
  ApiErrorBody,
  ApiErrorCode,
  EthString,
  Id,
  IsoDate,
  Page,
} from "@/contracts/common";

const ETH_DECIMAL_PATTERN = /^(?:0|[1-9]\d*)(?:\.\d+)?$/;
const ISO_DATE_PATTERN =
  /^\d{4}-\d{2}-\d{2}(?:T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:?\d{2})?)?$/;

/** Validador de string decimal de ETH estrita. */
export const ethStringSchema = z
  .string()
  .regex(
    ETH_DECIMAL_PATTERN,
    "Valor ETH decimal inválido",
  ) as unknown as z.ZodType<EthString>;

/** Validador de representação de data em formato ISO. */
export const isoDateSchema = z
  .string()
  .regex(ISO_DATE_PATTERN, "Data ISO inválida") as unknown as z.ZodType<IsoDate>;

/** Construtor de schema Zod para identificadores tipados Id<K>. */
export function createIdSchema<K extends string>(): z.ZodType<Id<K>> {
  return z
    .string()
    .trim()
    .min(1, "Identificador não pode ser vazio") as unknown as z.ZodType<Id<K>>;
}

/** Schema genérico para identificadores Id<string>. */
export const idSchema = createIdSchema<string>();

/** Schema para códigos de erro da API. */
export const apiErrorCodeSchema = z.enum([
  "validation_error",
  "unauthorized",
  "session_expired",
  "forbidden",
  "not_found",
  "conflict_availability",
  "conflict_price_changed",
  "conflict_version_mismatch",
  "idempotency_conflict",
  "email_taken",
  "coupon_invalid",
  "coupon_expired",
  "transient_failure",
]) satisfies z.ZodType<ApiErrorCode>;

/** Schema para corpo de erro da API. */
export const apiErrorBodySchema = z.object({
  code: apiErrorCodeSchema,
  message: z.string(),
  fieldErrors: z.record(z.string(), z.array(z.string())).optional(),
  requestId: z.string().optional(),
}) satisfies z.ZodType<ApiErrorBody>;

/** Construtor de schema para envelopes de paginação Page<T>. */
export function createPageSchema<T>(itemSchema: z.ZodType<T>): z.ZodType<Page<T>> {
  return z.object({
    items: z.array(itemSchema),
    total: z.number().int().nonnegative(),
    page: z.number().int().positive(),
    pageSize: z.number().int().positive(),
    totalPages: z.number().int().nonnegative(),
  }) satisfies z.ZodType<Page<T>>;
}
