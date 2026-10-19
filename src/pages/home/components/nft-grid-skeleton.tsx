import { Skeleton } from "@/components/ui/skeleton";

interface NftGridSkeletonProps {
  count?: number;
}

export function NftGridSkeleton({ count = 6 }: NftGridSkeletonProps) {
  return (
    <div
      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
      role="status"
      aria-label="Carregando catálogo de NFTs"
    >
      {Array.from({ length: count }).map((_, idx) => (
        <div key={idx} className="flex flex-col space-y-3">
          {/* Skeleton da Imagem na Moldura */}
          <div className="bg-[#241612] border border-[#3F2319]/80 rounded-[22px] p-2 sm:p-2.5 shadow-lg shadow-black/40">
            <Skeleton className="w-full aspect-square rounded-[16px] bg-[#1F140F]" />
          </div>

          {/* Skeletons de Título e Preço */}
          <div className="space-y-2 px-1">
            <Skeleton className="h-4 w-3/4 bg-[#1F140F]" />
            <Skeleton className="h-4 w-1/3 bg-[#1F140F]" />
          </div>
        </div>
      ))}
    </div>
  );
}
