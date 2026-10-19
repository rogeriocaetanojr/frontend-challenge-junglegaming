import { Link } from "react-router-dom";
import { Activity, ArrowRight, ShieldCheck, Sparkles } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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

  return (
    <div className="space-y-8">
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
            <Link to="/nft/1">
              <span>Explorar Coleção</span>
              <ArrowRight className="size-4 ml-1" />
            </Link>
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
    </div>
  );
}
