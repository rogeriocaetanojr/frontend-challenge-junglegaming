/**
 * Contratos de eventos em tempo real (Socket.IO).
 *
 * Todo evento de domínio trafega dentro de um `RealtimeEnvelope`, cujo
 * `version` permite descartar eventos antigos ou fora de ordem comparando
 * com a versão já conhecida do recurso (`Nft.version`, `Order.version`).
 */
import type { OrderStatus } from "@/contracts/commerce";
import type { EthString, Id, IsoDate } from "@/contracts/common";

/** Tipos de recurso que emitem eventos em tempo real. */
export type RealtimeResourceKind = "nft" | "order";

/** Referência ao recurso afetado pelo evento. */
export interface RealtimeResourceRef {
  kind: RealtimeResourceKind;
  id: string;
}

/** Envelope padrão de todo evento em tempo real. */
export interface RealtimeEnvelope<K extends string, P> {
  /** Identificador único do evento, usado para deduplicação. */
  eventId: string;
  type: K;
  resource: RealtimeResourceRef;
  /** Versão do recurso após o evento; eventos com versão menor ou igual à local são descartados. */
  version: number;
  occurredAt: IsoDate;
  /** Presente apenas em eventos direcionados a um usuário específico. */
  userId?: Id<"user">;
  payload: P;
}

/** Payload de atualização de preço/estoque de um NFT. */
export interface NftUpdatedPayload {
  price: EthString;
  available: number;
}

/** Payload de mudança de status de um pedido. */
export interface OrderUpdatedPayload {
  status: OrderStatus;
  settledAt?: IsoDate;
  declineReason?: string;
}

export type NftUpdatedEvent = RealtimeEnvelope<"nft.updated", NftUpdatedPayload>;

export type OrderUpdatedEvent = RealtimeEnvelope<"order.updated", OrderUpdatedPayload>;

/** Eventos emitidos pelo servidor e escutados pelo cliente. */
export interface ServerToClientEvents {
  "nft.updated": (event: NftUpdatedEvent) => void;
  "order.updated": (event: OrderUpdatedEvent) => void;
  "session.rejected": (data: { reason: string }) => void;
}

/** Eventos emitidos pelo cliente para o servidor. */
export interface ClientToServerEvents {
  "session.bind": (data: { token: string }) => void;
}
