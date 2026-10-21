import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";

import { resumeGuestCartMerge } from "@/features/cart/sync";
import { hasValidSession } from "@/lib/auth/session-store";
import { queryClient } from "@/lib/query-client";
import { hydrateAuthSession } from "@/store/auth-store";
import "@/styles/index.css";
import App from "./App.tsx";

/**
 * Prepara o ambiente da aplicação antes da renderização do React.
 * Se mocks estiverem habilitados via VITE_ENABLE_MOCKS=true, inicializa
 * o Mock Service Worker (MSW) de forma assíncrona e bloqueante antes do primeiro
 * render da raiz do React, prevenindo que requisições iniciais escapem do interceptor.
 */
async function prepareApp(): Promise<void> {
  const shouldEnableMocks = import.meta.env.VITE_ENABLE_MOCKS !== "false";

  if (shouldEnableMocks) {
    const { startWorker } = await import("./mocks/browser");
    await startWorker();
  }
}

prepareApp()
  .then(hydrateAuthSession)
  // Import tardio: o engine.io-client captura `globalThis.WebSocket` ao carregar o módulo,
  // então ele precisa ser avaliado depois do MSW instalar o interceptor de WebSocket.
  .then(() => import("@/lib/realtime"))
  .then(({ connectRealtime, setupRealtimeLifecycle }) => {
    setupRealtimeLifecycle(queryClient);
    if (hasValidSession()) {
      connectRealtime(queryClient);
      resumeGuestCartMerge();
    }

    createRoot(document.getElementById("root")!).render(
      <StrictMode>
        <QueryClientProvider client={queryClient}>
          <App />
          {import.meta.env.DEV && <ReactQueryDevtools initialIsOpen={false} />}
        </QueryClientProvider>
      </StrictMode>,
    );
  });
