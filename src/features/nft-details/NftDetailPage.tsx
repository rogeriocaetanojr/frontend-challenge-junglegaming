import { useState } from "react";
import { Link } from "react-router-dom";
import { AlertCircle, ArrowLeft, Heart, Mail, Minus, Plus, Star } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { formatEth } from "@/lib/formatters";
import { cn } from "@/lib/utils";
import { useCartStore } from "@/store/cart-store";
import { NftImageGallery } from "./NftImageGallery";
import { useNftDetail } from "./queries";
import type { NftDetail } from "./types";

export interface NftDetailPageProps {
  nftId?: string;
  initialData?: NftDetail;
}

export function NftDetailPage({ nftId = "1", initialData }: NftDetailPageProps) {
  const { data: nft, isLoading, isError } = useNftDetail(nftId);
  const currentNft = nft ?? initialData;

  const [quantity, setQuantity] = useState(1);
  const [selectedEdition, setSelectedEdition] = useState("1/50");
  const [isFavorite, setIsFavorite] = useState(false);

  const addItem = useCartStore((state) => state.addItem);

  const handleBuy = () => {
    if (!currentNft) return;

    addItem({
      id: String(currentNft.id),
      name: currentNft.title,
      collection: currentNft.collection?.name || "Kurio Apes",
      priceEth: currentNft.price,
      image: currentNft.images?.[0]?.url || "/images/nfts/emerald-ape.png",
      creator: currentNft.creator?.name || "Kurio Editions",
      quantity: 1,
    });
  };

  const handleDecreaseQuantity = () => {
    setQuantity((prev) => Math.max(1, prev - 1));
  };

  const handleIncreaseQuantity = () => {
    setQuantity((prev) => prev + 1);
  };

  if (isLoading && !currentNft) {
    return (
      <div className="w-full py-8 space-y-6">
        <Skeleton className="h-8 w-36" />
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <Skeleton className="lg:col-span-7 aspect-square w-full rounded-[24px]" />
          <div className="lg:col-span-5 space-y-6">
            <Skeleton className="h-10 w-3/4" />
            <Skeleton className="h-8 w-44" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-14 w-full" />
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
          <h1 className="text-2xl font-bold text-foreground font-mono">
            NFT Não Encontrado
          </h1>
          <p className="text-sm text-text-muted font-mono">
            O token #{nftId} não pôde ser localizado ou foi deslistado.
          </p>
        </div>
        <Button asChild size="lg">
          <Link to="/">
            <ArrowLeft className="size-4 mr-2" />
            <span>Voltar ao Mercado</span>
          </Link>
        </Button>
      </div>
    );
  }

  // Prepara atributos formatados para exibição
  const attributesText = "Óculos, Esmeralda, Raro";
  const tokenIdText = "#0042";
  const collectionText = "Kurio Apes";
  const editionOptions = ["1/1", "1/10", "1/50", "ABERTA"];

  return (
    <div className="w-full py-6 sm:py-8 space-y-6 font-mono text-[#F5F1EB]">
      {/* Breadcrumb alinhado perfeitamente com a logo do topo */}
      <nav
        aria-label="Navegação estrutural"
        className="font-mono text-base sm:text-[18px] lg:text-[19px] tracking-tight font-bold"
      >
        <ol className="flex items-center gap-2.5 text-[#F5F1EB]">
          <li>
            <Link
              to="/"
              className="text-[#F5F1EB] hover:text-[#D28A4C] transition-colors"
            >
              Início
            </Link>
          </li>
          <li className="text-[#F5F1EB]/60 font-light" aria-hidden="true">
            /
          </li>
          <li className="text-[#F5F1EB]" aria-current="page">
            Mercado
          </li>
        </ol>
      </nav>

      {/* Grid Principal: Esquerda (Galeria) | Direita (Detalhes e Ações) */}
      <div className="flex flex-col lg:flex-row gap-6 lg:gap-8 items-start pt-2">
        {/* Painel Esquerdo: Galeria com 4 miniaturas e imagem principal com zoom */}
        <div className="shrink-0 flex justify-start">
          <NftImageGallery
            images={currentNft.images}
            title={currentNft.title}
            rarity={currentNft.rarity}
            featured={currentNft.featured}
          />
        </div>

        {/* Painel Direito: Conteúdo e Tipografia FIEL À REFERÊNCIA KURIO */}
        <div className="flex-1 flex flex-col space-y-3.5 sm:space-y-4 select-none w-full">
          {/* Título Principal */}
          <h1 className="text-3xl sm:text-[34px] lg:text-[38px] font-bold text-[#F5F1EB] tracking-tight leading-none font-mono">
            {currentNft.title}
          </h1>

          {/* Preço em ETH + Estrelas de Avaliação + Contagem */}
          <div className="space-y-2">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <span className="text-2xl sm:text-[27px] font-bold text-[#D28A4C] font-mono leading-none tracking-tight">
                {formatEth(currentNft.price)}
              </span>

              <div className="flex items-center gap-1.5 text-xs sm:text-[14.5px] text-[#F5F1EB] font-mono">
                <div className="flex items-center gap-0.5 text-[#D28A4C]">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className="size-3.5 fill-[#D28A4C] text-[#D28A4C]"
                      aria-hidden="true"
                    />
                  ))}
                </div>
                <span>19 avaliações de colecionadores</span>
              </div>
            </div>

            {/* Linha Divisória sutil */}
            <hr className="border-t border-[#3F2319]/50" />
          </div>

          {/* Seção Sobre este NFT aproximada da divisória */}
          <div className="space-y-1">
            <h2 className="text-sm sm:text-[16px] font-bold text-[#F5F1EB] font-mono">
              Sobre este NFT:
            </h2>
            <p className="text-xs sm:text-[14px] text-[#CFB28C] leading-relaxed font-mono font-normal max-w-[620px]">
              Um colecionável digital finalizado à mão da coleção Kurio Editions,
              verificado na Ethereum, com arte desbloqueável e acesso para colecionadores.
            </p>
          </div>

          {/* Seletor de Edição aproximado do texto acima */}
          <div className="space-y-1.5">
            <span className="text-sm sm:text-[15.5px] font-bold text-[#F5F1EB] font-mono block">
              Edição:
            </span>
            <div
              className="flex items-center gap-2 sm:gap-2.5 flex-wrap"
              role="radiogroup"
              aria-label="Selecione a edição"
            >
              {editionOptions.map((edition) => {
                const isSelected = selectedEdition === edition;
                return (
                  <button
                    key={edition}
                    type="button"
                    role="radio"
                    aria-checked={isSelected}
                    onClick={() => setSelectedEdition(edition)}
                    className={cn(
                      "px-3.5 py-1 rounded-full text-xs sm:text-[13px] font-mono font-semibold transition-all duration-200 cursor-pointer border focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#D28A4C]",
                      isSelected
                        ? "border-[#D28A4C] text-[#D28A4C] bg-transparent shadow-sm"
                        : "border-[#3F2319] text-[#F5F1EB]/70 hover:border-[#D28A4C]/50 hover:text-[#F5F1EB] bg-transparent",
                    )}
                  >
                    {edition}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Controles de Quantidade & Botões de Ação COMPRAR / Favoritar */}
          <div className="flex items-center justify-between gap-3 pt-1 flex-wrap">
            {/* Contador Circular [-] 1 [+] */}
            <div className="flex items-center gap-2.5 bg-transparent shrink-0">
              <button
                type="button"
                onClick={handleDecreaseQuantity}
                disabled={quantity <= 1}
                aria-label="Diminuir quantidade"
                className="size-8.5 rounded-full bg-[#D28A4C] text-[#0E0907] flex items-center justify-center hover:bg-[#c47b3e] disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
              >
                <Minus className="size-3.5 stroke-[2.8]" />
              </button>
              <span className="w-6 text-center text-sm sm:text-[16px] font-bold font-mono text-[#F5F1EB]">
                {quantity}
              </span>
              <button
                type="button"
                onClick={handleIncreaseQuantity}
                aria-label="Aumentar quantidade"
                className="size-8.5 rounded-full bg-[#D28A4C] text-[#0E0907] flex items-center justify-center hover:bg-[#c47b3e] transition-colors cursor-pointer"
              >
                <Plus className="size-3.5 stroke-[2.8]" />
              </button>
            </div>

            {/* Grupo de Botões Comprar e Favoritar alinhados à direita */}
            <div className="flex items-center gap-3 flex-1 justify-end">
              <button
                type="button"
                onClick={handleBuy}
                className="min-w-[130px] sm:min-w-[150px] h-9.5 px-6 rounded-lg bg-[#D28A4C] hover:bg-[#c47b3e] text-[#0E0907] font-mono text-xs sm:text-[14px] font-bold uppercase tracking-wider transition-colors shadow-sm cursor-pointer flex items-center justify-center"
              >
                COMPRAR
              </button>

              <button
                type="button"
                onClick={() => setIsFavorite(!isFavorite)}
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

          {/* Metadados Técnicos em #CFB28C aproximados para cima com fonte maior */}
          <div className="space-y-1 pt-0.5 text-xs sm:text-[14.5px] text-[#CFB28C] font-mono">
            <p>ID do token: {tokenIdText}</p>
            <p>Coleção: {collectionText}</p>
            <p>Atributos: {attributesText}</p>
          </div>

          {/* Compartilhamento Social: espaçado um pouco para baixo e com fonte maior */}
          <div className="flex items-center gap-3.5 pt-2.5 sm:pt-3 text-sm sm:text-[16px] font-mono text-[#F5F1EB]">
            <span className="font-bold">Compartilhar este NFT:</span>
            <div className="flex items-center gap-3.5 text-[#F5F1EB]/85">
              <a
                href="https://linkedin.com"
                target="_blank"
                rel="noreferrer"
                aria-label="Compartilhar no LinkedIn"
                className="hover:text-[#D28A4C] transition-colors inline-flex items-center justify-center"
              >
                <svg
                  className="size-5 fill-current"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 8.76a1.6 1.6 0 1 0 0-3.2 1.6 1.6 0 0 0 0 3.2m1.4 9.74v-8.37H5.06v8.37h2.8z" />
                </svg>
              </a>
              <a
                href="mailto:?subject=Confira este NFT no KURIO"
                aria-label="Compartilhar por e-mail"
                className="hover:text-[#D28A4C] transition-colors inline-flex items-center justify-center"
              >
                <Mail className="size-5" />
              </a>
              <a
                href="https://twitter.com"
                target="_blank"
                rel="noreferrer"
                aria-label="Compartilhar no Twitter / X"
                className="hover:text-[#D28A4C] transition-colors inline-flex items-center justify-center"
              >
                <svg
                  className="size-5 fill-current"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default NftDetailPage;
