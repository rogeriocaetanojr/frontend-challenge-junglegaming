import { useState } from "react";
import { Link } from "react-router-dom";
import { AlertCircle, ArrowLeft, Mail, Star } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useCartStore } from "@/store/cart-store";
import { NftActionPanel } from "./NftActionPanel";
import { NftDetailHeader } from "./NftDetailHeader";
import { NftImageGallery } from "./NftImageGallery";
import { NftTechnicalTabs } from "./NftTechnicalTabs";
import { useNftDetail } from "./queries";
import type { NftDetail } from "./types";

export interface NftDetailPageProps {
  nftId?: string;
  initialData?: NftDetail;
}

export function NftDetailPage({ nftId = "1", initialData }: NftDetailPageProps) {
  const { data: nft, isLoading, isError } = useNftDetail(nftId);
  const currentNft = nft ?? initialData;

  const [selectedEdition, setSelectedEdition] = useState("1/50");
  const [activeTab, setActiveTab] = useState<"details" | "reviews">("details");
  const [userRating, setUserRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number | null>(null);

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
          {/* Header oficial com título da obra */}
          <NftDetailHeader
            nft={{
              title: currentNft.title,
              price: currentNft.price,
            }}
          />

          {/* Preço em ETH + Estrelas de Avaliação + Contagem */}
          <div className="space-y-2">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <span className="text-2xl sm:text-[27px] font-bold text-[#D28A4C] font-mono leading-none tracking-tight">
                {currentNft.price} ETH
              </span>

              <div className="flex items-center gap-1.5 text-xs sm:text-[14.5px] text-[#F5F1EB] font-mono">
                <div
                  className="flex items-center gap-1"
                  role="radiogroup"
                  aria-label="Avaliação por estrelas"
                >
                  {[1, 2, 3, 4, 5].map((starValue) => {
                    const isFilled = starValue <= (hoverRating ?? userRating);
                    return (
                      <button
                        key={starValue}
                        type="button"
                        role="radio"
                        aria-checked={userRating === starValue}
                        aria-label={`Avaliar com ${starValue} estrela${starValue > 1 ? "s" : ""}`}
                        onClick={() => setUserRating(starValue)}
                        onMouseEnter={() => setHoverRating(starValue)}
                        onMouseLeave={() => setHoverRating(null)}
                        className="p-0.5 -m-0.5 rounded focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#D28A4C] cursor-pointer transition-transform hover:scale-115"
                      >
                        <Star
                          className={cn(
                            "size-3.5 transition-colors duration-150",
                            isFilled
                              ? "fill-[#D28A4C] text-[#D28A4C]"
                              : "fill-[#3F2319]/40 text-[#6B4B3D]/70",
                          )}
                          aria-hidden="true"
                        />
                      </button>
                    );
                  })}
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
          <NftActionPanel onBuy={handleBuy} />

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

      {/* Seção Inferior: Abas "Detalhes do NFT" / "Avaliações de colecionadores (19)" FIEL À REFERÊNCIA */}
      <NftTechnicalTabs
        nft={currentNft}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      {/* Seção Inferior: "Mais desta coleção" FIEL À REFERÊNCIA KURIO */}
      <section className="pt-10 sm:pt-14 pb-8 font-mono" aria-label="Mais desta coleção">
        {/* Título com linha divisória sutil */}
        <div className="space-y-3">
          <h2 className="text-[#D28A4C] text-base sm:text-[17px] font-bold tracking-tight">
            Mais desta coleção
          </h2>
          <hr className="border-t border-[#3F2319]/50" />
        </div>

        {/* Grid dos 5 cards da coleção */}
        <div className="pt-6 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-5 items-start">
          {[
            {
              id: "118",
              name: "Cosmic Bloom #118",
              price: "1.29 ETH",
              image: "/images/nfts/sage-nomad.png",
            },
            {
              id: "314",
              name: "Violet Nomad #314",
              price: "1.39 ETH",
              image: "/images/nfts/sage-nomad.png",
            },
            {
              id: "088",
              name: "Ivory Baron #088",
              price: "1.79 ETH",
              image: "/images/nfts/noct-vessel.png",
            },
            {
              id: "207",
              name: "Golden Beat #207",
              price: "0.99 ETH",
              image: "/images/nfts/golden-bear.png",
            },
            {
              id: "160",
              name: "Golden Signal #160",
              price: "0.39 ETH",
              image: "/images/nfts/golden-bear.png",
            },
          ].map((item) => (
            <Link
              key={item.id}
              to={`/nft/${item.id}`}
              className="group flex flex-col space-y-2.5 cursor-pointer select-none transition-transform duration-200 hover:-translate-y-1"
            >
              {/* Moldura escura com imagem arredondada */}
              <div className="relative aspect-square w-full rounded-[20px] bg-[#1E1410] border border-[#2E1A13]/85 p-3 flex items-center justify-center overflow-hidden shadow-md group-hover:border-[#D28A4C]/60 transition-colors">
                <img
                  src={item.image}
                  alt={item.name}
                  className="size-full object-cover rounded-[14px] select-none pointer-events-none transition-transform duration-300 group-hover:scale-105"
                />
              </div>

              {/* Informações: Nome e Preço */}
              <div className="space-y-0.5 text-xs sm:text-[13.5px]">
                <h3 className="text-[#F5F1EB] font-normal truncate group-hover:text-[#D28A4C] transition-colors">
                  {item.name}
                </h3>
                <p className="text-[#D28A4C] font-bold tracking-tight">{item.price}</p>
              </div>
            </Link>
          ))}
        </div>

        {/* Paginação Dots centralizada (o do meio preenchido fiel à imagem) */}
        <div
          className="flex items-center justify-center gap-2.5 pt-8 select-none"
          aria-hidden="true"
        >
          <span className="size-2 rounded-full border border-[#D28A4C] bg-transparent" />
          <span className="size-2 rounded-full bg-[#D28A4C]" />
          <span className="size-2 rounded-full border border-[#D28A4C] bg-transparent" />
        </div>
      </section>
    </div>
  );
}

export default NftDetailPage;
