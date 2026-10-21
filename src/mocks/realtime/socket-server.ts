/**
 * Servidor Socket.IO simulado via MSW `ws.link` + `@mswjs/socket.io-binding`.
 *
 * Substitui o antigo EventEmitter isolado: agora o transporte real Socket.IO
 * (protocolo de handshake/engine.io) é interceptado pelo MSW, validando a
 * integração ponta a ponta do cliente real `socket.io-client`.
 */
import { toSocketIo } from "@mswjs/socket.io-binding";
import { ws } from "msw";

import type { Id } from "@/contracts/common";
import type { NftUpdatedEvent, OrderUpdatedEvent } from "@/contracts/realtime";
import { db, type DbUser, dbHelpers } from "@/mocks/db";
import { realtimeEmitter } from "./emitter";

// Nota: o path-to-regexp usado pelo MSW não casa de forma confiável o segmento
// literal "socket.io" (ponto em nome de path); interceptamos via wildcard e
// deixamos o binding Socket.IO (protocolo engine.io) validar o restante.
export const realtimeSocket = ws.link("ws://localhost/*");

interface BoundConnection {
  userId?: Id<"user">;
  emit: (event: string, payload: unknown) => void;
}

const connections = new Set<BoundConnection>();

function resolveUserFromToken(token: string): DbUser | null {
  if (!token) return null;
  const cleanToken = token.startsWith("Bearer ") ? token.slice(7).trim() : token.trim();

  if (cleanToken.startsWith("mock-token-")) {
    const remainder = cleanToken.slice("mock-token-".length);
    for (const user of db.users.values()) {
      if (remainder.startsWith(user.id)) return user;
    }
  }

  const directUser = dbHelpers.findUserById(cleanToken);
  if (directUser) return directUser;

  if (cleanToken.toLowerCase().includes("demo")) {
    return dbHelpers.findUserById("user_demo") ?? null;
  }

  return null;
}

function broadcast(
  event: "nft.updated" | "order.updated",
  payload: unknown,
  userId?: Id<"user">,
): void {
  for (const connection of connections) {
    if (userId && connection.userId !== userId) continue;
    connection.emit(event, payload);
  }
}

const onNftUpdated = (event: NftUpdatedEvent): void => broadcast("nft.updated", event);
const onOrderUpdated = (event: OrderUpdatedEvent): void =>
  broadcast("order.updated", event, event.userId);

/** (Re)conecta o barramento de eventos de domínio ao despacho de sockets; idempotente. */
export function setupRealtimeSocketBridge(): void {
  realtimeEmitter.off("nft.updated", onNftUpdated);
  realtimeEmitter.off("order.updated", onOrderUpdated);
  realtimeEmitter.on("nft.updated", onNftUpdated);
  realtimeEmitter.on("order.updated", onOrderUpdated);
}

setupRealtimeSocketBridge();

export const realtimeSocketHandlers = [
  realtimeSocket.addEventListener("connection", (handlerConnection) => {
    const io = toSocketIo(handlerConnection);
    const connection: BoundConnection = {
      emit: (event, payload) => io.client.emit(event, payload),
    };
    connections.add(connection);

    io.client.on("session.bind", (_event, data: { token: string }) => {
      const user = resolveUserFromToken(data?.token ?? "");
      if (user) {
        connection.userId = user.id;
      } else {
        io.client.emit("session.rejected", {
          reason: "Token de sessão inválido ou expirado.",
        });
      }
    });

    handlerConnection.client.addEventListener("close", () => {
      connections.delete(connection);
    });
  }),
];
