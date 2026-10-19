import { Link } from "react-router-dom";
import { Activity, ArrowRight, Heart, ShieldCheck, Sparkles } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useNfts } from "@/hooks/use-nfts";
import { formatEth } from "@/lib/formatters";
import { http } from "@/lib/http";
import { queryKeys } from "@/lib/query-keys";

interface HealthResponse {
  status: string;
  timestamp: string;
  service: string;
}

export function HomePage() {
  const { data: healthData, isLoading: isHealthLoading } = useQuery({
    queryKey: queryKeys.health,
    queryFn: () => http.get<HealthResponse>("/health"),
  });

  const { data: nftsData, isLoading: isNftsLoading } = useNfts();

  return (
    <div className="space-y-12">
      {/* Hero Section */}
      <section className="text-center space-y-4 max-w-2xl mx-auto pt-6">
        <Badge variant="default" className="gap-1.5">
          <Sparkles className="size-3.5" />
          <span>Curated Digital Collectibles</span>
        </Badge>

        <h1 className="text-4xl sm:text-5xl font-black text-foreground tracking-tight">
          Descubra e Negocie <span className="text-primary">NFTs Exclusivos</span>
        </h1>

        <p className="text-base text-text-muted">
          Marketplace descentralizado de alta fidelidade com precificação em ETH,
          confirmações otimistas e sincronização de dados em tempo real.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <Button asChild size="lg">
            <a href="#marketplace-collection">
              <span>Explorar Coleção</span>
              <ArrowRight className="size-4 ml-1" />
            </a>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link to="/checkout">Ver Carrinho</Link>
          </Button>
        </div>
      </section>

      {/* Status Bar */}
      <section className="bg-surface-card border border-border rounded-card p-4 max-w-xl mx-auto flex items-center justify-between shadow-lg">
        <div className="flex items-center gap-3">
          <Activity className="size-4 text-primary animate-pulse" />
          <div className="text-left">
            <p className="text-xs font-semibold text-foreground">
              {healthData
                ? `${healthData.service} (${healthData.status.toUpperCase()})`
                : isHealthLoading
                  ? "Verificando integridade da rede..."
                  : "Mock Service Worker Ativo"}
            </p>
            <p className="text-[11px] text-text-muted">
              {healthData?.timestamp
                ? `Sincronizado em ${new Date(healthData.timestamp).toLocaleTimeString("pt-BR")}`
                : "Aguardando resposta do mock"}
            </p>
          </div>
        </div>

        <Badge variant={healthData ? "default" : "secondary"}>
          <ShieldCheck className="size-3 mr-1" />
          <span>{healthData ? "Online" : "Conectando"}</span>
        </Badge>
      </section>

      {/* Grid de NFTs com Loading Skeletons */}
      <section id="marketplace-collection" className="space-y-6">
        <div className="flex items-center justify-between border-b border-border pb-4">
          <div>
            <h2 className="text-2xl font-bold text-foreground tracking-tight">
              Colecionáveis em Destaque
            </h2>
            <p className="text-sm text-text-muted">
              Ativos digitais autenticados via MSW com precificação e liquidação simulada
            </p>
          </div>
          <Badge variant="outline" className="font-mono text-xs">
            {isNftsLoading ? "Carregando..." : `${nftsData?.total ?? 0} Ativos`}
          </Badge>
        </div>

        {isNftsLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, index) => (
              <div
                key={index}
                className="bg-surface-card border border-border rounded-card p-3 space-y-3"
              >
                <Skeleton className="w-full aspect-square rounded-card" />
                <div className="space-y-2 pt-1">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-border/50">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-8 w-16" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {nftsData?.items.map((nft) => (
              <div
                key={nft.id}
                className="group bg-surface-card border border-border hover:border-primary/50 transition-all rounded-card overflow-hidden shadow-lg flex flex-col"
              >
                <div className="relative aspect-square overflow-hidden bg-surface-dark">
                  <img
                    src={nft.image}
                    alt={nft.name}
                    className="size-full object-cover group-hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                  />
                  <div className="absolute top-2.5 right-2.5">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-background/80 backdrop-blur-md border border-border text-[11px] font-medium text-foreground">
                      <Heart className="size-3 text-red-400 fill-red-400/20" />
                      <span>{nft.likes}</span>
                    </span>
                  </div>
                </div>

                <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                  <div className="space-y-1">
                    <p className="text-xs text-text-muted font-medium">
                      {nft.collection.name}
                    </p>
                    <h3 className="font-bold text-foreground text-base tracking-tight truncate group-hover:text-primary transition-colors">
                      {nft.name}
                    </h3>
                  </div>

                  <div className="pt-2 border-t border-border flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-text-muted uppercase tracking-wider block font-medium">
                        Preço
                      </span>
                      <span className="font-mono text-sm font-bold text-primary">
                        {formatEth(nft.priceEth)}
                      </span>
                    </div>

                    <Button asChild size="sm" variant="default">
                      <Link to={`/nft/${nft.id}`}>Ver Detalhes</Link>
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
