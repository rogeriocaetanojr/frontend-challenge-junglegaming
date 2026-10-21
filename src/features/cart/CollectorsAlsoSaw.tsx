import { useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";

import type { NftListResponse } from "@/contracts/catalog";
import { formatEth } from "@/lib/formatters";
import { http } from "@/lib/http";
import { queryKeys } from "@/lib/query/keys";
import { cn } from "@/lib/utils";

export interface CollectorsAlsoSawProps {
  className?: string;
}

export function CollectorsAlsoSaw({ className }: CollectorsAlsoSawProps) {
  const [activePage, setActivePage] = useState(1);

  // Busca catálogo para preencher aleatoriamente/dinamicamente os cards do mercado
  const { data, isLoading } = useQuery({
    queryKey: [...queryKeys.catalog.all, "collectors-also-saw"],
    queryFn: async () => {
      return http.get<NftListResponse>("/api/nfts?pageSize=15");
    },
    staleTime: 60_000,
  });

  // Mock fiel à imagem de referência caso a API esteja carregando ou vazia
  const defaultItems = useMemo(
    () => [
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
    ],
    [],
  );

  // Mapeia e embaralha/seleciona aleatoriamente se os dados do mercado estiverem disponíveis
  const items = useMemo(() => {
    if (!data?.items || data.items.length < 5) {
      return defaultItems;
    }
    // Cria uma seleção pseudo-aleatória estável baseada na página
    const offset = (activePage - 1) * 5;
    const slice = data.items.slice(offset, offset + 5);
    if (slice.length < 5) return defaultItems;

    return slice.map((nft) => ({
      id: String(nft.id).replace(/\D/g, "") || String(nft.id),
      name: nft.title,
      price: `${formatEth(nft.price)} ETH`,
      image: nft.images?.[0]?.url || "/images/nfts/sage-nomad.png",
    }));
  }, [data, activePage, defaultItems]);

  return (
    <section
      className={cn("pt-16 sm:pt-24 pb-12 font-mono select-none", className)}
      aria-label="Colecionadores também viram"
    >
      {/* Título com linha divisória idêntica à da barra de navegação */}
      <div className="space-y-3">
        <h2 className="text-[#D28A4C] text-sm sm:text-base font-bold tracking-tight">
          Colecionadores também viram
        </h2>
        <div className="h-[1px] w-full bg-[#D28A4C]/50" />
      </div>

      {/* Grid de 5 cards com proporção fiel à imagem */}
      <div className="pt-6 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-5 items-start">
        {isLoading
          ? Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex flex-col space-y-2.5 animate-pulse">
                <div className="aspect-square w-full rounded-[20px] bg-[#1E1410] border border-[#2E1A13] p-2.5" />
                <div className="h-3.5 bg-[#2E1A13] rounded w-3/4" />
                <div className="h-3 bg-[#2E1A13] rounded w-1/2" />
              </div>
            ))
          : items.map((item) => (
              <Link
                key={item.id}
                to="/nfts/$id"
                params={{ id: String(item.id) }}
                className="group flex flex-col space-y-2 cursor-pointer select-none transition-transform duration-200 hover:-translate-y-1 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#D28A4C] rounded-xl"
              >
                {/* Moldura de fundo escuro com imagem quadrada arredondada */}
                <div className="relative aspect-square w-full rounded-[20px] bg-[#1A120E] border border-[#2B1B14] p-2 sm:p-2.5 flex items-center justify-center overflow-hidden shadow-md group-hover:border-[#D28A4C]/50 transition-colors">
                  <img
                    src={item.image}
                    alt={item.name}
                    loading="lazy"
                    className="size-full object-cover rounded-[14px] select-none pointer-events-none transition-transform duration-300 group-hover:scale-105"
                  />
                </div>

                {/* Informações: Nome em branco e Preço em laranja */}
                <div className="space-y-0.5 text-xs sm:text-[13px]">
                  <h3 className="text-[#F5F1EB] font-normal truncate group-hover:text-[#D28A4C] transition-colors">
                    {item.name}
                  </h3>
                  <p className="text-[#D28A4C] font-bold tracking-tight">{item.price}</p>
                </div>
              </Link>
            ))}
      </div>

      {/* Paginação em 3 Dots centralizados (o do meio ativo por padrão, interativo) */}
      <div
        className="flex items-center justify-center gap-2.5 pt-8 select-none"
        aria-label="Navegação do carrossel"
      >
        <button
          type="button"
          onClick={() => setActivePage(0)}
          aria-label="Página 1"
          className={cn(
            "size-2 rounded-full transition-all cursor-pointer",
            activePage === 0
              ? "bg-[#D28A4C]"
              : "border border-[#D28A4C] bg-transparent hover:bg-[#D28A4C]/40",
          )}
        />
        <button
          type="button"
          onClick={() => setActivePage(1)}
          aria-label="Página 2"
          className={cn(
            "size-2 rounded-full transition-all cursor-pointer",
            activePage === 1
              ? "bg-[#D28A4C]"
              : "border border-[#D28A4C] bg-transparent hover:bg-[#D28A4C]/40",
          )}
        />
        <button
          type="button"
          onClick={() => setActivePage(2)}
          aria-label="Página 3"
          className={cn(
            "size-2 rounded-full transition-all cursor-pointer",
            activePage === 2
              ? "bg-[#D28A4C]"
              : "border border-[#D28A4C] bg-transparent hover:bg-[#D28A4C]/40",
          )}
        />
      </div>
    </section>
  );
}

export default CollectorsAlsoSaw;
