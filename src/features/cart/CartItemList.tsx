import { Link } from "react-router-dom";
import { Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { formatEth } from "@/lib/formatters";
import { type CartItem, useCartStore } from "@/store/cart-store";

export interface CartItemListProps {
  items: CartItem[];
}

export function CartItemList({ items }: CartItemListProps) {
  const updateQuantity = useCartStore((state) => state.updateQuantity);
  const removeItem = useCartStore((state) => state.removeItem);

  if (items.length === 0) {
    return (
      <div className="text-center py-12 px-4 rounded-2xl bg-[#1E1410] border border-[#3F2319]/60 space-y-5">
        <div className="size-16 mx-auto rounded-full bg-[#140D0A] border border-[#3F2319] flex items-center justify-center text-[#D28A4C]">
          <ShoppingBag className="size-8" aria-hidden="true" />
        </div>
        <div className="space-y-1.5">
          <h2 className="text-xl font-bold text-[#F5F1EB] font-mono">
            Seu Carrinho está Vazio
          </h2>
          <p className="text-sm text-[#CFB28C] font-mono max-w-sm mx-auto">
            Você ainda não selecionou nenhum NFT para compra.
          </p>
        </div>
        <Button
          asChild
          className="bg-[#D28A4C] hover:bg-[#c47b3e] text-[#0E0907] font-mono font-bold"
        >
          <Link to="/">Explorar Mercado</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-3.5 font-mono" role="list" aria-label="Itens do carrinho">
      {items.map((item) => {
        const itemPrice =
          typeof item.price === "number"
            ? item.price
            : parseFloat(String(item.priceEth || 0));
        const subtotalItem = (itemPrice * item.quantity).toFixed(4);
        const canDecrease = item.quantity > 1;
        const canIncrease = item.maxSupply ? item.quantity < item.maxSupply : true;

        return (
          <div
            key={item.id}
            role="listitem"
            className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-xl bg-[#1E1410] border border-[#3F2319]/60 hover:border-[#D28A4C]/50 transition-all duration-200"
          >
            {/* Imagem + Título + Preço unitário */}
            <div className="flex items-center gap-3.5 min-w-0 w-full sm:w-auto">
              <div className="size-16 sm:size-20 rounded-xl bg-[#140D0A] border border-[#2E1A13] shrink-0 p-1.5 overflow-hidden flex items-center justify-center">
                <img
                  src={item.image || "/images/nfts/emerald-ape.png"}
                  alt={item.title || item.name || "NFT"}
                  className="size-full object-cover rounded-lg"
                  loading="lazy"
                />
              </div>

              <div className="min-w-0 space-y-1">
                <h3 className="text-sm sm:text-base font-bold text-[#F5F1EB] truncate">
                  {item.title || item.name}
                </h3>
                <p className="text-xs text-[#CFB28C] truncate">
                  Coleção: {item.collection || "Genesis Apes"}
                </p>
                <p className="text-xs text-[#D28A4C] font-bold">
                  {formatEth(itemPrice)} ETH cada
                </p>
              </div>
            </div>

            {/* Controles de Quantidade & Subtotal & Lixeira */}
            <div className="flex items-center justify-between sm:justify-end gap-5 w-full sm:w-auto border-t sm:border-t-0 border-[#3F2319]/40 pt-3 sm:pt-0">
              {/* Contador [-] Qtd [+] */}
              <div className="flex items-center gap-2 bg-[#140D0A] px-2.5 py-1 rounded-lg border border-[#3F2319]">
                <button
                  type="button"
                  onClick={() => updateQuantity(item.id, item.quantity - 1)}
                  disabled={!canDecrease}
                  aria-label={`Diminuir quantidade de ${item.title || item.name}`}
                  className="p-1 text-[#F5F1EB]/70 hover:text-[#D28A4C] disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
                >
                  <Minus className="size-3.5" />
                </button>

                <span className="w-6 text-center text-xs sm:text-sm font-bold text-[#F5F1EB]">
                  {item.quantity}
                </span>

                <button
                  type="button"
                  onClick={() => updateQuantity(item.id, item.quantity + 1)}
                  disabled={!canIncrease}
                  aria-label={`Aumentar quantidade de ${item.title || item.name}`}
                  className="p-1 text-[#F5F1EB]/70 hover:text-[#D28A4C] disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
                >
                  <Plus className="size-3.5" />
                </button>
              </div>

              {/* Subtotal da Linha */}
              <div className="text-right min-w-[80px]">
                <span className="text-sm sm:text-base font-bold text-[#F5F1EB]">
                  {subtotalItem} ETH
                </span>
              </div>

              {/* Botão Remover */}
              <button
                type="button"
                onClick={() => removeItem(item.id)}
                aria-label={`Remover ${item.title || item.name} do carrinho`}
                className="p-2 rounded-lg text-[#F5F1EB]/60 hover:text-[#e05252] hover:bg-[#e05252]/10 transition-colors cursor-pointer"
              >
                <Trash2 className="size-4" />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default CartItemList;
