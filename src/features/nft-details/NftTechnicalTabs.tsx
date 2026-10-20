import { type KeyboardEvent, useRef, useState } from "react";
import { Star } from "lucide-react";

import { cn } from "@/lib/utils";
import type { CollectorReview, NftDetail } from "./types";

export type TabKey = "details" | "reviews";

export interface NftTechnicalTabsProps {
  nft?: Partial<NftDetail>;
  activeTab?: TabKey;
  onTabChange?: (tab: TabKey) => void;
  className?: string;
}

export function NftTechnicalTabs({
  nft,
  activeTab: controlledActiveTab,
  onTabChange,
  className,
}: NftTechnicalTabsProps) {
  const [internalActiveTab, setInternalActiveTab] = useState<TabKey>("details");
  const detailsTabRef = useRef<HTMLButtonElement>(null);
  const reviewsTabRef = useRef<HTMLButtonElement>(null);

  const activeTab = controlledActiveTab ?? internalActiveTab;

  const handleTabChange = (tab: TabKey) => {
    if (controlledActiveTab === undefined) {
      setInternalActiveTab(tab);
    }
    onTabChange?.(tab);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>, current: TabKey) => {
    if (event.key === "ArrowRight" || event.key === "ArrowLeft") {
      event.preventDefault();
      const targetTab: TabKey = current === "details" ? "reviews" : "details";
      handleTabChange(targetTab);
      if (targetTab === "details") {
        detailsTabRef.current?.focus();
      } else {
        reviewsTabRef.current?.focus();
      }
    }
  };

  const contractAddress =
    nft?.contractAddress || "0x7A42b78C02B903E19eE94B8a46F77B08920119E8";
  const displayAddress = `${contractAddress.slice(0, 6)}...${contractAddress.slice(-4)}`;
  const blockchain = nft?.network
    ? nft.network.charAt(0).toUpperCase() + nft.network.slice(1)
    : "Ethereum";
  const tokenStandard = nft?.tokenStandard || "ERC-721";

  const defaultReviews: CollectorReview[] = [
    {
      id: "rev-1",
      author: "0x9b8...4a2",
      rating: 5,
      comment:
        "Arte incrível e finalização impecável. A resolução e os detalhes dos óculos e do colar são de outro nível!",
    },
    {
      id: "rev-2",
      author: "CryptoK",
      rating: 5,
      comment:
        "Procedência verificada na Ethereum certinha e metadados no IPFS. Kurio nunca decepciona.",
    },
  ];

  const reviewsList = nft?.reviews ?? defaultReviews;
  const reviewsCount = reviewsList.length;

  return (
    <section
      className={cn("pt-8 sm:pt-10 font-mono", className)}
      aria-label="Informações adicionais do NFT"
    >
      {/* Barra de Abas com Linha de Base */}
      <div
        role="tablist"
        aria-label="Abas de informações do NFT"
        className="relative border-b border-[#3F2319]/60 pb-3 flex items-center gap-6 sm:gap-8 text-base sm:text-[17px]"
      >
        {/* Aba: Detalhes do NFT */}
        <button
          ref={detailsTabRef}
          id="tab-details"
          type="button"
          role="tab"
          aria-selected={activeTab === "details"}
          aria-controls="panel-details"
          tabIndex={activeTab === "details" ? 0 : -1}
          onClick={() => handleTabChange("details")}
          onKeyDown={(e) => handleKeyDown(e, "details")}
          className={cn(
            "relative pb-3 -mb-3 font-bold transition-colors cursor-pointer select-none focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#D28A4C] rounded",
            activeTab === "details"
              ? "text-[#D28A4C]"
              : "text-[#F5F1EB]/70 hover:text-[#F5F1EB]",
          )}
        >
          Detalhes do NFT
          {activeTab === "details" && (
            <span className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-[#D28A4C] rounded-full" />
          )}
        </button>

        {/* Aba: Avaliações de colecionadores (19) */}
        <button
          ref={reviewsTabRef}
          id="tab-reviews"
          type="button"
          role="tab"
          aria-selected={activeTab === "reviews"}
          aria-controls="panel-reviews"
          tabIndex={activeTab === "reviews" ? 0 : -1}
          onClick={() => handleTabChange("reviews")}
          onKeyDown={(e) => handleKeyDown(e, "reviews")}
          className={cn(
            "relative pb-3 -mb-3 font-normal transition-colors cursor-pointer select-none focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#D28A4C] rounded",
            activeTab === "reviews"
              ? "text-[#D28A4C] font-bold"
              : "text-[#F5F1EB] hover:text-[#D28A4C]",
          )}
        >
          Avaliações de colecionadores ({reviewsCount > 0 ? reviewsCount : 0})
          {activeTab === "reviews" && (
            <span className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-[#D28A4C] rounded-full" />
          )}
        </button>
      </div>

      {/* Conteúdo da Aba: Detalhes do NFT */}
      {activeTab === "details" ? (
        <div
          id="panel-details"
          role="tabpanel"
          aria-labelledby="tab-details"
          className="pt-5 space-y-4 text-sm sm:text-[15px] leading-relaxed max-w-[1280px]"
        >
          {/* Parágrafo 1 */}
          <p className="text-[#CFB28C]">
            {nft?.description ||
              "Emerald Ape #042 é uma obra digital 1/50 finalizada à mão da coleção Kurio Editions. Cada atributo fica armazenado nos metadados do token e verificado na Ethereum. A obra explora identidade, movimento e luz em um mundo digital sem fronteiras."}
          </p>

          {/* Parágrafo 2 */}
          <p className="text-[#CFB28C]">
            A propriedade inclui a arte em alta resolução, lançamentos exclusivos para
            colecionadores e um registro permanente de procedência registrada na rede.
            Nova Sato recebe 5% de direitos autorais nas vendas secundárias, apoiando
            novos trabalhos e lançamentos da comunidade.
          </p>

          {/* Subtópico: Rede */}
          <div className="pt-2 space-y-0.5">
            <h3 className="text-[#F5F1EB] font-bold text-sm sm:text-[15.5px]">Rede:</h3>
            <p className="text-[#CFB28C]">
              Cunhado na {blockchain} com procedência imutável e metadados armazenados no
              IPFS.
            </p>
          </div>

          {/* Subtópico: Contrato */}
          <div className="pt-2 space-y-0.5">
            <h3 className="text-[#F5F1EB] font-bold text-sm sm:text-[15.5px]">
              Contrato:
            </h3>
            <p className="text-[#CFB28C]">
              Direitos autorais do criador: 5% nas vendas secundárias, pagos
              automaticamente pelos mercados compatíveis.
            </p>
          </div>

          {/* Subtópico: Direitos autorais */}
          <div className="pt-2 space-y-0.5">
            <h3 className="text-[#F5F1EB] font-bold text-sm sm:text-[15.5px]">
              Direitos autorais:
            </h3>
            <p className="text-[#CFB28C]">
              {displayAddress} • Contrato inteligente {tokenStandard} verificado.
            </p>
          </div>
        </div>
      ) : (
        /* Conteúdo da Aba: Avaliações de colecionadores */
        <div
          id="panel-reviews"
          role="tabpanel"
          aria-labelledby="tab-reviews"
          className="pt-5 space-y-3.5 max-w-[1280px]"
        >
          {reviewsList.length === 0 ? (
            <div className="p-6 rounded-xl bg-[#1E1410] border border-[#3F2319]/60 text-center space-y-1.5">
              <p className="text-[#F5F1EB] font-semibold text-sm sm:text-[15px]">
                Nenhuma avaliação de colecionador ainda.
              </p>
              <p className="text-xs sm:text-[13.5px] text-[#CFB28C]">
                Seja o primeiro colecionador a avaliar esta obra após adquiri-la.
              </p>
            </div>
          ) : (
            reviewsList.map((review) => (
              <div
                key={review.id}
                className="p-4.5 rounded-xl bg-[#1E1410] border border-[#3F2319]/60 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[#F5F1EB] font-bold text-sm sm:text-[15px]">
                    {review.author}
                  </span>
                  <div className="flex items-center gap-0.5 text-[#D28A4C]">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={cn(
                          "size-4",
                          i < review.rating
                            ? "fill-[#D28A4C] text-[#D28A4C]"
                            : "fill-[#3F2319]/40 text-[#6B4B3D]/70",
                        )}
                        aria-hidden="true"
                      />
                    ))}
                  </div>
                </div>
                <p className="text-sm sm:text-[14.5px] text-[#CFB28C]">
                  {review.comment}
                </p>
              </div>
            ))
          )}
        </div>
      )}
    </section>
  );
}

export default NftTechnicalTabs;
