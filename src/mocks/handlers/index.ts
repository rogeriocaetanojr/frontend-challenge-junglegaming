import { http, HttpResponse } from "msw";

import { catalogHandlers } from "./catalog.handlers";
import { identityHandlers } from "./identity.handlers";

export * from "./catalog.handlers";
export * from "./identity.handlers";

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
];
