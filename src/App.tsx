import { RouterProvider } from "react-router-dom";

import { router } from "@/routes";
import { ScenarioSwitcher } from "@/mocks/ui";

export function App() {
  return (
    <>
      <RouterProvider router={router} />
      {import.meta.env.VITE_ENABLE_MOCKS === "true" && <ScenarioSwitcher />}
    </>
  );
}

export default App;
