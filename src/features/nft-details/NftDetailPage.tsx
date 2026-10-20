/**
 * Componente de Página de Detalhe do NFT (NftDetailPage).
 *
 * Estrutura visual:
 * - Esquerda: Imagem em alta resolução, badges de raridade e autenticação.
 * - Direita: Categoria, Coleção, Título semântico (h1), Descrição, Preço formatado, Edições/Propriedades e Ação de Compra/Carrinho.
 */
import { Link } from "react-router-dom";
import { AlertCircle, ArrowLeft, Check, ShieldCheck, ShoppingCart } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { NftRarity } from "@/contracts/catalog";
import { formatEth } from "@/lib/formatters";
import { cn } from "@/lib/utils";
import { useCartStore } from "@/store/cart-store";
import { useNftDetail } from "./queries";
import type { NftDetail } from "./types";

export interface NftDetailPageProps {
  nftId?: string;
  initialData?: NftDetail;
}

const RARITY_COLORS: Record<NftRarity, string> = {
  legendary: "border-amber-500/40 bg-amber-500/15 text-amber-300",
  epic: "border-purple-500/40 bg-purple-500/15 text-purple-300",
  rare: "border-cyan-500/40 bg-cyan-500/15 text-cyan-300",
  common: "border-border bg-surface-raised text-text-muted",
};

export function NftDetailPage({ nftId = "1", initialData }: NftDetailPageProps) {
  const { data: nft, isLoading, isError } = useNftDetail(nftId);
  const currentNft = nft ?? initialData;

  const addItem = useCartStore((state) => state.addItem);
  const removeItem = useCartStore((state) => state.removeItem);
  const inCart = useCartStore((state) =>
    currentNft ? state.isInCart(String(currentNft.id)) : false,
  );

  const handleToggleCart = () => {
    if (!currentNft) return;

    const idStr = String(currentNft.id);
    if (inCart) {
      removeItem(idStr);
    } else {
      addItem({
        id: idStr,
        name: currentNft.title,
        collection: currentNft.collection?.name || "Coleção Exclusiva",
        priceEth: currentNft.price,
        image: currentNft.images?.[0]?.url || "/images/nfts/emerald-ape.png",
        creator: currentNft.creator?.name || "Jungle Artist",
        quantity: 1,
      });
    }
  };

  if (isLoading && !currentNft) {
    return (
      <div className="max-w-5xl mx-auto py-8 space-y-6">
        <Skeleton className="h-8 w-36" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
          <Skeleton className="aspect-square w-full rounded-card" />
          <div className="space-y-6">
            <div className="space-y-3">
              <Skeleton className="h-6 w-28" />
              <Skeleton className="h-10 w-3/4" />
              <Skeleton className="h-20 w-full" />
            </div>
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (isError || !currentNft) {
    return (
      <div className="max-w-md mx-auto text-center py-20 space-y-6">
        <div className="size-20 mx-auto bg-surface-card border border-border rounded-full flex items-center justify-center text-text-muted">
          <AlertCircle className="size-10 text-primary" aria-hidden="true" />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-foreground">NFT Não Encontrado</h1>
          <p className="text-sm text-text-muted">
            O token #{nftId} não pôde ser localizado ou foi deslistado.
          </p>
        </div>
        <Button asChild size="lg">
          <Link to="/">
            <ArrowLeft className="size-4 mr-2" />
            <span>Voltar ao Catálogo</span>
          </Link>
        </Button>
      </div>
    );
  }

  const imageUrl = currentNft.images?.[0]?.url || "/images/nfts/emerald-ape.png";
  const imageAlt = currentNft.images?.[0]?.alt || currentNft.title;
  const rarityBadgeClass = RARITY_COLORS[currentNft.rarity] || RARITY_COLORS.common;

  return (
    <div className="max-w-5xl mx-auto py-8 space-y-8">
      {/* Botão de retorno */}
      <div>
        <Button
          asChild
          variant="ghost"
          size="sm"
          className="gap-1.5 text-text-muted hover:text-foreground"
        >
          <Link to="/">
            <ArrowLeft className="size-4" />
            <span>Voltar ao Catálogo</span>
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-start">
        {/* Painel Esquerdo: Imagem e Badges */}
        <div className="space-y-4">
          <div className="relative aspect-square w-full bg-surface-dark border border-border rounded-card overflow-hidden shadow-2xl">
            <img src={imageUrl} alt={imageAlt} className="size-full object-cover" />
            <div className="absolute top-3 left-3 flex flex-wrap gap-2">
              <Badge
                variant="outline"
                className={cn(
                  "text-xs font-semibold uppercase tracking-wider px-2.5 py-1",
                  rarityBadgeClass,
                )}
              >
                {currentNft.rarity}
              </Badge>
              {currentNft.featured && (
                <Badge
                  variant="default"
                  className="gap-1 shadow-md bg-primary text-ink-deep font-semibold"
                >
                  <ShieldCheck className="size-3.5" />
                  <span>Destaque</span>
                </Badge>
              )}
            </div>
          </div>
        </div>

        {/* Painel Direito: Título, Preço e Detalhes */}
        <div className="space-y-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Badge
                variant="outline"
                className="font-mono text-xs uppercase text-primary border-primary/30"
              >
                {currentNft.category}
              </Badge>
              <span className="text-xs text-text-muted font-medium">
                {currentNft.collection?.name || "Coleção Exclusiva"}
              </span>
            </div>

            <h1 className="text-3xl sm:text-4xl font-extrabold text-foreground tracking-tight">
              {currentNft.title}
            </h1>

            <p className="text-sm text-text-muted leading-relaxed pt-2">
              {currentNft.description}
            </p>
          </div>

          {/* Preço de Aquisição */}
          <div className="p-4 bg-surface-dark border border-border rounded-card space-y-1">
            <span className="text-xs text-text-muted font-medium uppercase tracking-wider">
              Preço Atual
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl sm:text-4xl font-bold font-mono text-primary">
                {formatEth(currentNft.price)}
              </span>
              <span className="text-xs text-text-muted uppercase">
                ({currentNft.network})
              </span>
            </div>
          </div>

          {/* Edições ou Detalhes Técnicos */}
          {currentNft.editions && currentNft.editions.length > 0 && (
            <div className="space-y-2">
              <span className="text-xs text-text-muted font-semibold uppercase tracking-wider">
                Edições Disponíveis
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {currentNft.editions.map((ed) => (
                  <div
                    key={String(ed.id)}
                    className="p-3 bg-surface-raised border border-border rounded-button text-xs flex justify-between items-center"
                  >
                    <div>
                      <p className="font-medium text-foreground">{ed.label}</p>
                      <p className="text-[11px] text-text-muted">
                        {ed.available} de {ed.total} restantes
                      </p>
                    </div>
                    <span className="font-mono font-bold text-primary">
                      {formatEth(ed.price)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Botões de Ação */}
          <div className="flex flex-col sm:flex-row gap-3 pt-3">
            <Button
              onClick={handleToggleCart}
              variant={inCart ? "secondary" : "default"}
              className="flex-1 gap-2"
              size="lg"
            >
              {inCart ? (
                <>
                  <Check className="size-4 text-primary" />
                  <span>No Carrinho</span>
                </>
              ) : (
                <>
                  <ShoppingCart className="size-4" />
                  <span>Adicionar ao Carrinho</span>
                </>
              )}
            </Button>

            <Button asChild variant="outline" size="lg">
              <Link to="/checkout">Ir ao Checkout</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default NftDetailPage;
