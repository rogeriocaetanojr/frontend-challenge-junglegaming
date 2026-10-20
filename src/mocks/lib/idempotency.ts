/**
 * Módulo de idempotência para criação de pedidos e prevenção de requisições duplicadas.
 *
 * Implementa serialização canônica estável e cálculo de hash criptográfico SHA-256 via WebCrypto,
 * associando (userId, idempotencyKey) aos registros persistidos em `db.idempotency`.
 */
import type { IsoDate } from "@/contracts/common";
import { db, type IdempotencyRecord } from "@/mocks/db";

/**
 * Serializa um valor de forma recursivamente ordenada e determinística
 * para garantir que objetos com chaves em ordens diferentes gerem a mesma string JSON.
 */
export function stableStringify(value: unknown): string {
  if (value === null || typeof value !== "object") {
    return JSON.stringify(value);
  }

  if (Array.isArray(value)) {
    return `[${value.map(stableStringify).join(",")}]`;
  }

  const record = value as Record<string, unknown>;
  const sortedKeys = Object.keys(record).sort();
  const serializedEntries = sortedKeys.map(
    (key) => `${JSON.stringify(key)}:${stableStringify(record[key])}`,
  );

  return `{${serializedEntries.join(",")}}`;
}

/**
 * Gera o hash canônico SHA-256 hexadecimal a partir de qualquer payload serializável
 * utilizando a API nativa WebCrypto (crypto.subtle).
 */
export async function computeCanonicalHash(payload: unknown): Promise<string> {
  const canonicalString = stableStringify(payload);
  const encoder = new TextEncoder();
  const data = encoder.encode(canonicalString);

  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

/** Chave de indexação composta por usuário e chave de idempotência. */
export function buildIdempotencyLookupKey(
  userId: string,
  idempotencyKey: string,
): string {
  return `${userId.trim()}:${idempotencyKey.trim()}`;
}

/**
 * Consulta um registro prévio de idempotência no banco em memória.
 */
export function findIdempotencyRecord(
  userId: string,
  idempotencyKey: string,
): IdempotencyRecord | undefined {
  const lookupKey = buildIdempotencyLookupKey(userId, idempotencyKey);
  return db.idempotency.get(lookupKey);
}

/**
 * Armazena um novo registro de idempotência no banco em memória.
 */
export function saveIdempotencyRecord(params: {
  userId: string;
  key: string;
  requestHash: string;
  orderId: string;
}): IdempotencyRecord {
  const lookupKey = buildIdempotencyLookupKey(params.userId, params.key);
  const record: IdempotencyRecord = {
    userId: params.userId,
    key: params.key,
    requestHash: params.requestHash,
    orderId: params.orderId,
    createdAt: new Date().toISOString() as IsoDate,
  };

  db.idempotency.set(lookupKey, record);
  return record;
}

/**
 * Limpa todos os registros de idempotência.
 */
export function clearIdempotencyRecords(): void {
  db.idempotency.clear();
}
