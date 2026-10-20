/**
 * Card Semântico e Acessível de NFT (NftCard).
 *
 * Em conformidade estrita com WCAG 2.1 AA:
 * - Imagem com atributo `alt` descritivo e fallback automático em caso de erro (onError).
 * - Título semântico hierárquico com link de navegação acessível.
 * - Navegação via TanStack Router (<Link to="/nfts/$id" params={{ id: nft.id }}>).
 * - Badges com indicação de raridade e categoria.
 * - Preço formatado com utilitário monetário institucional (formatEth).
 * - Estados de foco visível (focus-visible:ring-2) e hover destacados.
 */
import { useState } from "react";
import { Link } from "@tanstack/react-router";

import { Badge } from "@/components/ui/badge";
import type { Nft, NftRarity } from "@/contracts/catalog";
import { formatEth } from "@/lib/formatters";
import { cn } from "@/lib/utils";

// Registra rota /nfts/$id para tipagem estrita do TanStack Router
declare module "@tanstack/react-router" {
  interface FileRoutesByPath {
    "/nfts/$id": {
      id: "/nfts/$id";
      path: "/nfts/$id";
      fullPath: "/nfts/$id";
      preLoaderRoute: unknown;
      parentRoute: unknown;
    };
  }
}

export const FALLBACK_NFT_IMAGE = "/images/nfts/emerald-ape.png";

export interface NftCardProps {
  nft: Nft;
  className?: string;
  onAddToCart?: (nft: Nft) => void;
}

const RARITY_COLORS: Record<NftRarity, string> = {
  legendary: "border-amber-500/30 bg-amber-500/15 text-amber-300",
  epic: "border-purple-500/30 bg-purple-500/15 text-purple-300",
  rare: "border-cyan-500/30 bg-cyan-500/15 text-cyan-300",
  common: "border-border bg-surface-raised text-text-muted",
};

export function NftCard({ nft, className, onAddToCart }: NftCardProps) {
  const initialImageUrl = nft.images?.[0]?.url || FALLBACK_NFT_IMAGE;
  const imageAlt = nft.images?.[0]?.alt || nft.title;

  const [imgSrc, setImgSrc] = useState(initialImageUrl);
  const [imgFailed, setImgFailed] = useState(false);

  const handleImageError = () => {
    if (!imgFailed) {
      setImgFailed(true);
      setImgSrc(FALLBACK_NFT_IMAGE);
    }
  };

  const rarityBadgeClass = RARITY_COLORS[nft.rarity] || RARITY_COLORS.common;

  return (
    <article
      className={cn(
        "group relative flex flex-col justify-between overflow-hidden rounded-card border border-border bg-surface-dark p-3.5 transition-all duration-300 hover:border-primary/40 hover:shadow-lg hover:shadow-black/40 focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-2 focus-within:ring-offset-background",
        className,
      )}
    >
      <div className="flex flex-col space-y-3">
        {/* Moldura da Imagem com link acessível */}
        <div className="relative aspect-square w-full overflow-hidden rounded-button bg-surface-raised">
          <Link
            to="/nfts/$id"
            params={{ id: String(nft.id) }}
            className="block size-full focus:outline-none"
            tabIndex={-1}
            aria-hidden="true"
          >
            <img
              src={imgSrc}
              alt={imageAlt}
              onError={handleImageError}
              loading="lazy"
              className="size-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
            />
          </Link>

          {/* Badge flutuante de categoria */}
          {nft.category && (
            <div className="absolute top-2.5 left-2.5 pointer-events-none">
              <span className="inline-flex items-center rounded-badge bg-surface-dark/80 backdrop-blur-md border border-white/10 px-2 py-0.5 text-[11px] font-medium text-foreground uppercase tracking-wider">
                {nft.category}
              </span>
            </div>
          )}
        </div>

        {/* Informações de Coleção e Raridade */}
        <div className="flex items-center justify-between gap-2 pt-0.5">
          <p className="text-xs font-medium text-text-muted truncate">
            {nft.collection?.name || "Coleção Exclusiva"}
          </p>
          <Badge
            variant="outline"
            className={cn(
              "text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5",
              rarityBadgeClass,
            )}
          >
            {nft.rarity}
          </Badge>
        </div>

        {/* Título Semântico */}
        <h3 className="text-base font-semibold text-foreground line-clamp-1 group-hover:text-primary transition-colors">
          <Link
            to="/nfts/$id"
            params={{ id: String(nft.id) }}
            className="focus-visible:outline-none focus-visible:underline"
          >
            {nft.title}
          </Link>
        </h3>
      </div>

      {/* Rodapé com Preço Formatado e Ação Opcional */}
      <div className="mt-4 flex items-center justify-between border-t border-border/60 pt-3">
        <div className="flex flex-col">
          <span className="text-[11px] font-medium text-text-muted">Preço</span>
          <span className="text-sm font-bold text-foreground">
            {formatEth(nft.price)}
          </span>
        </div>

        {onAddToCart && (
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              onAddToCart(nft);
            }}
            aria-label={`Adicionar ${nft.title} ao carrinho`}
            className="rounded-button bg-primary/10 border border-primary/20 px-3 py-1.5 text-xs font-semibold text-primary transition-colors hover:bg-primary hover:text-ink-deep focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            Comprar
          </button>
        )}
      </div>
    </article>
  );
}

export default NftCard;
