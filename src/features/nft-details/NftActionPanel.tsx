import { useState } from "react";
import { Heart, Minus, Plus } from "lucide-react";

import { cn } from "@/lib/utils";

export interface NftActionPanelProps {
  onBuy?: (quantity: number) => void;
  maxQuantity?: number;
  initialQuantity?: number;
  initialFavorite?: boolean;
  onFavoriteChange?: (isFavorite: boolean) => void;
  className?: string;
  disabled?: boolean;
}

export function NftActionPanel({
  onBuy,
  maxQuantity = 10,
  initialQuantity = 1,
  initialFavorite = false,
  onFavoriteChange,
  className,
  disabled = false,
}: NftActionPanelProps) {
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

  return (
    <div
      className={cn(
        "flex items-center justify-between gap-3 pt-1 flex-wrap font-mono select-none",
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
  );
}

export default NftActionPanel;
