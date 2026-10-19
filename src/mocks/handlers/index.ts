import { http, HttpResponse } from "msw";

import { cartHandlers } from "./cart.handlers";
import { catalogHandlers } from "./catalog.handlers";
import { identityHandlers } from "./identity.handlers";
import { orderHandlers } from "./order.handlers";
import { quoteHandlers } from "./quote.handlers";

export * from "./cart.handlers";
export * from "./catalog.handlers";
export * from "./identity.handlers";
export * from "./order.handlers";
export * from "./quote.handlers";

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
  ...cartHandlers,
  ...quoteHandlers,
  ...orderHandlers,
];
