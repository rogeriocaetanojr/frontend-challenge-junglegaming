import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";

import { queryClient } from "@/lib/query-client";
import "@/styles/index.css";
import App from "./App.tsx";

/**
 * Prepara o ambiente da aplicação antes da renderização do React.
 * Se mocks estiverem habilitados via VITE_ENABLE_MOCKS=true, inicializa
 * o Mock Service Worker (MSW) de forma assíncrona evitando condições de corrida.
 */
async function prepareApp(): Promise<void> {
  if (import.meta.env.VITE_ENABLE_MOCKS === "true") {
    const { worker } = await import("./mocks/browser");
    await worker.start({
      onUnhandledFrame: "bypass",
    });
  }
}

prepareApp().then(() => {
  createRoot(document.getElementById("root")!).render(
    <StrictMode>
      <QueryClientProvider client={queryClient}>
        <App />
        {import.meta.env.DEV && <ReactQueryDevtools initialIsOpen={false} />}
      </QueryClientProvider>
    </StrictMode>,
  );
});
