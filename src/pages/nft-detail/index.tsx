import { Link, useParams } from "react-router-dom";
import { AlertCircle, ArrowLeft, Check, ShieldCheck, ShoppingCart } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useNft } from "@/hooks/use-nfts";
import { formatEth, formatUsd, truncateAddress } from "@/lib/formatters";
import { useCartStore } from "@/store/cart-store";

export function NftDetailPage() {
  const { id } = useParams<{ id: string }>();
  const nftId = id ?? "1";

  const { data: nft, isLoading, isError } = useNft(nftId);

  const addItem = useCartStore((state) => state.addItem);
  const removeItem = useCartStore((state) => state.removeItem);
  const inCart = useCartStore((state) => state.isInCart(nftId));

  const handleToggleCart = () => {
    if (!nft) return;

    if (inCart) {
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

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <Skeleton className="h-8 w-36" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
          <Skeleton className="aspect-square w-full rounded-card" />
          <div className="space-y-6">
            <div className="space-y-3">
              <Skeleton className="h-6 w-28" />
              <Skeleton className="h-10 w-3/4" />
              <Skeleton className="h-16 w-full" />
            </div>
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (isError || !nft) {
    return (
      <div className="max-w-md mx-auto text-center py-16 space-y-6">
        <div className="size-20 mx-auto bg-surface-card border border-border rounded-full flex items-center justify-center text-text-muted">
          <AlertCircle className="size-10 text-primary" aria-hidden="true" />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-foreground">NFT Não Encontrado</h1>
          <p className="text-sm text-text-muted">
            O token #{nftId} não pôde ser localizado em nossa rede ou foi deslistado.
          </p>
        </div>
        <Button asChild size="lg">
          <Link to="/">
            <ArrowLeft className="size-4 mr-2" />
            <span>Voltar ao Marketplace</span>
          </Link>
        </Button>
      </div>
    );
  }

  const priceUsd = Number(nft.priceEth) * 3200;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Navegação de retorno */}
      <div>
        <Button
          asChild
          variant="ghost"
          size="sm"
          className="gap-1.5 text-text-muted hover:text-foreground"
        >
          <Link to="/">
            <ArrowLeft className="size-4" />
            <span>Voltar ao Marketplace</span>
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
        {/* Mídia do NFT */}
        <div className="relative aspect-square bg-surface-dark border border-border rounded-card overflow-hidden shadow-2xl">
          <img src={nft.image} alt={nft.name} className="size-full object-cover" />
          {nft.verified && (
            <div className="absolute top-3 left-3">
              <Badge variant="default" className="gap-1 shadow-md">
                <ShieldCheck className="size-3.5" />
                <span>Autenticado</span>
              </Badge>
            </div>
          )}
        </div>

        {/* Detalhes do NFT */}
        <div className="space-y-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="font-mono text-xs uppercase">
                {nft.category}
              </Badge>
              <span className="text-xs text-text-muted font-medium">
                {nft.collection.name}
              </span>
            </div>

            <h1 className="text-3xl font-extrabold text-foreground tracking-tight">
              {nft.name}
            </h1>

            <p className="text-sm text-text-muted leading-relaxed">{nft.description}</p>
          </div>

          {/* Criador */}
          <div className="p-3 bg-surface-dark border border-border rounded-button flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img
                src={nft.creator.avatar}
                alt={nft.creator.name}
                className="size-10 rounded-full object-cover border border-border"
              />
              <div>
                <p className="text-xs text-text-muted">Criador</p>
                <p className="text-sm font-semibold text-foreground">
                  {nft.creator.name}
                </p>
              </div>
            </div>
            <span className="font-mono text-xs text-text-muted">
              {truncateAddress(nft.creator.address)}
            </span>
          </div>

          {/* Preço */}
          <div className="p-4 bg-surface-dark border border-border rounded-button space-y-1">
            <span className="text-xs text-text-muted font-medium uppercase tracking-wider">
              Preço Atual
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold font-mono text-primary">
                {formatEth(nft.priceEth)}
              </span>
              <span className="text-sm text-text-muted">
                (aprox. {formatUsd(priceUsd)})
              </span>
            </div>
          </div>

          {/* Atributos / Propriedades */}
          {nft.attributes.length > 0 && (
            <div className="space-y-2">
              <span className="text-xs text-text-muted font-semibold uppercase tracking-wider">
                Propriedades
              </span>
              <div className="grid grid-cols-2 gap-2">
                {nft.attributes.map((attr, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 bg-surface-card border border-border rounded-button text-center space-y-0.5"
                  >
                    <p className="text-[10px] font-semibold text-primary uppercase">
                      {attr.trait_type}
                    </p>
                    <p className="text-xs font-medium text-foreground truncate">
                      {attr.value}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Ações */}
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
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
              <Link to="/checkout">Ir ao Carrinho</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
