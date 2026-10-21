import { useState } from "react";
import { createPortal } from "react-dom";
import { Link } from "@tanstack/react-router";
import { Heart, Minus, Plus, ShoppingCart } from "lucide-react";

import { useMediaQuery } from "@/lib/useMediaQuery";
import { cn } from "@/lib/utils";

export interface NftActionPanelProps {
  onBuy?: (quantity: number) => void;
  maxQuantity?: number;
  initialQuantity?: number;
  initialFavorite?: boolean;
  onFavoriteChange?: (isFavorite: boolean) => void;
  className?: string;
  disabled?: boolean;
  /** Preço exibido na barra fixa do mobile. */
  price?: string;
}

export function NftActionPanel({
  onBuy,
  maxQuantity = 10,
  initialQuantity = 1,
  initialFavorite = false,
  onFavoriteChange,
  className,
  disabled = false,
  price,
}: NftActionPanelProps) {
  const isMobile = useMediaQuery("(max-width: 767.98px)");
  const [quantity, setQuantity] = useState<number>(Math.max(1, initialQuantity));
  const [isFavorite, setIsFavorite] = useState<boolean>(initialFavorite);
  const [syncedFavorite, setSyncedFavorite] = useState<boolean>(initialFavorite);
  // Ressincroniza quando o estado do servidor chega após a montagem (ex.: refresh).
  if (initialFavorite !== syncedFavorite) {
    setSyncedFavorite(initialFavorite);
    setIsFavorite(initialFavorite);
  }

  const handleDecreaseQuantity = () => {
    setQuantity((prev) => {
      const next = Math.max(1, prev - 1);
      return next;
    });
  };

  const handleIncreaseQuantity = () => {
    setQuantity((prev) => {
      const next = Math.min(maxQuantity, prev + 1);
      return next;
    });
  };

  const handleToggleFavorite = () => {
    const nextFavorite = !isFavorite;
    setIsFavorite(nextFavorite);
    onFavoriteChange?.(nextFavorite);
  };

  const handleBuyClick = () => {
    if (disabled) return;
    onBuy?.(quantity);
  };

  const stepButtonClass =
    "size-6 rounded-md bg-[#D28A4C] text-[#0E0907] flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer";

  // Barra fixa do frame mobile. Renderizada em portal no <body> para ficar fora do
  // `zoom` do layout, que desalinha o posicionamento fixo e o hit-testing.
  const mobileBar = (
    <div className="md:hidden fixed inset-x-0 bottom-0 z-30 rounded-t-[28px] bg-[#1E1410] border-t border-[#2E1A13] px-6 pt-5 pb-6 space-y-4 font-mono text-[#F5F1EB] shadow-[0_-8px_24px_rgba(0,0,0,0.45)] select-none">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-sm font-bold">Qtd.</span>
          <button
            type="button"
            onClick={handleDecreaseQuantity}
            disabled={disabled || quantity <= 1}
            aria-label="Diminuir quantidade"
            className={stepButtonClass}
          >
            <Minus className="size-3.5 stroke-[2.8]" />
          </button>
          <span className="w-4 text-center text-base font-bold">{quantity}</span>
          <button
            type="button"
            onClick={handleIncreaseQuantity}
            disabled={disabled || quantity >= maxQuantity}
            aria-label="Aumentar quantidade"
            className={stepButtonClass}
          >
            <Plus className="size-3.5 stroke-[2.8]" />
          </button>
        </div>
        {price && <span className="text-xl font-bold text-[#D28A4C]">{price} ETH</span>}
      </div>
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={handleBuyClick}
          disabled={disabled}
          className="flex-1 h-14 rounded-full bg-linear-to-r from-[#D28A4C] to-[#A9703F] text-[#0E0907] text-sm font-bold disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
        >
          Comprar NFT
        </button>
        <Link
          to="/cart"
          aria-label="Ir para o carrinho"
          className="size-14 shrink-0 rounded-full bg-[#2A1A13] border border-[#3F2319] flex items-center justify-center text-[#D28A4C]"
        >
          <ShoppingCart className="size-5" />
        </Link>
      </div>
    </div>
  );

  return (
    <>
      {isMobile && createPortal(mobileBar, document.body)}
      <div
        className={cn(
          "max-md:hidden flex items-center justify-between gap-3 pt-1 flex-wrap font-mono select-none",
          className,
        )}
      >
        {/* Contador Circular [-] 1 [+] */}
        <div className="flex items-center gap-2.5 bg-transparent shrink-0">
          <button
            type="button"
            onClick={handleDecreaseQuantity}
            disabled={disabled || quantity <= 1}
            aria-label="Diminuir quantidade"
            className="size-8.5 rounded-full bg-[#D28A4C] text-[#0E0907] flex items-center justify-center hover:bg-[#c47b3e] disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
          >
            <Minus className="size-3.5 stroke-[2.8]" />
          </button>
          <span
            className="w-6 text-center text-sm sm:text-[16px] font-bold font-mono text-[#F5F1EB]"
            aria-label={`Quantidade selecionada: ${quantity}`}
          >
            {quantity}
          </span>
          <button
            type="button"
            onClick={handleIncreaseQuantity}
            disabled={disabled || quantity >= maxQuantity}
            aria-label="Aumentar quantidade"
            className="size-8.5 rounded-full bg-[#D28A4C] text-[#0E0907] flex items-center justify-center hover:bg-[#c47b3e] disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
          >
            <Plus className="size-3.5 stroke-[2.8]" />
          </button>
        </div>

        {/* Grupo de Botões Comprar e Favoritar alinhados à direita */}
        <div className="flex items-center gap-3 flex-1 justify-end">
          <button
            type="button"
            onClick={handleBuyClick}
            disabled={disabled}
            className="min-w-[130px] sm:min-w-[150px] h-9.5 px-6 rounded-lg bg-[#D28A4C] hover:bg-[#c47b3e] disabled:opacity-50 disabled:cursor-not-allowed text-[#0E0907] font-mono text-xs sm:text-[14px] font-bold uppercase tracking-wider transition-colors shadow-sm cursor-pointer flex items-center justify-center"
          >
            COMPRAR
          </button>

          <button
            type="button"
            aria-pressed={isFavorite}
            onClick={handleToggleFavorite}
            aria-label={isFavorite ? "Desfavoritar NFT" : "Favoritar NFT"}
            className={cn(
              "h-9.5 px-4 rounded-lg border font-mono text-xs sm:text-[13.5px] font-medium transition-colors flex items-center gap-2 cursor-pointer",
              isFavorite
                ? "border-[#D28A4C] text-[#D28A4C] bg-[#D28A4C]/10"
                : "border-[#3F2319] text-[#F5F1EB]/85 hover:border-[#D28A4C] hover:text-[#F5F1EB] bg-transparent",
            )}
          >
            <Heart
              className={cn(
                "size-3.5",
                isFavorite ? "fill-[#D28A4C] text-[#D28A4C]" : "stroke-[1.8]",
              )}
            />
            <span>Favoritar</span>
          </button>
        </div>
      </div>
    </>
  );
}

export default NftActionPanel;
