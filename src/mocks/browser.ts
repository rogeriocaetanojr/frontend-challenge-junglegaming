import type { StartOptions } from "msw/browser";
import { setupWorker } from "msw/browser";

import { saveIdentity } from "./db";
import { handlers } from "./handlers";
import { emitNftUpdated, emitOrderUpdated, realtimeEmitter } from "./realtime/emitter";
import {
  dropRealtimeConnections,
  hasBoundRealtimeConnection,
  realtimeDeliveries,
} from "./realtime/socket-server";
import { scenarioEngine } from "./scenarios";

export const worker = setupWorker(...handlers);

// Perfil, sessões e carteiras persistem após cada resposta simulada (sustenta o refresh)
worker.events.on("response:mocked", saveIdentity);

/**
 * Inicializa o Mock Service Worker no navegador com configurações resilientes
 * para desenvolvimento e validação em build de produção.
 */
export async function startWorker(options?: StartOptions) {
  // Gatilhos de eventos do servidor simulado, usados pelos testes E2E de tempo real.
  // Os eventos seguem pelo transporte Socket.IO (MSW) até o `socket.io-client`.
  Object.assign(window, {
    __mockScenario: scenarioEngine,
    __mockRealtime: {
      emitNftUpdated,
      emitOrderUpdated,
      replay: (event: Parameters<typeof realtimeEmitter.emit<"nft.updated">>[1]) =>
        realtimeEmitter.emit("nft.updated", event),
      dropConnections: dropRealtimeConnections,
      isBound: hasBoundRealtimeConnection,
      deliveries: realtimeDeliveries,
    },
  });
  return worker.start({
    onUnhandledFrame: "bypass",
    ...({ onUnhandledRequest: "bypass" } as Record<string, unknown>),
    serviceWorker: {
      url: "/mockServiceWorker.js",
    },
    ...options,
  });
}
