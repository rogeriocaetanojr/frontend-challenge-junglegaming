import { Link } from "@tanstack/react-router";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery } from "@tanstack/react-query";

import type { Nft, NftListResponse } from "@/contracts/catalog";
import { formatEth } from "@/lib/formatters";
import { http } from "@/lib/http";
import { queryKeys } from "@/lib/query/keys";
import { cn } from "@/lib/utils";

export interface NftRelatedItem {
  id: string;
  title: string;
  price: string;
  images?: Array<{ url: string; alt?: string }>;
}

export interface NftRelatedCollectionProps {
  currentNftId?: string;
  collectionId?: string;
  category?: string;
  initialItems?: Array<
    | NftRelatedItem
    | (Pick<Nft, "id" | "title" | "price"> & {
        images?: Array<{ url: string; alt?: string }>;
      })
  >;
  className?: string;
  maxItems?: number;
}

export function NftRelatedCollection({
  currentNftId,
  collectionId,
  category,
  initialItems,
  className,
  maxItems = 5,
}: NftRelatedCollectionProps) {
  const normalizedCurrentId = String(currentNftId || "").trim();

  const { data, isLoading } = useQuery({
    queryKey: [
      ...queryKeys.catalog.all,
      "related",
      { collectionId, category, currentNftId: normalizedCurrentId },
    ],
    queryFn: async () => {
      const searchParams = new URLSearchParams();
      if (collectionId) {
        searchParams.set("collection", collectionId);
      } else if (category) {
        searchParams.set("category", category);
      }
      searchParams.set("pageSize", "12");

      const queryString = searchParams.toString();
      const endpoint = queryString ? `/api/nfts?${queryString}` : "/api/nfts";
      return http.get<NftListResponse>(endpoint);
    },
    staleTime: 60_000,
  });

  // Fallback com os 5 cards originais da coleção como era antes
  const fallbackItems: Array<{
    id: string;
    name: string;
    price: string;
    image: string;
  }> = [
    {
      id: "118",
      name: "Cosmic Bloom #118",
      price: "1.29 ETH",
      image: "/images/nfts/sage-nomad.webp",
    },
    {
      id: "314",
      name: "Violet Nomad #314",
      price: "1.39 ETH",
      image: "/images/nfts/sage-nomad.webp",
    },
    {
      id: "088",
      name: "Ivory Baron #088",
      price: "1.79 ETH",
      image: "/images/nfts/noct-vessel.webp",
    },
    {
      id: "207",
      name: "Golden Beat #207",
      price: "0.99 ETH",
      image: "/images/nfts/golden-bear.webp",
    },
    {
      id: "160",
      name: "Golden Signal #160",
      price: "0.39 ETH",
      image: "/images/nfts/golden-bear.webp",
    },
  ];

  // Filtra itens para excluir o NFT atual exibido
  const hasInitial = Array.isArray(initialItems);
  const sourceItems = hasInitial
    ? initialItems
    : data?.items && data.items.length > 0
      ? data.items
      : fallbackItems.map((f) => ({
          id: f.id,
          title: f.name,
          price: f.price,
          images: [{ url: f.image }],
        }));
  const queryNfts = sourceItems.filter(
    (item) =>
      String(item.id) !== normalizedCurrentId && `nft-${item.id}` !== normalizedCurrentId,
  );

  const displayedItems =
    queryNfts.length > 0
      ? queryNfts.slice(0, maxItems).map((nft) => ({
          id: String(nft.id),
          name: nft.title,
          price: formatEth(nft.price),
          image: nft.images?.[0]?.url || "/images/nfts/sage-nomad.webp",
        }))
      : fallbackItems.slice(0, maxItems);

  return (
    <section
      className={cn("pt-10 sm:pt-14 pb-8 font-mono select-none", className)}
      aria-label="Mais desta coleção"
    >
      {/* Título com linha divisória sutil */}
      <div className="space-y-3">
        <h2 className="text-[#D28A4C] text-base sm:text-[17px] font-bold tracking-tight">
          Mais desta coleção
        </h2>
        <hr className="border-t border-[#3F2319]/50" />
      </div>

      {/* Grid de itens relacionados */}
      <div className="pt-6 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-5 items-start">
        {isLoading && !initialItems
          ? Array.from({ length: maxItems }).map((_, i) => (
              <div key={i} className="flex flex-col space-y-2.5">
                <Skeleton className="aspect-square w-full rounded-[20px] bg-[#1E1410] border border-[#2E1A13]/85 p-3" />
                <Skeleton className="h-3.5 w-3/4 rounded bg-[#2E1A13]" />
                <Skeleton className="h-3 w-1/2 rounded bg-[#2E1A13]" />
              </div>
            ))
          : displayedItems.map((item) => (
              <Link
                key={item.id}
                to="/nfts/$id"
                params={{ id: String(item.id) }}
                className="group flex flex-col space-y-2.5 cursor-pointer select-none transition-transform duration-200 hover:-translate-y-1 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#D28A4C] rounded-xl"
              >
                {/* Moldura escura com imagem arredondada */}
                <div className="relative aspect-square w-full rounded-[20px] bg-[#1E1410] border border-[#2E1A13]/85 p-3 flex items-center justify-center overflow-hidden shadow-md group-hover:border-[#D28A4C]/60 transition-colors">
                  <img
                    src={item.image}
                    alt={item.name}
                    loading="lazy"
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
  );
}

export default NftRelatedCollection;
