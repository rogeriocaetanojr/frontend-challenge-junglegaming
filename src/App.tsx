import { RouterProvider } from "react-router-dom";

import { router } from "@/routes";
import { ScenarioSwitcher } from "@/mocks/ui";
import { SessionExpiredModal } from "@/features/auth/SessionExpiredModal";

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
