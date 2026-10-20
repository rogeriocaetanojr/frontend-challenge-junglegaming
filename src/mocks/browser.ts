import type { StartOptions } from "msw/browser";
import { setupWorker } from "msw/browser";

import { handlers } from "./handlers";

export const worker = setupWorker(...handlers);

/**
 * Inicializa o Mock Service Worker no navegador com configurações resilientes
 * para desenvolvimento e validação em build de produção.
 */
export async function startWorker(options?: StartOptions) {
  return worker.start({
    onUnhandledFrame: "bypass",
    ...({ onUnhandledRequest: "bypass" } as Record<string, unknown>),
    serviceWorker: {
      url: "/mockServiceWorker.js",
    },
    ...options,
  });
}
