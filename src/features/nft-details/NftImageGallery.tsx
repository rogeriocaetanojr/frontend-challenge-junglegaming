/**
 * Componente de Galeria de Imagens de NFT (NftImageGallery).
 *
 * Estrutura visual fiel à referência oficial KURIO:
 * - Coluna de 4 miniaturas verticais à esquerda com bordas arredondadas e seleção ativa em laranja (#D28A4C).
 * - Imagem principal destacada ao lado em moldura escura (#140D0A) arredondada, com altura calibrada em relação à pilha de fotos.
 * - Botão de lupa no canto superior direito para acionar visualização em tela cheia/zoom.
 * - Modal fullscreen com role="dialog", aria-modal="true" e fechamento via tecla Escape, clique no backdrop ou botão de fechar.
 */
import { useEffect, useRef, useState } from "react";
import { Search, X, ZoomIn } from "lucide-react";

import { cn } from "@/lib/utils";

export interface NftImageGalleryProps {
  images?: Array<{ url: string; alt: string }>;
  title: string;
  rarity?: string;
  featured?: boolean;
  className?: string;
}

const FALLBACK_IMAGE = "/images/nfts/emerald-ape.png";

export function NftImageGallery({ images, title, className }: NftImageGalleryProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [imgLoaded, setImgLoaded] = useState(false);
  const [imgFailed, setImgFailed] = useState(false);

  const triggerButtonRef = useRef<HTMLButtonElement | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);

  const primaryAlt = images?.[0]?.alt || title;
  const fallbackList = [
    { url: images?.[0]?.url || FALLBACK_IMAGE, alt: primaryAlt },
    {
      url: images?.[1]?.url || images?.[0]?.url || FALLBACK_IMAGE,
      alt: images?.[1]?.alt || `${primaryAlt} - Ângulo 2`,
    },
    {
      url: images?.[2]?.url || images?.[0]?.url || FALLBACK_IMAGE,
      alt: images?.[2]?.alt || `${primaryAlt} - Ângulo 3`,
    },
    {
      url: images?.[3]?.url || images?.[0]?.url || FALLBACK_IMAGE,
      alt: images?.[3]?.alt || `${primaryAlt} - Ângulo 4`,
    },
  ];

  const currentList = images && images.length >= 4 ? images.slice(0, 4) : fallbackList;
  const currentImage = currentList[0]?.url || FALLBACK_IMAGE;
  const currentAlt = currentList[0]?.alt || title;

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
    <div
      className={cn(
        "flex flex-col sm:flex-row max-md:flex-col! items-stretch gap-4 sm:gap-5 w-full",
        className,
      )}
    >
      {/* 1. Coluna de 4 miniaturas verticais alinhadas à esquerda */}
      <div
        className="max-md:hidden! flex sm:flex-col gap-3.5 sm:gap-4 w-full sm:w-auto shrink-0 justify-between sm:justify-start overflow-x-auto sm:overflow-visible pb-1 sm:pb-0"
        aria-label="Miniaturas de fotos do NFT"
      >
        {currentList.map((img, idx) => (
          <div
            key={idx}
            className="relative size-20 sm:size-[104px] md:size-[112px] lg:size-[116px] rounded-[16px] sm:rounded-[20px] overflow-hidden bg-[#1E1410] border border-[#2E1A13]/80 shrink-0 shadow-sm"
          >
            <img
              src={img.url}
              alt={img.alt}
              onError={(e) => {
                (e.target as HTMLImageElement).src = FALLBACK_IMAGE;
              }}
              className="size-full object-cover select-none pointer-events-none"
            />
          </div>
        ))}
      </div>

      {/* 2. Moldura escura (sombra/box) com a MESMA ALTURA das 4 fotos em cima e em baixo, centralizando a imagem maior no meio vertical */}
      <div className="relative shrink-0 w-full sm:w-[480px] md:w-[500px] lg:w-[512px] max-md:w-full! max-md:p-0! max-md:border-0! max-md:rounded-[28px]! self-stretch rounded-[24px] sm:rounded-[28px] bg-[#140D0A] border border-[#2E1A13]/85 p-3.5 sm:p-4 shadow-2xl flex items-center justify-center overflow-hidden">
        {/* Placeholder / Skeleton de Carregamento */}
        {!imgLoaded && !imgFailed && (
          <div
            data-testid="gallery-skeleton"
            className="absolute inset-3.5 sm:inset-4 rounded-[18px] sm:rounded-[22px] animate-pulse bg-[#1E1410]"
          />
        )}

        {/* Imagem do NFT centralizada no meio vertical entre o topo e a base das 4 fotos */}
        <div className="relative aspect-square max-h-full w-full overflow-hidden rounded-[18px] sm:rounded-[22px] flex items-center justify-center">
          <img
            src={imgFailed ? FALLBACK_IMAGE : currentImage}
            alt={currentAlt}
            onLoad={() => setImgLoaded(true)}
            onError={() => {
              setImgFailed(true);
              setImgLoaded(true);
            }}
            className={cn(
              "size-full object-cover transition-transform duration-500 ease-out select-none",
              !imgLoaded && "opacity-0",
            )}
          />

          {/* Botão de Lupa (Zoom/Fullscreen) no canto superior direito da imagem */}
          <button
            ref={triggerButtonRef}
            type="button"
            onClick={() => setIsOpen(true)}
            aria-label="Ampliar imagem do NFT"
            className="absolute top-3.5 right-3.5 flex items-center justify-center size-9 sm:size-10 rounded-full bg-[#0E0907]/80 backdrop-blur-md border border-[#F5F1EB]/20 text-[#F5F1EB] transition-all duration-200 hover:bg-[#D28A4C] hover:text-[#0E0907] hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D28A4C] shadow-lg cursor-pointer"
          >
            <Search className="size-4 sm:size-4.5 stroke-[2.2]" aria-hidden="true" />
          </button>
        </div>
      </div>

      {/* 3. Modal Acessível em Tela Cheia */}
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
            className="fixed inset-0 size-full bg-black/90 backdrop-blur-md animate-in fade-in duration-200 cursor-default border-none focus:outline-none"
          />

          <div className="relative z-10 max-w-4xl max-h-[90vh] w-full flex flex-col items-center">
            {/* Botão de Fechar */}
            <button
              ref={closeButtonRef}
              type="button"
              onClick={() => setIsOpen(false)}
              aria-label="Fechar visualização ampliada"
              className="absolute -top-12 right-0 flex items-center justify-center size-9 rounded-full bg-[#140D0A] border border-[#F5F1EB]/20 text-[#F5F1EB] hover:bg-[#D28A4C] hover:text-[#0E0907] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D28A4C] cursor-pointer"
            >
              <X className="size-5" aria-hidden="true" />
            </button>

            {/* Imagem Ampliada */}
            <div className="relative overflow-hidden rounded-2xl border border-[#F5F1EB]/10 bg-[#140D0A] max-h-[80vh] shadow-2xl flex items-center justify-center p-2">
              <img
                src={imgFailed ? FALLBACK_IMAGE : currentImage}
                alt={currentAlt}
                className="max-h-[76vh] w-auto max-w-full rounded-xl object-contain select-none"
              />
            </div>

            {/* Legenda Informativa */}
            <div className="mt-3 text-center">
              <p className="text-sm font-medium font-mono text-[#F5F1EB]">{title}</p>
              <p className="text-xs text-[#F5F1EB]/60 flex items-center justify-center gap-1.5 mt-0.5 font-mono">
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
