import { RouterProvider } from "@tanstack/react-router";

import { ScenarioSwitcher } from "@/mocks/ui";
import { SessionExpiredModal } from "@/features/auth/SessionExpiredModal";
import { router } from "@/router";

export function App() {
  return (
    <>
      <RouterProvider router={router} />
      <SessionExpiredModal />
      {import.meta.env.DEV && import.meta.env.VITE_ENABLE_MOCKS === "true" && (
        <ScenarioSwitcher />
      )}
    </>
  );
}

export default App;
