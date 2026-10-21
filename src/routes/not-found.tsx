/**
 * Rota explícita /not-found, usada pelos links sem destino implementado.
 * URLs inexistentes são tratadas pelo notFoundComponent da rota raiz.
 */
import { createFileRoute } from "@tanstack/react-router";

import { NotFoundPage } from "@/pages/not-found";

export const Route = createFileRoute("/not-found")({
  component: NotFoundPage,
});
