import * as React from "react";

import type { NftCategory, NftNetwork } from "@/types/nft";

interface CatalogSidebarProps {
  selectedCategory?: string;
  onSelectCategory: (category?: NftCategory) => void;
  selectedNetwork?: NftNetwork;
  onSelectNetwork: (network?: NftNetwork) => void;
  onApplyPriceRange: (min: number, max: number) => void;
}

interface CollectionItem {
  id: NftCategory;
  name: string;
  count: number;
}

interface NetworkItem {
  id: NftNetwork;
  name: string;
  count: number;
}

const COLLECTIONS: CollectionItem[] = [
  { id: "art", name: "Arte digital", count: 33 },
  { id: "photography", name: "Fotografia", count: 12 },
  { id: "music", name: "Música", count: 55 },
  { id: "3d-art", name: "Arte 3D", count: 39 },
  { id: "collectibles", name: "Colecionáveis", count: 23 },
  { id: "generative", name: "Generativo", count: 17 },
  { id: "gaming", name: "Jogos", count: 15 },
  { id: "memberships", name: "Assinaturas", count: 10 },
  { id: "utility", name: "Utilidade", count: 16 },
];

const NETWORKS: NetworkItem[] = [
  { id: "ethereum", name: "Ethereum", count: 119 },
  { id: "polygon", name: "Polygon", count: 78 },
  { id: "solana", name: "Solana", count: 26 },
];

export function CatalogSidebar({
  selectedCategory,
  onSelectCategory,
  selectedNetwork,
  onSelectNetwork,
  onApplyPriceRange,
}: CatalogSidebarProps) {
  const [minPrice, setMinPrice] = React.useState<number>(0.02);
  const [maxPrice, setMaxPrice] = React.useState<number>(13.38);

  const handleApplyPrice = () => {
    onApplyPriceRange(minPrice, maxPrice);
  };

  return (
    <aside className="space-y-6" aria-label="Filtros do Catálogo">
      {/* 1. Card de Filtros (Coleções, Faixa de Preço, Rede) */}
      <div className="bg-[#241612] border border-[#38220F] rounded-2xl p-5 sm:p-6 space-y-6 text-left shadow-lg">
        {/* 1. Bloco Coleções */}
        <div className="space-y-3">
          <h3 className="font-mono text-xs sm:text-sm font-bold text-[#F5F1EB] tracking-wider uppercase">
            Coleções
          </h3>

          <nav className="flex flex-col space-y-1" aria-label="Categorias de coleções">
            {COLLECTIONS.map((item) => {
              const isSelected = selectedCategory === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onSelectCategory(isSelected ? undefined : item.id)}
                  className={`flex items-center justify-between w-full px-2.5 py-2 rounded-md text-xs sm:text-sm transition-colors cursor-pointer text-left font-mono ${
                    isSelected
                      ? "bg-[#D28A4C]/15 text-[#D28A4C] font-semibold"
                      : "text-[#CFB28C] hover:text-[#F5F1EB] hover:bg-[#140D0A]/40"
                  }`}
                  aria-pressed={isSelected}
                >
                  <span>{item.name}</span>
                  <span className="font-mono text-[#CFB28C]/60 text-xs">
                    ({item.count})
                  </span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* 2. Bloco Faixa de Preço */}
        <div className="space-y-4 pt-6 border-t border-[#38220F]">
          <h3 className="font-mono text-xs sm:text-sm font-bold text-[#F5F1EB] tracking-wider uppercase">
            Faixa de preço
          </h3>

          {/* Duplo Seletor Estilizado com Slider */}
          <div className="space-y-4">
            <div className="relative pt-2 pb-1">
              <div className="h-1.5 bg-[#140D0A] border border-[#3F2319] rounded-full w-full" />
              <div className="absolute top-2 left-1 right-8 h-1.5 bg-[#D28A4C] rounded-full" />
              {/* Handle Esquerdo */}
              <button
                type="button"
                className="absolute top-0.5 left-1 size-4 rounded-full bg-[#D28A4C] border-2 border-[#140D0A] cursor-pointer shadow focus:outline-none focus:ring-1 focus:ring-[#F5F1EB]"
                aria-label="Ajustar preço mínimo"
                onClick={() => setMinPrice((prev) => (prev > 0 ? 0 : 0.02))}
              />
              {/* Handle Direito */}
              <button
                type="button"
                className="absolute top-0.5 right-8 size-4 rounded-full bg-[#D28A4C] border-2 border-[#140D0A] cursor-pointer shadow focus:outline-none focus:ring-1 focus:ring-[#F5F1EB]"
                aria-label="Ajustar preço máximo"
                onClick={() => setMaxPrice((prev) => (prev < 15 ? 13.38 : 10))}
              />
            </div>

            <p className="text-xs text-[#CFB28C] font-mono">
              Preço: {minPrice.toFixed(2).replace(".", ",")} -{" "}
              {maxPrice.toFixed(2).replace(".", ",")} ETH
            </p>

            <button
              type="button"
              onClick={handleApplyPrice}
              className="w-full bg-[#D28A4C] hover:bg-[#c47b3e] text-[#0E0907] font-mono font-bold text-xs py-2 px-4 rounded-md tracking-wider uppercase transition-colors shadow-md shadow-[#D28A4C]/15 cursor-pointer"
            >
              Aplicar
            </button>
          </div>
        </div>

        {/* 3. Bloco Rede */}
        <div className="space-y-3 pt-6 border-t border-[#38220F]">
          <h3 className="font-mono text-xs sm:text-sm font-bold text-[#F5F1EB] tracking-wider uppercase">
            Rede
          </h3>

          <div className="flex flex-col space-y-1">
            {NETWORKS.map((network) => {
              const isSelected = selectedNetwork === network.id;
              return (
                <button
                  key={network.id}
                  type="button"
                  onClick={() => onSelectNetwork(isSelected ? undefined : network.id)}
                  className={`flex items-center justify-between w-full px-2.5 py-2 rounded-md text-xs sm:text-sm transition-colors cursor-pointer text-left font-mono ${
                    isSelected
                      ? "bg-[#D28A4C]/15 text-[#D28A4C] font-semibold"
                      : "text-[#CFB28C] hover:text-[#F5F1EB] hover:bg-[#140D0A]/40"
                  }`}
                  aria-pressed={isSelected}
                >
                  <span>{network.name}</span>
                  <span className="font-mono text-[#CFB28C]/60 text-xs">
                    ({network.count})
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* 2. Card NFT EM DESTAQUE / OFERTA LIMITADA separado */}
      <div className="bg-[#241612] border border-[#38220F] rounded-2xl p-5 sm:p-6 space-y-4 text-left shadow-lg">
        <div className="space-y-1">
          <p className="text-sm font-mono font-bold text-[#D28A4C] tracking-widest uppercase">
            NFT EM DESTAQUE
          </p>
          <p className="text-xs font-mono tracking-wider text-[var(--foreground)] uppercase">
            OFERTA LIMITADA
          </p>
        </div>

        <div className="w-full aspect-square rounded-xl overflow-hidden border border-[#38220F] bg-[#140D0A] shadow-md group">
          <img
            src="/images/nfts/sage-nomad.png"
            alt="NFT em Destaque - Sage Nomad"
            className="size-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
          />
        </div>
      </div>
    </aside>
  );
}
