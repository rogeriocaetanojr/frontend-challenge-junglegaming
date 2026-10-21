import { http, HttpResponse } from "msw";

import { cartHandlers } from "./cart.handlers";
import { catalogHandlers } from "./catalog.handlers";
import { checkoutHandlers } from "./checkout.handlers";
import { identityHandlers } from "./identity.handlers";
import { orderHandlers } from "./order.handlers";
import { profileHandlers } from "./profile";
import { quoteHandlers } from "./quote.handlers";
import { walletsHandlers } from "./wallets";
import { realtimeSocketHandlers } from "@/mocks/realtime/socket-server";

export * from "./cart.handlers";
export * from "./catalog.handlers";
export * from "./checkout.handlers";
export * from "./identity.handlers";
export * from "./order.handlers";
export * from "./orders";
export * from "./profile";
export * from "./quote.handlers";
export * from "./wallets";

export const handlers = [
  http.get("/api/health", () => {
    return HttpResponse.json({
      status: "ok",
      timestamp: new Date().toISOString(),
      service: "NFT Marketplace Mock API",
    });
  }),
  ...catalogHandlers,
  ...identityHandlers,
  ...profileHandlers,
  ...walletsHandlers,
  ...cartHandlers,
  ...quoteHandlers,
  ...checkoutHandlers,
  ...orderHandlers,
  ...realtimeSocketHandlers,
];
