/**
 * Componente de Galeria de Imagens de NFT com Zoom e Modal Fullscreen acessível.
 *
 * Em estrita conformidade com WCAG 2.1 AA:
 * - Imagem com fallback seguro de carregamento e alt descritivo.
 * - Botão acessível para acionar a visualização em zoom (aria-label="Ampliar imagem do NFT").
 * - Modal fullscreen com role="dialog", aria-modal="true" e aria-label="Visualização ampliada do NFT".
 * - Fechamento com tecla Escape, clique no backdrop ou botão de fechar.
 * - Gestão de foco (foco inicial no modal e restauração ao botão de acionamento ao fechar).
 */
import { useEffect, useRef, useState } from "react";
import { Maximize2, X, ZoomIn } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import type { NftRarity } from "@/contracts/catalog";
import { cn } from "@/lib/utils";

export interface NftImageGalleryProps {
  images?: Array<{ url: string; alt: string }>;
  title: string;
  rarity?: NftRarity;
  featured?: boolean;
  className?: string;
}

const FALLBACK_IMAGE = "/images/nfts/emerald-ape.png";

export function NftImageGallery({
  images,
  title,
  rarity,
  featured,
  className,
}: NftImageGalleryProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [imgLoaded, setImgLoaded] = useState(false);
  const [imgFailed, setImgFailed] = useState(false);

  const triggerButtonRef = useRef<HTMLButtonElement | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);

  const mainImage = images?.[0]?.url || FALLBACK_IMAGE;
  const imageAlt = images?.[0]?.alt || title;

  // Gerenciamento de foco e evento Escape para o Modal
  useEffect(() => {
    if (!isOpen) return;

    const previouslyFocused = triggerButtonRef.current;
    closeButtonRef.current?.focus();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        setIsOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      previouslyFocused?.focus();
    };
  }, [isOpen]);

  return (
    <div className={cn("space-y-4", className)}>
      <div className="group relative aspect-square w-full overflow-hidden rounded-card border border-border bg-surface-dark shadow-2xl">
        {/* Placeholder / Skeleton de Carregamento */}
        {!imgLoaded && !imgFailed && (
          <div
            data-testid="gallery-skeleton"
            className="absolute inset-0 animate-pulse bg-surface-raised"
          />
        )}

        {/* Imagem Principal */}
        <img
          src={imgFailed ? FALLBACK_IMAGE : mainImage}
          alt={imageAlt}
          onLoad={() => setImgLoaded(true)}
          onError={() => {
            setImgFailed(true);
            setImgLoaded(true);
          }}
          className={cn(
            "size-full object-cover transition-transform duration-500 ease-out group-hover:scale-105",
            !imgLoaded && "opacity-0",
          )}
        />

        {/* Badges Flutuantes */}
        <div className="absolute top-3 left-3 flex flex-wrap gap-2 pointer-events-none">
          {rarity && (
            <Badge
              variant="outline"
              className="text-xs font-semibold uppercase tracking-wider px-2.5 py-1 bg-surface-dark/80 backdrop-blur-md"
            >
              {rarity}
            </Badge>
          )}
          {featured && (
            <Badge
              variant="default"
              className="text-xs font-semibold px-2.5 py-1 bg-primary text-ink-deep"
            >
              Destaque
            </Badge>
          )}
        </div>

        {/* Botão Acessível de Abertura do Zoom/Fullscreen */}
        <button
          ref={triggerButtonRef}
          type="button"
          onClick={() => setIsOpen(true)}
          aria-label="Ampliar imagem do NFT"
          className="absolute bottom-3 right-3 flex items-center justify-center size-10 rounded-full bg-surface-dark/80 backdrop-blur-md border border-white/10 text-foreground transition-all duration-200 hover:bg-primary hover:text-ink-deep hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary shadow-lg"
        >
          <Maximize2 className="size-4" aria-hidden="true" />
        </button>
      </div>

      {/* Modal Acessível em Tela Cheia */}
      {isOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Visualização ampliada do NFT"
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
        >
          {/* Backdrop acessível */}
          <button
            type="button"
            tabIndex={-1}
            aria-label="Fechar visualização ampliada"
            onClick={() => setIsOpen(false)}
            className="fixed inset-0 size-full bg-black/85 backdrop-blur-md animate-in fade-in duration-200 cursor-default border-none focus:outline-none"
          />

          <div className="relative z-10 max-w-4xl max-h-[90vh] w-full flex flex-col items-center">
            {/* Botão de Fechar */}
            <button
              ref={closeButtonRef}
              type="button"
              onClick={() => setIsOpen(false)}
              aria-label="Fechar visualização ampliada"
              className="absolute -top-12 right-0 flex items-center justify-center size-9 rounded-full bg-surface-dark/90 border border-white/20 text-foreground hover:bg-primary hover:text-ink-deep transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              <X className="size-5" aria-hidden="true" />
            </button>

            {/* Imagem Ampliada */}
            <div className="relative overflow-hidden rounded-xl border border-white/10 bg-surface-dark max-h-[80vh] shadow-2xl flex items-center justify-center">
              <img
                src={imgFailed ? FALLBACK_IMAGE : mainImage}
                alt={imageAlt}
                className="max-h-[80vh] w-auto max-w-full object-contain select-none"
              />
            </div>

            {/* Legenda Informativa */}
            <div className="mt-3 text-center">
              <p className="text-sm font-medium text-foreground">{title}</p>
              <p className="text-xs text-text-muted flex items-center justify-center gap-1.5 mt-0.5">
                <ZoomIn className="size-3" aria-hidden="true" />
                <span>Pressione Escape ou clique fora para fechar</span>
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default NftImageGallery;
