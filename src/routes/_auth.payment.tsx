/**
 * Rota protegida de pagamento (/payment).
 *
 * Herda a guarda de autenticação de _auth e exige ao menos um item no carrinho.
 */
import { createFileRoute, redirect } from "@tanstack/react-router";

import { PaymentPage } from "@/pages/payment";
import { useCartStore } from "@/store/cart-store";

export const Route = createFileRoute("/_auth/payment")({
  beforeLoad: () => {
    if (useCartStore.getState().items.length === 0) {
      throw redirect({ to: "/cart" });
    }
  },
  component: PaymentPage,
});
