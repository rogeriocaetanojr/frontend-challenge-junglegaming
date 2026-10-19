/**
 * Barramento de eventos tipado para o ecossistema em tempo real do marketplace.
 *
 * Implementa emissão tipada estrita em conformidade com os contratos
 * `ServerToClientEvents` e `RealtimeEnvelope` definidos em `src/contracts/realtime.ts`.
 */
import type { OrderStatus } from "@/contracts/commerce";
import type { EthString, Id, IsoDate } from "@/contracts/common";
import type {
  NftUpdatedEvent,
  OrderUpdatedEvent,
  ServerToClientEvents,
} from "@/contracts/realtime";
import { db } from "@/mocks/db";

type EventListener<K extends keyof ServerToClientEvents> = ServerToClientEvents[K];

export class RealtimeEventEmitter {
  private listeners = new Map<
    keyof ServerToClientEvents,
    Set<EventListener<keyof ServerToClientEvents>>
  >();

  /**
   * Registra um listener para um evento emitido pelo servidor.
   * @returns Função de unsubscribe para cancelamento da inscrição.
   */
  public on<K extends keyof ServerToClientEvents>(
    event: K,
    listener: EventListener<K>,
  ): () => void {
    let set = this.listeners.get(event);
    if (!set) {
      set = new Set();
      this.listeners.set(event, set);
    }
    set.add(listener as EventListener<keyof ServerToClientEvents>);

    return () => {
      this.off(event, listener);
    };
  }

  /** Remove um listener previamente registrado. */
  public off<K extends keyof ServerToClientEvents>(
    event: K,
    listener: EventListener<K>,
  ): void {
    const set = this.listeners.get(event);
    if (set) {
      set.delete(listener as EventListener<keyof ServerToClientEvents>);
      if (set.size === 0) {
        this.listeners.delete(event);
      }
    }
  }

  /** Emite um evento para todos os ouvintes inscritos. */
  public emit<K extends keyof ServerToClientEvents>(
    event: K,
    ...args: Parameters<EventListener<K>>
  ): void {
    const set = this.listeners.get(event);
    if (set) {
      for (const listener of Array.from(set)) {
        try {
          (listener as (...a: unknown[]) => void)(...args);
        } catch (err) {
          console.error(`Erro ao processar listener do evento '${String(event)}':`, err);
        }
      }
    }
  }

  /** Limpa todos os listeners inscritos. */
  public removeAllListeners(): void {
    this.listeners.clear();
  }
}

/** Instância singleton do barramento de eventos em tempo real. */
export const realtimeEmitter = new RealtimeEventEmitter();

/**
 * Emite a atualização de preço e estoque de um NFT, atualizando o banco em memória
 * e despachando o envelope canônico `RealtimeEnvelope<'nft.updated', NftUpdatedPayload>`.
 */
export function emitNftUpdated(params: {
  nftId: string;
  price: EthString;
  available: number;
  version?: number;
}): NftUpdatedEvent {
  const nft = db.nfts.get(params.nftId);
  const nextVersion = params.version ?? (nft ? nft.version + 1 : 1);

  if (nft) {
    nft.price = params.price;
    nft.version = nextVersion;
    if (nft.editions[0]) {
      nft.editions[0].available = params.available;
      nft.editions[0].price = params.price;
    }
  }

  const event: NftUpdatedEvent = {
    eventId: `evt_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    type: "nft.updated",
    resource: {
      kind: "nft",
      id: params.nftId,
    },
    version: nextVersion,
    occurredAt: new Date().toISOString() as IsoDate,
    payload: {
      price: params.price,
      available: params.available,
    },
  };

  realtimeEmitter.emit("nft.updated", event);
  return event;
}

/**
 * Emite a mudança de status de um pedido, atualizando o banco em memória
 * e despachando o envelope canônico `RealtimeEnvelope<'order.updated', OrderUpdatedPayload>`.
 */
export function emitOrderUpdated(params: {
  orderId: string;
  status: OrderStatus;
  settledAt?: IsoDate;
  declineReason?: string;
  version?: number;
  userId?: Id<"user">;
}): OrderUpdatedEvent {
  const order = db.orders.get(params.orderId);
  const nextVersion = params.version ?? (order ? order.version + 1 : 1);
  const orderUserId = params.userId ?? order?.userId;

  if (order) {
    order.status = params.status;
    order.version = nextVersion;
    if (params.settledAt) {
      order.settledAt = params.settledAt;
    }
    if (params.declineReason) {
      order.declineReason = params.declineReason;
    }
  }

  const event: OrderUpdatedEvent = {
    eventId: `evt_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    type: "order.updated",
    resource: {
      kind: "order",
      id: params.orderId,
    },
    version: nextVersion,
    occurredAt: new Date().toISOString() as IsoDate,
    ...(orderUserId && { userId: orderUserId }),
    payload: {
      status: params.status,
      ...(params.settledAt && { settledAt: params.settledAt }),
      ...(params.declineReason && { declineReason: params.declineReason }),
    },
  };

  realtimeEmitter.emit("order.updated", event);
  return event;
}
