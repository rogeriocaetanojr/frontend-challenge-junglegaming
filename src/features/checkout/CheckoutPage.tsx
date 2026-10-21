import { Link, Navigate } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";

import { useCartStore } from "@/store/cart-store";
import { CheckoutForm } from "./CheckoutForm";
import { CheckoutSuccessView } from "./CheckoutSuccessView";
import { useCheckout } from "./useCheckout";

export interface CheckoutPageProps {
  pollingInterval?: number;
}

export function CheckoutPage({ pollingInterval = 1000 }: CheckoutPageProps = {}) {
  const items = useCartStore((state) => state.items);
  const clearCart = useCartStore((state) => state.clearCart);

  const totalEth = items.reduce((acc, i) => acc + i.price * i.quantity, 0).toFixed(3);

  const { status, order, error, submitOrder } = useCheckout({
    pollingInterval,
    onSuccess: () => {
      // Esvazia carrinho automaticamente ao atingir status de sucesso
      clearCart();
    },
  });

  // Redireciona para /cart se o carrinho estiver vazio antes de iniciar o checkout
  if (items.length === 0 && status !== "success") {
    return <Navigate to="/cart" replace />;
  }

  return (
    <div
      className="w-full max-w-2xl mx-auto py-8 sm:py-12 px-4 space-y-6 font-mono text-[#F5F1EB]"
      data-testid="checkout-page"
    >
      {/* Retorno */}
      {status !== "success" && (
        <div>
          <Link
            to="/cart"
            className="inline-flex items-center gap-1.5 text-xs text-[#8C6D58] hover:text-[#D28A4C] transition-colors"
          >
            <ArrowLeft className="size-3.5" />
            <span>Voltar ao Carrinho</span>
          </Link>
        </div>
      )}

      {/* Renderização condicional: Formulário ou Visualização de Sucesso */}
      {status === "success" && order ? (
        <CheckoutSuccessView order={order} />
      ) : (
        <CheckoutForm
          items={items}
          totalEth={totalEth}
          status={status}
          error={error}
          onSubmit={submitOrder}
        />
      )}
    </div>
  );
}

export default CheckoutPage;
