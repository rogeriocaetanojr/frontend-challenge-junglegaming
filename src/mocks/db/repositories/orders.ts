/**
 * Repositório de pedidos (Order) no banco em memória.
 *
 * Centraliza as operações de leitura, filtragem por status, persistência
 * e máquina de estados de pedidos (`pending` -> `confirmed` / `declined`).
 */
import type { Order, OrderStatus } from "@/contracts/commerce";
import type { IsoDate } from "@/contracts/common";
import { db } from "@/mocks/db";

export interface OrderQueryFilters {
  userId?: string;
  status?: OrderStatus;
}

export const ordersRepository = {
  /**
   * Busca um pedido por identificador único.
   */
  findById(id: string): Order | undefined {
    return db.orders.get(id);
  },

  /**
   * Lista todos os pedidos com filtros opcionais por usuário e status.
   * Ordena por data decrescente de criação.
   */
  findAll(filters?: OrderQueryFilters): Order[] {
    let results = Array.from(db.orders.values());

    if (filters?.userId) {
      results = results.filter((order) => order.userId === filters.userId);
    }

    if (filters?.status) {
      results = results.filter((order) => order.status === filters.status);
    }

    return results.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  },

  /**
   * Lista pedidos associados a um usuário específico com filtro opcional de status.
   */
  findByUser(userId: string, status?: OrderStatus): Order[] {
    return this.findAll({ userId, status });
  },

  /**
   * Persiste um novo pedido no banco em memória.
   */
  create(order: Order): Order {
    db.orders.set(order.id, order);
    return order;
  },

  /**
   * Transiciona o status de um pedido (máquina de estados).
   */
  updateStatus(
    id: string,
    status: OrderStatus,
    details?: {
      declineReason?: string;
      settledAt?: IsoDate;
    },
  ): Order | undefined {
    const order = db.orders.get(id);
    if (!order) {
      return undefined;
    }

    order.status = status;
    order.version += 1;

    if (details?.settledAt) {
      order.settledAt = details.settledAt;
    } else if (status === "confirmed" || status === "declined") {
      order.settledAt = (order.settledAt ?? new Date().toISOString()) as IsoDate;
    }

    if (details?.declineReason) {
      order.declineReason = details.declineReason;
    }

    return order;
  },
};
