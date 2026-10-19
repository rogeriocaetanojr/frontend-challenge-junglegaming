import * as React from "react";
import { Link } from "react-router-dom";
import { Check, ShoppingBag } from "lucide-react";

import { formatEth } from "@/lib/formatters";
import { useCartStore } from "@/store/cart-store";
import type { NftItem } from "@/types/nft";

interface NftCardProps {
  nft: NftItem;
}

export function NftCard({ nft }: NftCardProps) {
  const addItem = useCartStore((state) => state.addItem);
  const removeItem = useCartStore((state) => state.removeItem);
  const isInCart = useCartStore((state) => state.isInCart(nft.id));

  const handleToggleCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isInCart) {
      removeItem(nft.id);
    } else {
      addItem({
        id: nft.id,
        name: nft.name,
        collection: nft.collection.name,
        priceEth: nft.priceEth,
        image: nft.image,
        creator: nft.creator.address,
        quantity: 1,
      });
    }
  };

  return (
    <article className="group flex flex-col space-y-3 text-left">
      {/* Moldura ao redor da imagem com o mesmo fundo do card de coleções (#241612) e sombra elegante */}
      <div className="relative bg-[#241612] border border-[#3F2319]/80 rounded-[22px] p-2 sm:p-2.5 shadow-lg shadow-black/40 transition-all duration-300 group-hover:border-[#D28A4C]/40 group-hover:shadow-xl">
        <div className="relative aspect-square overflow-hidden rounded-[16px] bg-[#140D0A]">
          <Link
            to={`/nft/${nft.id}`}
            className="block size-full"
            aria-label={`Ver detalhes de ${nft.name}`}
          >
            <img
              src={nft.image}
              alt={nft.name}
              className="size-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
              loading="lazy"
            />
          </Link>

          {/* Botão flutuante de carrinho / compra rápido com feedback interativo */}
          <button
            type="button"
            onClick={handleToggleCart}
            aria-label={
              isInCart ? `Remover ${nft.name} do carrinho` : `Comprar ${nft.name}`
            }
            className={`absolute bottom-2.5 right-2.5 p-2 rounded-full transition-all duration-200 cursor-pointer shadow-lg ${
              isInCart
                ? "bg-[#D28A4C] text-[#0E0907]"
                : "bg-[#0E0907]/80 hover:bg-[#D28A4C] hover:text-[#0E0907] text-white backdrop-blur-md border border-[#3F2319]"
            }`}
          >
            {isInCart ? (
              <Check className="size-3.5 stroke-[2.5]" />
            ) : (
              <ShoppingBag className="size-3.5" />
            )}
          </button>
        </div>
      </div>

      {/* Informações: Título e Preço */}
      <div className="space-y-1 px-1">
        <h4 className="text-sm sm:text-base font-normal text-white tracking-tight truncate group-hover:text-[#D28A4C] transition-colors">
          <Link to={`/nft/${nft.id}`}>{nft.name}</Link>
        </h4>

        <div className="flex items-center gap-2 font-mono text-sm">
          <span className="font-bold text-[#D28A4C]">{formatEth(nft.priceEth)}</span>

          {nft.originalPriceEth && (
            <span className="text-xs text-[#CFB28C]/60 line-through">
              {formatEth(nft.originalPriceEth)}
            </span>
          )}
        </div>
      </div>
    </article>
  );
}
