import { Link, useParams } from "react-router-dom";
import { ArrowLeft, ShoppingCart, Tag } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatEth, formatUsd } from "@/lib/formatters";

export function NftDetailPage() {
  const { id } = useParams<{ id: string }>();

  // Dados fictícios simulados para o esqueleto da rota
  const simulatedPriceEth = 0.45;
  const simulatedPriceUsd = simulatedPriceEth * 3200;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Navegação de retorno */}
      <div>
        <Button
          asChild
          variant="ghost"
          size="sm"
          className="gap-1.5 text-text-muted hover:text-foreground"
        >
          <Link to="/">
            <ArrowLeft className="size-4" />
            <span>Voltar ao Marketplace</span>
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
        {/* Placeholder de Mídia do NFT */}
        <div className="aspect-square bg-surface-dark border border-border rounded-card flex items-center justify-center p-8">
          <div className="text-center space-y-2">
            <Tag className="size-12 text-primary mx-auto opacity-80" />
            <p className="text-sm text-text-muted">Visualização do Item #{id}</p>
          </div>
        </div>

        {/* Detalhes do NFT */}
        <div className="space-y-6">
          <div className="space-y-2">
            <Badge variant="default">Coleção Principal</Badge>
            <h1 className="text-3xl font-extrabold text-foreground tracking-tight">
              Cyber Sentinel #{id}
            </h1>
            <p className="text-sm text-text-muted">
              Item único autenticado em rede simulada com proveniência imutável e
              royalties fixos.
            </p>
          </div>

          <div className="p-4 bg-surface-dark border border-border rounded-button space-y-1">
            <span className="text-xs text-text-muted font-medium uppercase tracking-wider">
              Preço Atual
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold font-mono text-primary">
                {formatEth(simulatedPriceEth)}
              </span>
              <span className="text-sm text-text-muted">
                ({formatUsd(simulatedPriceUsd)})
              </span>
            </div>
          </div>

          <div className="flex gap-3">
            <Button asChild className="flex-1 gap-2">
              <Link to="/checkout">
                <ShoppingCart className="size-4" />
                <span>Comprar Agora</span>
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/">Outros Itens</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
