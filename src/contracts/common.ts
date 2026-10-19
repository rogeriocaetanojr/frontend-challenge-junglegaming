/**
 * Primitivas de contrato compartilhadas entre a camada de API e o domínio.
 *
 * Os branded types abaixo existem apenas em tempo de compilação: em runtime
 * continuam sendo `string`, mas impedem que valores não validados (ou de
 * outra natureza) sejam passados onde um contrato específico é exigido.
 */

/** String decimal não negativa representando um valor em ETH (ex.: `"1.25"`). */
export type EthString = string & { readonly __brand: "EthString" };

/** Representação textual de uma data no formato ISO 8601. */
export type IsoDate = string & { readonly __brand: "IsoDate" };

/** Identificador de entidade tipado pelo seu tipo (`Id<"nft">`, `Id<"order">`...). */
export type Id<K extends string> = string & { readonly __kind: K };

/** Envelope padrão de respostas paginadas. */
export interface Page<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

/** Códigos de erro estritos retornados pela API. */
export type ApiErrorCode =
  | "validation_error"
  | "unauthorized"
  | "session_expired"
  | "forbidden"
  | "not_found"
  | "conflict_availability"
  | "conflict_price_changed"
  | "conflict_version_mismatch"
  | "idempotency_conflict"
  | "email_taken"
  | "coupon_invalid"
  | "coupon_expired"
  | "transient_failure";

/** Corpo padronizado de erro devolvido pela API. */
export interface ApiErrorBody {
  code: ApiErrorCode;
  message: string;
  fieldErrors?: Record<string, string[]>;
  requestId?: string;
}

/**
 * Decimal não negativo sem sinal, sem notação científica e sem zeros à
 * esquerda supérfluos. Aceita: `"0"`, `"1"`, `"0.5"`, `"12.000001"`.
 * Rejeita: `""`, `"-1"`, `"1."`, `".5"`, `"01"`, `"1e3"`, `" 1"`.
 */
const ETH_DECIMAL_PATTERN = /^(?:0|[1-9]\d*)(?:\.\d+)?$/;

/** Type guard: verifica se o valor é uma string decimal de ETH válida. */
export function isEthString(value: unknown): value is EthString {
  return typeof value === "string" && ETH_DECIMAL_PATTERN.test(value);
}

/**
 * Construtor seguro de `EthString`.
 * @throws {TypeError} quando o valor não é um decimal não negativo válido.
 */
export function asEthString(value: string): EthString {
  if (!isEthString(value)) {
    throw new TypeError(`Valor ETH inválido: "${value}"`);
  }
  return value;
}

/**
 * Construtor seguro de `Id<K>`.
 * @throws {TypeError} quando o identificador é vazio ou contém apenas espaços.
 */
export function asId<K extends string>(value: string): Id<K> {
  if (value.trim().length === 0) {
    throw new TypeError("Identificador de entidade não pode ser vazio");
  }
  return value as Id<K>;
}
