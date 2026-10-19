import { http, HttpResponse } from "msw";

import { nftHandlers } from "./nft-handlers";

export const handlers = [
  http.get("/api/health", () => {
    return HttpResponse.json({
      status: "ok",
      timestamp: new Date().toISOString(),
      service: "NFT Marketplace Mock API",
    });
  }),
  ...nftHandlers,
];
