/**
 * Testes de integração do servidor Socket.IO simulado (MSW ws.link + @mswjs/socket.io-binding).
 *
 * Usa `WebSocket` global (interceptado pelo MSW) falando o protocolo de fiação
 * Engine.IO/Socket.IO diretamente: em Node, `socket.io-client` sempre usa o
 * pacote `ws` (nunca o `WebSocket` global), então não é interceptável fora do
 * navegador — o cliente real (`src/lib/realtime/client.ts`) roda sobre o
 * `WebSocket` nativo do browser, que é exatamente o que este teste simula.
 */
import { setupServer } from "msw/node";
import { Encoder, Decoder, PacketType } from "socket.io-parser";
import {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

import { asEthString, asId } from "@/contracts/common";
import { db, resetDb } from "@/mocks/db";
import { emitNftUpdated, emitOrderUpdated, realtimeEmitter } from "@/mocks/realtime";
import {
  realtimeSocketHandlers,
  setupRealtimeSocketBridge,
} from "@/mocks/realtime/socket-server";

const server = setupServer(...realtimeSocketHandlers);
const encoder = new Encoder();

function send(socket: WebSocket, event: string, ...data: unknown[]): void {
  for (const packet of encoder.encode({
    type: PacketType.EVENT,
    nsp: "/",
    data: [event, ...data],
  })) {
    socket.send(`4${packet}`);
  }
}

function listen(
  socket: WebSocket,
  event: string,
  handler: (...data: unknown[]) => void,
): void {
  const decoder = new Decoder();
  decoder.on("decoded", (packet) => {
    if (packet.type === PacketType.EVENT && packet.data[0] === event) {
      handler(...packet.data.slice(1));
    }
  });
  socket.addEventListener("message", (e) => {
    if (typeof e.data === "string" && e.data.startsWith("4")) {
      decoder.add(e.data.slice(1));
    }
  });
}

function connect(): Promise<WebSocket> {
  return new Promise((resolve) => {
    const socket = new WebSocket("ws://localhost/socket.io/?EIO=4&transport=websocket");
    socket.addEventListener("open", () => resolve(socket));
  });
}

describe("Realtime Socket.IO simulado (src/mocks/realtime)", () => {
  beforeAll(() => server.listen());
  afterAll(() => server.close());

  beforeEach(() => {
    resetDb();
    realtimeEmitter.removeAllListeners();
    setupRealtimeSocketBridge();
  });

  afterEach(() => {
    resetDb();
    realtimeEmitter.removeAllListeners();
    setupRealtimeSocketBridge();
    server.resetHandlers(...realtimeSocketHandlers);
    vi.restoreAllMocks();
  });

  it("deve emitir envelope canônico via nft.updated e persistir no banco em memória", async () => {
    const socket = await connect();
    const listener = vi.fn();
    listen(socket, "nft.updated", listener);

    emitNftUpdated({ nftId: "nft-1", price: asEthString("2.45"), available: 15 });

    await vi.waitFor(() => expect(listener).toHaveBeenCalledTimes(1));

    const received = listener.mock.calls[0]![0] as {
      type: string;
      resource: unknown;
      payload: unknown;
    };
    expect(received.type).toBe("nft.updated");
    expect(received.resource).toEqual({ kind: "nft", id: "nft-1" });
    expect(received.payload).toEqual({ price: "2.45", available: 15 });

    const nft = db.nfts.get("nft-1");
    expect(nft?.price).toBe("2.45");

    socket.close();
  });

  it("deve associar socket ao usuário via session.bind e rotear order.updated", async () => {
    const socketDemo = await connect();
    const socketOther = await connect();

    send(socketDemo, "session.bind", { token: "mock-token-user_demo" });

    const demoListener = vi.fn();
    const otherListener = vi.fn();
    listen(socketDemo, "order.updated", demoListener);
    listen(socketOther, "order.updated", otherListener);

    await new Promise((resolve) => setTimeout(resolve, 20));

    emitOrderUpdated({
      orderId: "order_test_123",
      status: "confirmed",
      userId: asId<"user">("user_demo"),
    });

    await vi.waitFor(() => expect(demoListener).toHaveBeenCalledTimes(1));
    expect(otherListener).not.toHaveBeenCalled();

    socketDemo.close();
    socketOther.close();
  });

  it("deve emitir session.rejected para token inválido", async () => {
    const socket = await connect();
    const rejectedListener = vi.fn();
    listen(socket, "session.rejected", rejectedListener);

    send(socket, "session.bind", { token: "token_falso_invalido" });

    await vi.waitFor(() => expect(rejectedListener).toHaveBeenCalledTimes(1));
    expect((rejectedListener.mock.calls[0]![0] as { reason: string }).reason).toContain(
      "inválido",
    );

    socket.close();
  });
});
