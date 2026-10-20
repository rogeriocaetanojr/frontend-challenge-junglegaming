import { Link } from "react-router-dom";

import { useCartStore } from "@/store/cart-store";
import { CartItemList } from "./CartItemList";
import { CartSummary } from "./CartSummary";
import { CollectorsAlsoSaw } from "./CollectorsAlsoSaw";

export function CartPage() {
  const items = useCartStore((state) => state.items);
  const couponCode = useCartStore((state) => state.couponCode);

  return (
    <div className="w-full py-6 sm:py-8 font-mono text-[#F5F1EB]" data-testid="cart-page">
      {/* Container principal do Carrinho */}
      <div className="min-h-[calc(100vh-140px)] flex flex-col justify-start space-y-6">
        {/* Breadcrumb limpo conforme imagem de referência: Início  /  Mercado  /  Carrinho */}
        <nav aria-label="Navegação estrutural" className="pt-2">
          <ol className="flex items-center gap-2 text-sm sm:text-base font-medium text-[#F5F1EB]">
            <li>
              <Link to="/" className="hover:text-[#D28A4C] transition-colors">
                Início
              </Link>
            </li>
            <li className="text-[#8C6D58]" aria-hidden="true">
              /
            </li>
            <li>
              <Link to="/" className="hover:text-[#D28A4C] transition-colors">
                Mercado
              </Link>
            </li>
            <li className="text-[#8C6D58]" aria-hidden="true">
              /
            </li>
            <li className="text-[#F5F1EB]" aria-current="page">
              Carrinho
            </li>
          </ol>
        </nav>

        {/* Grid Principal: Lista à Esquerda (8 cols) | Resumo à Direita (4 cols) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start pt-2">
          <div className="lg:col-span-8">
            <CartItemList items={items} />
          </div>

          <div className="lg:col-span-4 sticky top-24">
            <CartSummary items={items} couponCode={couponCode} />
          </div>
        </div>
      </div>

      {/* Seção 'Colecionadores também viram' logo abaixo (acessível via scroll) */}
      <CollectorsAlsoSaw />
    </div>
  );
}

export default CartPage;
