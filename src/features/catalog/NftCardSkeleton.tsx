/**
 * Skeleton Acessível do Card de NFT (NftCardSkeleton).
 *
 * Em conformidade estrita com WCAG 2.1 AA:
 * - Container com `aria-busy="true"` sinalizando carregamento iminente.
 * - Elementos puramente visuais com `aria-hidden="true"`.
 * - Descrição acessível para leitores de tela via classe `.sr-only`.
 * - Efeito de pulso sincronizado com o tema.
 */
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export interface NftCardSkeletonProps {
  className?: string;
}

export function NftCardSkeleton({ className }: NftCardSkeletonProps) {
  return (
    <article
      aria-busy="true"
      className={cn(
        "flex flex-col justify-between overflow-hidden rounded-card border border-border bg-surface-dark p-3.5 shadow-sm",
        className,
      )}
    >
      <div className="flex flex-col space-y-3">
        {/* Imagem Placeholder */}
        <div
          aria-hidden="true"
          className="aspect-square w-full rounded-button bg-surface-raised animate-pulse"
        />

        {/* Linha de Coleção e Badge */}
        <div
          aria-hidden="true"
          className="flex items-center justify-between gap-2 pt-0.5"
        >
          <Skeleton aria-hidden="true" className="h-3.5 w-24" />
          <Skeleton aria-hidden="true" className="h-4 w-14 rounded-badge" />
        </div>

        {/* Título Placeholder */}
        <div aria-hidden="true" className="pt-0.5">
          <Skeleton aria-hidden="true" className="h-5 w-3/4" />
        </div>
      </div>

      {/* Rodapé com Preço */}
      <div
        aria-hidden="true"
        className="mt-4 flex items-center justify-between border-t border-border/60 pt-3"
      >
        <div aria-hidden="true" className="space-y-1">
          <Skeleton aria-hidden="true" className="h-3 w-8" />
          <Skeleton aria-hidden="true" className="h-4 w-16" />
        </div>
        <Skeleton aria-hidden="true" className="h-7 w-16 rounded-button" />
      </div>

      <span className="sr-only">Carregando informações do NFT...</span>
    </article>
  );
}

export default NftCardSkeleton;
