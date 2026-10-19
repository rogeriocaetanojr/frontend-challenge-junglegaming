/**
 * Testes unitários do barramento de eventos e servidor simulado Socket.IO (src/mocks/realtime).
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { asEthString, asId } from "@/contracts/common";
import type { NftUpdatedEvent, OrderUpdatedEvent } from "@/contracts/realtime";
import { db, resetDb } from "@/mocks/db";
import {
  emitNftUpdated,
  emitOrderUpdated,
  mockSocketServer,
  realtimeEmitter,
} from "@/mocks/realtime";

describe("Realtime Socket and Emitter (src/mocks/realtime)", () => {
  beforeEach(() => {
    resetDb();
    realtimeEmitter.removeAllListeners();
    mockSocketServer.reset();
  });

  afterEach(() => {
    resetDb();
    realtimeEmitter.removeAllListeners();
    mockSocketServer.reset();
    vi.restoreAllMocks();
  });

  describe("emitNftUpdated e broadcast", () => {
    it("deve emitir envelope canônico e notificar clientes subscritos", () => {
      const socket = mockSocketServer.createMockSocket();
      const listener = vi.fn();

      socket.on("nft.updated", listener);

      const event = emitNftUpdated({
        nftId: "nft-1",
        price: asEthString("2.45"),
        available: 15,
      });

      expect(listener).toHaveBeenCalledTimes(1);
      const receivedEvent = listener.mock.calls[0]![0] as NftUpdatedEvent;

      // Validação da anatomia do RealtimeEnvelope
      expect(receivedEvent.eventId).toBe(event.eventId);
      expect(receivedEvent.type).toBe("nft.updated");
      expect(receivedEvent.resource).toEqual({ kind: "nft", id: "nft-1" });
      expect(receivedEvent.version).toBeGreaterThanOrEqual(2);
      expect(new Date(receivedEvent.occurredAt).getTime()).toBeLessThanOrEqual(
        Date.now(),
      );
      expect(receivedEvent.payload).toEqual({
        price: "2.45",
        available: 15,
      });

      // Valida persistência no banco em memória
      const nft = db.nfts.get("nft-1");
      expect(nft?.price).toBe("2.45");
      expect(nft?.editions[0]?.available).toBe(15);
    });

    it("deve fazer broadcast para múltiplos sockets conectados", () => {
      const socket1 = mockSocketServer.createMockSocket();
      const socket2 = mockSocketServer.createMockSocket();

      const listener1 = vi.fn();
      const listener2 = vi.fn();

      socket1.on("nft.updated", listener1);
      socket2.on("nft.updated", listener2);

      emitNftUpdated({
        nftId: "nft-2",
        price: asEthString("1.99"),
        available: 5,
      });

      expect(listener1).toHaveBeenCalledTimes(1);
      expect(listener2).toHaveBeenCalledTimes(1);
    });
  });

  describe("session.bind e roteamento direcionado de pedidos", () => {
    it("deve associar socket ao usuário via session.bind com token válido", () => {
      const socket = mockSocketServer.createMockSocket();
      expect(socket.userId).toBeUndefined();

      socket.emit("session.bind", { token: "mock-token-user_demo" });

      expect(socket.userId).toBe("user_demo");
    });

    it("deve emitir session.rejected quando token for inválido", () => {
      const socket = mockSocketServer.createMockSocket();
      const rejectedListener = vi.fn();

      socket.on("session.rejected", rejectedListener);

      socket.emit("session.bind", { token: "token_falso_invalido" });

      expect(socket.userId).toBeUndefined();
      expect(rejectedListener).toHaveBeenCalledTimes(1);
      expect(rejectedListener.mock.calls[0]![0].reason).toContain("inválido");
    });

    it("deve despachar order.updated apenas para o socket do usuário correspondente", () => {
      const socketDemo = mockSocketServer.createMockSocket();
      const socketOther = mockSocketServer.createMockSocket();

      socketDemo.emit("session.bind", { token: "mock-token-user_demo" });

      const demoListener = vi.fn();
      const otherListener = vi.fn();

      socketDemo.on("order.updated", demoListener);
      socketOther.on("order.updated", otherListener);

      emitOrderUpdated({
        orderId: "order_test_123",
        status: "confirmed",
        userId: asId<"user">("user_demo"),
      });

      expect(demoListener).toHaveBeenCalledTimes(1);
      expect(otherListener).not.toHaveBeenCalled();

      const received = demoListener.mock.calls[0]![0] as OrderUpdatedEvent;
      expect(received.type).toBe("order.updated");
      expect(received.resource).toEqual({
        kind: "order",
        id: "order_test_123",
      });
      expect(received.userId).toBe("user_demo");
      expect(received.payload.status).toBe("confirmed");
    });
  });

  describe("ciclo de vida e desconexão de socket", () => {
    it("não deve receber eventos após socket.disconnect()", () => {
      const socket = mockSocketServer.createMockSocket();
      const listener = vi.fn();

      socket.on("nft.updated", listener);
      expect(mockSocketServer.activeConnectionsCount).toBe(1);

      socket.disconnect();
      expect(socket.connected).toBe(false);
      expect(mockSocketServer.activeConnectionsCount).toBe(0);

      emitNftUpdated({
        nftId: "nft-1",
        price: asEthString("3.00"),
        available: 1,
      });

      expect(listener).not.toHaveBeenCalled();
    });

    it("deve permitir unsubscribe através da função de retorno do emitter", () => {
      const listener = vi.fn();
      const unsubscribe = realtimeEmitter.on("nft.updated", listener);

      emitNftUpdated({
        nftId: "nft-1",
        price: asEthString("1.50"),
        available: 10,
      });
      expect(listener).toHaveBeenCalledTimes(1);

      unsubscribe();

      emitNftUpdated({
        nftId: "nft-1",
        price: asEthString("1.60"),
        available: 9,
      });
      expect(listener).toHaveBeenCalledTimes(1); // Não foi chamado novamente
    });
  });
});
