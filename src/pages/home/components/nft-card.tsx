import { Link } from "@tanstack/react-router";

import { formatEth } from "@/lib/formatters";
import type { NftItem } from "@/types/nft";

interface NftCardProps {
  nft: NftItem;
}

export function NftCard({ nft }: NftCardProps) {
  const rawNft = nft as unknown as {
    id: string;
    name?: string;
    title?: string;
    priceEth?: number;
    price?: string;
    originalPriceEth?: number;
    image?: string;
    images?: Array<{ url: string; alt?: string }>;
  };

  const title = rawNft.title ?? rawNft.name ?? "NFT";
  const image = rawNft.images?.[0]?.url ?? rawNft.image ?? "";
  const price = rawNft.priceEth ?? rawNft.price ?? "0";

  return (
    <article className="group flex flex-col space-y-3 text-left">
      {/* Moldura ao redor da imagem com o mesmo fundo do card de coleções (#241612) e sombra elegante */}
      <div className="relative bg-[#241612] border border-[#3F2319]/80 rounded-[22px] p-2 sm:p-2.5 shadow-lg shadow-black/40 transition-all duration-300 group-hover:border-[#D28A4C]/40 group-hover:shadow-xl">
        <div className="relative aspect-square overflow-hidden rounded-[16px] bg-[#140D0A]">
          <Link
            to="/nfts/$id"
            params={{ id: String(nft.id) }}
            className="block size-full"
            aria-label={`Ver detalhes de ${title}`}
          >
            <img
              src={image}
              alt={title}
              className="size-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
              loading="lazy"
            />
          </Link>
        </div>
      </div>

      {/* Informações: Título e Preço */}
      <div className="space-y-1 px-1">
        <h4 className="text-sm sm:text-base font-normal text-white tracking-tight truncate group-hover:text-[#D28A4C] transition-colors">
          <Link to="/nfts/$id" params={{ id: String(nft.id) }}>
            {title}
          </Link>
        </h4>

        <div className="flex items-center gap-2 font-mono text-sm">
          <span className="font-bold text-[#D28A4C]">{formatEth(price)}</span>

          {rawNft.originalPriceEth && (
            <span className="text-xs text-[#CFB28C]/60 line-through">
              {formatEth(rawNft.originalPriceEth)}
            </span>
          )}
        </div>
      </div>
    </article>
  );
}
