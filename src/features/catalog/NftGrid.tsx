/**
 * Grid Acessível e Responsivo do Catálogo de NFTs (NftGrid).
 *
 * Gerencia de forma declarativa e acessível os 4 estados de interface:
 * 1. Loading: skeletons proporcionais com aria-busy="true" e contagem configurável.
 * 2. Erro: alerta acessível (role="alert") com ação de retry.
 * 3. Vazio: feedback com ilustração sutil e ação de reset de filtros.
 * 4. Dados: renderização em grid responsivo com chaves estáveis.
 */
import { AlertTriangle, FilterX, PackageSearch, RotateCcw } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { Nft } from "@/contracts/catalog";
import { cn } from "@/lib/utils";
import { NftCard } from "./NftCard";
import { NftCardSkeleton } from "./NftCardSkeleton";

export interface NftGridProps {
  items?: Nft[];
  isLoading?: boolean;
  error?: Error | null;
  onRetry?: () => void;
  onClearFilters?: () => void;
  skeletonCount?: number;
  className?: string;
  onAddToCart?: (nft: Nft) => void;
}

export function NftGrid({
  items,
  isLoading = false,
  error = null,
  onRetry,
  onClearFilters,
  skeletonCount = 8,
  className,
  onAddToCart,
}: NftGridProps) {
  // 1. Estado de Carregamento
  if (isLoading) {
    return (
      <section
        aria-busy="true"
        aria-label="Carregando catálogo de NFTs"
        className={cn(
          "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6",
          className,
        )}
      >
        {Array.from({ length: skeletonCount }).map((_, index) => (
          <NftCardSkeleton key={`catalog-skeleton-${index}`} />
        ))}
      </section>
    );
  }

  // 2. Estado de Erro
  if (error) {
    return (
      <div
        role="alert"
        className={cn(
          "flex min-h-[350px] w-full flex-col items-center justify-center gap-4 rounded-card border border-error/30 bg-surface-dark/60 p-8 text-center backdrop-blur-sm",
          className,
        )}
      >
        <div className="flex size-14 items-center justify-center rounded-full bg-error/10 border border-error/20 text-error">
          <AlertTriangle className="size-7 stroke-[2]" aria-hidden="true" />
        </div>
        <div className="max-w-md space-y-1">
          <h3 className="text-lg font-bold tracking-tight text-foreground">
            Falha ao carregar catálogo
          </h3>
          <p className="text-sm text-text-muted leading-relaxed">
            {error.message ||
              "Não foi possível carregar os NFTs no momento. Por favor, tente novamente."}
          </p>
        </div>
        {onRetry && (
          <Button
            type="button"
            onClick={onRetry}
            variant="default"
            className="mt-2 bg-primary text-ink-deep hover:bg-primary-dark font-semibold gap-2"
          >
            <RotateCcw className="size-4" aria-hidden="true" />
            <span>Tentar novamente</span>
          </Button>
        )}
      </div>
    );
  }

  // 3. Estado Vazio
  if (!items || items.length === 0) {
    return (
      <div
        className={cn(
          "flex min-h-[350px] w-full flex-col items-center justify-center gap-4 rounded-card border border-border/80 bg-surface-dark/40 p-8 text-center backdrop-blur-sm",
          className,
        )}
      >
        <div className="flex size-14 items-center justify-center rounded-full bg-surface-raised border border-border text-text-muted">
          <PackageSearch className="size-7 stroke-[1.8]" aria-hidden="true" />
        </div>
        <div className="max-w-md space-y-1">
          <h3 className="text-lg font-bold tracking-tight text-foreground">
            Nenhum NFT encontrado
          </h3>
          <p className="text-sm text-text-muted leading-relaxed">
            Nenhum NFT encontrado para os filtros selecionados. Tente ajustar os termos de
            busca ou limpar os filtros aplicados.
          </p>
        </div>
        {onClearFilters && (
          <Button
            type="button"
            onClick={onClearFilters}
            variant="outline"
            className="mt-2 border-border text-foreground hover:bg-surface-raised gap-2"
          >
            <FilterX className="size-4" aria-hidden="true" />
            <span>Limpar filtros</span>
          </Button>
        )}
      </div>
    );
  }

  // 4. Estado com Dados
  return (
    <section
      aria-busy="false"
      aria-label="Grade do catálogo de NFTs"
      className={cn(
        "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6",
        className,
      )}
    >
      {items.map((nft) => (
        <NftCard key={nft.id} nft={nft} onAddToCart={onAddToCart} />
      ))}
    </section>
  );
}

export default NftGrid;
