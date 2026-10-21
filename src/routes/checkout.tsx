/**
 * Alias legado: /checkout redireciona para a tela de pagamento (/payment).
 */
import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/checkout")({
  beforeLoad: () => {
    throw redirect({ to: "/payment", replace: true });
  },
});
