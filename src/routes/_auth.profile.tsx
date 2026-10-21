/**
 * Rota protegida do perfil do colecionador (/profile).
 */
import { createFileRoute } from "@tanstack/react-router";

import { ProfilePage } from "@/pages/profile";

export const Route = createFileRoute("/_auth/profile")({
  component: ProfilePage,
});
