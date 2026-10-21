/**
 * Rota protegida de pagamento (/payment).
 *
 * Herda a guarda de autenticação de _auth e exige ao menos um item no carrinho da API.
 */
import { createFileRoute, redirect } from "@tanstack/react-router";

import { cartQueryOptions } from "@/features/cart/api";
import { waitForCartMerge } from "@/features/cart/sync";
import { getSession } from "@/lib/auth/session-store";
import { PaymentPage } from "@/pages/payment";

export const Route = createFileRoute("/_auth/payment")({
  beforeLoad: async ({ context }) => {
    await waitForCartMerge();
    const cart = await context.queryClient.ensureQueryData(
      cartQueryOptions(getSession()?.userId),
    );
    if (cart.lines.length === 0) {
      throw redirect({ to: "/cart" });
    }
  },
  component: PaymentPage,
});
