/**
 * Cliente Socket.IO real, ligado ao ciclo de vida da aplicação e ao cache do TanStack Query.
 *
 * Conecta no login/hidratação de sessão e desconecta no logout. Deduplica eventos
 * por `eventId`/`version` e revalida o cache ao reconectar.
 */
import type { QueryClient } from "@tanstack/react-query";
import { io, type Socket } from "socket.io-client";

import type { NftUpdatedEvent, OrderUpdatedEvent } from "@/contracts/realtime";
import { authEventBus } from "@/lib/auth/events";
import { getAuthToken } from "@/lib/http";
import { cartQueryKey } from "@/features/cart/api";
import { queryKeys } from "@/lib/query/keys";

const SOCKET_URL = import.meta.env.VITE_REALTIME_URL ?? "ws://localhost";

let socket: Socket | null = null;
const seenVersions = new Map<string, number>();

/** Descarta eventos repetidos (mesmo `eventId`) ou desatualizados (`version` <= conhecida). */
function isStale(resourceId: string, eventId: string, version: number): boolean {
  const key = `${resourceId}:${eventId}`;
  if (seenVersions.has(key)) return true;

  const versionKey = `version:${resourceId}`;
  const knownVersion = seenVersions.get(versionKey) ?? 0;
  if (version <= knownVersion) return true;

  seenVersions.set(key, version);
  seenVersions.set(versionKey, version);
  return false;
}

function bindQueryInvalidation(queryClient: QueryClient): void {
  socket?.on("nft.updated", (event: NftUpdatedEvent) => {
    if (isStale(event.resource.id, event.eventId, event.version)) return;

    void queryClient.invalidateQueries({ queryKey: queryKeys.public.catalog.all() });
    void queryClient.invalidateQueries({
      queryKey: queryKeys.public.catalog.detail(event.resource.id),
    });
    void queryClient.invalidateQueries({ queryKey: cartQueryKey(null) });
    void queryClient.invalidateQueries({
      queryKey: ["user"],
      predicate: (q) => q.queryKey[2] === "cart",
    });
  });

  socket?.on("order.updated", (event: OrderUpdatedEvent) => {
    if (isStale(event.resource.id, event.eventId, event.version)) return;

    if (event.userId) {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.user(event.userId).orders.all(),
      });
    }
  });

  socket?.on("connect", () => {
    const token = getAuthToken();
    if (token) socket?.emit("session.bind", { token });
    void queryClient.invalidateQueries();
  });
}

/** Inicia a conexão realtime e a vincula ao `queryClient` informado. */
export function connectRealtime(queryClient: QueryClient): Socket {
  if (socket?.connected) return socket;

  socket = io(SOCKET_URL, {
    path: "/socket.io/",
    transports: ["websocket"],
    autoConnect: true,
  });

  bindQueryInvalidation(queryClient);
  return socket;
}

/** Encerra a conexão realtime (chamado no logout). */
export function disconnectRealtime(): void {
  socket?.disconnect();
  socket = null;
  seenVersions.clear();
}

/** Registra os handlers de ciclo de vida de autenticação para conectar/desconectar o socket. */
export function setupRealtimeLifecycle(queryClient: QueryClient): () => void {
  const offLogin = authEventBus.on("auth:login", () => {
    connectRealtime(queryClient);
  });
  const offLogout = authEventBus.on("auth:logout", () => {
    disconnectRealtime();
  });

  return () => {
    offLogin();
    offLogout();
  };
}
