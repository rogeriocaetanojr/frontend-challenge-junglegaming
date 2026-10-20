import { Link } from "react-router-dom";
import { ArrowLeft, ShoppingBag } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useCartStore } from "@/store/cart-store";
import { CartItemList } from "./CartItemList";
import { CartSummary } from "./CartSummary";

export function CartPage() {
  const items = useCartStore((state) => state.items);
  const couponCode = useCartStore((state) => state.couponCode);
  const clearCart = useCartStore((state) => state.clearCart);

  const totalItemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div
      className="w-full max-w-[1420px] mx-auto py-6 sm:py-10 space-y-8 font-mono text-[#F5F1EB] px-4 sm:px-6 lg:px-8"
      data-testid="cart-page"
    >
      {/* Breadcrumb / Retorno ao Mercado */}
      <div className="flex items-center justify-between flex-wrap gap-4 border-b border-[#3F2319]/50 pb-4">
        <nav aria-label="Navegação estrutural">
          <ol className="flex items-center gap-2 text-sm sm:text-base font-bold text-[#F5F1EB]">
            <li>
              <Link
                to="/"
                className="hover:text-[#D28A4C] transition-colors flex items-center gap-1.5"
              >
                <ArrowLeft className="size-4" />
                <span>Mercado</span>
              </Link>
            </li>
            <li className="text-[#F5F1EB]/50" aria-hidden="true">
              /
            </li>
            <li className="text-[#D28A4C]" aria-current="page">
              Carrinho
            </li>
          </ol>
        </nav>

        {items.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearCart}
            className="text-xs text-[#CFB28C] hover:text-[#e05252] hover:bg-[#e05252]/10"
          >
            Limpar Carrinho
          </Button>
        )}
      </div>

      {/* Título da Página com contador */}
      <div className="flex items-center gap-3">
        <ShoppingBag className="size-7 sm:size-8 text-[#D28A4C]" />
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#F5F1EB]">
            Carrinho de Compras
          </h1>
          <p className="text-xs sm:text-sm text-[#CFB28C]">
            {totalItemCount === 0
              ? "Nenhum item selecionado"
              : totalItemCount === 1
                ? "1 ativo selecionado para aquisição"
                : `${totalItemCount} ativos selecionados para aquisição`}
          </p>
        </div>
      </div>

      {/* Grid Principal: Lista à Esquerda (8 cols) | Resumo à Direita (4 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-8">
          <CartItemList items={items} />
        </div>

        <div className="lg:col-span-4 sticky top-24">
          <CartSummary items={items} couponCode={couponCode} />
        </div>
      </div>
    </div>
  );
}

export default CartPage;
