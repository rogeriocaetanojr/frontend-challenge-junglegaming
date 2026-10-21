import { useState } from "react";
import { RouterProvider } from "@tanstack/react-router";

import { ScenarioSwitcher } from "@/mocks/ui";
import { SessionExpiredModal } from "@/features/auth/SessionExpiredModal";
import { router } from "@/router";

/**
 * Exibe o painel em DEV, ou em qualquer build (incluindo demo/produção) quando a
 * URL contém `?scenarios=1` ou `?scenarios=true`. Lido no lazy initializer do
 * useState (não em efeito) para não disparar renders em cascata.
 */
function useShowScenarioSwitcher(): boolean {
  const [show] = useState<boolean>(() => {
    if (import.meta.env.DEV) return true;
    if (typeof window === "undefined") return false;
    const param = new URLSearchParams(window.location.search).get("scenarios");
    return param === "1" || param === "true";
  });

  return show;
}

export function App() {
  const showScenarioSwitcher = useShowScenarioSwitcher();

  return (
    <>
      <RouterProvider router={router} />
      <SessionExpiredModal />
      {showScenarioSwitcher && import.meta.env.VITE_ENABLE_MOCKS === "true" && (
        <ScenarioSwitcher />
      )}
    </>
  );
}

export default App;
