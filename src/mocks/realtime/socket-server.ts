/**
 * Servidor simulado de Socket.IO para eventos em tempo real.
 *
 * Implementa conexão virtual, multiplexação de clientes, vinculação de sessão (session.bind)
 * e entrega direcionada ou broadcast conforme os contratos de `src/contracts/realtime.ts`.
 */
import type { Id } from "@/contracts/common";
import type {
  ClientToServerEvents,
  NftUpdatedEvent,
  OrderUpdatedEvent,
  ServerToClientEvents,
} from "@/contracts/realtime";
import { db, type DbUser, dbHelpers } from "@/mocks/db";
import { realtimeEmitter } from "./emitter";

/** Representa a conexão de um cliente individual com o servidor de sockets. */
export class MockSocket {
  public readonly id: string;
  public userId?: Id<"user">;
  public connected: boolean = true;
  private server: MockSocketServer;

  private listeners = new Map<
    keyof ServerToClientEvents,
    Set<ServerToClientEvents[keyof ServerToClientEvents]>
  >();

  constructor(id: string, server: MockSocketServer) {
    this.id = id;
    this.server = server;
  }

  /** Registra ouvinte para evento enviado do servidor para o cliente. */
  public on<K extends keyof ServerToClientEvents>(
    event: K,
    listener: ServerToClientEvents[K],
  ): this {
    let set = this.listeners.get(event);
    if (!set) {
      set = new Set();
      this.listeners.set(event, set);
    }
    set.add(listener as ServerToClientEvents[keyof ServerToClientEvents]);
    return this;
  }

  /** Remove ouvinte de evento. */
  public off<K extends keyof ServerToClientEvents>(
    event: K,
    listener: ServerToClientEvents[K],
  ): this {
    const set = this.listeners.get(event);
    if (set) {
      set.delete(listener as ServerToClientEvents[keyof ServerToClientEvents]);
    }
    return this;
  }

  /** Emite evento do cliente para o servidor. */
  public emit<K extends keyof ClientToServerEvents>(
    event: K,
    ...args: Parameters<ClientToServerEvents[K]>
  ): this {
    if (!this.connected) {
      return this;
    }
    this.server.handleClientEvent(this, event, ...args);
    return this;
  }

  /** Encerra a conexão virtual do socket. */
  public disconnect(): void {
    if (!this.connected) {
      return;
    }
    this.connected = false;
    this.server.removeSocket(this.id);
  }

  /** Entrega interna de evento disparado pelo servidor para os ouvintes deste cliente. */
  public receiveFromServer<K extends keyof ServerToClientEvents>(
    event: K,
    ...args: Parameters<ServerToClientEvents[K]>
  ): void {
    if (!this.connected) {
      return;
    }
    const set = this.listeners.get(event);
    if (set) {
      for (const listener of Array.from(set)) {
        try {
          (listener as (...a: unknown[]) => void)(...args);
        } catch (err) {
          console.error(
            `Erro ao processar evento '${String(event)}' no socket '${this.id}':`,
            err,
          );
        }
      }
    }
  }
}

/** Servidor central simulador de conexões Socket.IO. */
export class MockSocketServer {
  private sockets = new Map<string, MockSocket>();

  constructor() {
    this.setupEmitterBridge();
  }

  private onNftUpdated = (event: NftUpdatedEvent): void => {
    this.broadcast("nft.updated", event);
  };

  private onOrderUpdated = (event: OrderUpdatedEvent): void => {
    if (event.userId) {
      this.sendToUser(event.userId, "order.updated", event);
    } else {
      this.broadcast("order.updated", event);
    }
  };

  /** Conecta o barramento de eventos de domínio ao despacho de sockets. */
  public setupEmitterBridge(): void {
    realtimeEmitter.off("nft.updated", this.onNftUpdated);
    realtimeEmitter.off("order.updated", this.onOrderUpdated);
    realtimeEmitter.on("nft.updated", this.onNftUpdated);
    realtimeEmitter.on("order.updated", this.onOrderUpdated);
  }

  /** Cria e registra uma nova conexão de socket cliente virtual. */
  public createMockSocket(): MockSocket {
    const id = `sock_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const socket = new MockSocket(id, this);
    this.sockets.set(id, socket);
    return socket;
  }

  /** Processa eventos enviados por clientes conectados. */
  public handleClientEvent<K extends keyof ClientToServerEvents>(
    socket: MockSocket,
    event: K,
    ...args: Parameters<ClientToServerEvents[K]>
  ): void {
    if (event === "session.bind") {
      const data = args[0] as { token: string };
      const user = this.resolveUserFromToken(data.token);
      if (user) {
        socket.userId = user.id;
      } else {
        socket.receiveFromServer("session.rejected", {
          reason: "Token de sessão inválido ou expirado.",
        });
      }
    }
  }

  private resolveUserFromToken(token: string): DbUser | null {
    if (!token) {
      return null;
    }
    const cleanToken = token.startsWith("Bearer ") ? token.slice(7).trim() : token.trim();

    if (cleanToken.startsWith("mock-token-")) {
      const remainder = cleanToken.slice("mock-token-".length);
      for (const user of db.users.values()) {
        if (remainder.startsWith(user.id)) {
          return user;
        }
      }
    }

    const directUser = dbHelpers.findUserById(cleanToken);
    if (directUser) {
      return directUser;
    }

    if (cleanToken.toLowerCase().includes("demo")) {
      return dbHelpers.findUserById("user_demo") ?? null;
    }

    return null;
  }

  /** Envia um evento para todos os clientes conectados. */
  public broadcast<K extends keyof ServerToClientEvents>(
    event: K,
    ...args: Parameters<ServerToClientEvents[K]>
  ): void {
    for (const socket of this.sockets.values()) {
      socket.receiveFromServer(event, ...args);
    }
  }

  /** Envia um evento apenas para os clientes vinculados a um usuário específico. */
  public sendToUser<K extends keyof ServerToClientEvents>(
    userId: Id<"user"> | undefined,
    event: K,
    ...args: Parameters<ServerToClientEvents[K]>
  ): void {
    if (!userId) {
      this.broadcast(event, ...args);
      return;
    }
    for (const socket of this.sockets.values()) {
      if (socket.userId === userId) {
        socket.receiveFromServer(event, ...args);
      }
    }
  }

  public removeSocket(id: string): void {
    this.sockets.delete(id);
  }

  /** Retorna a quantidade de conexões ativas. */
  public get activeConnectionsCount(): number {
    return this.sockets.size;
  }

  /** Encerra todas as conexões e limpa o estado. */
  public reset(): void {
    for (const socket of this.sockets.values()) {
      socket.connected = false;
    }
    this.sockets.clear();
    this.setupEmitterBridge();
  }
}

/** Instância singleton do servidor simulado de sockets. */
export const mockSocketServer = new MockSocketServer();
