import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import { enableMocking } from "@/mocks";
import "@/styles/index.css";
import App from "./App.tsx";

enableMocking().then(() => {
  createRoot(document.getElementById("root")!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
});
