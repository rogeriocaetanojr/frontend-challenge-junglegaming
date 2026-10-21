/**
 * Ponto de entrada do módulo de eventos em tempo real (Socket.IO / WebSockets).
 */
export * from "./emitter";
export {
  realtimeSocket,
  realtimeSocketHandlers,
  setupRealtimeSocketBridge,
} from "./socket-server";
