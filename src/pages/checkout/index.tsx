import { Link } from "react-router-dom";
import { ArrowLeft, CheckCircle2, CreditCard, ShoppingBag } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { calculateTotalEth, formatEth, formatUsd } from "@/lib/formatters";

export function CheckoutPage() {
  const simulatedCartItems = [
    { id: "1", title: "Cyber Sentinel #1", price: 0.1 },
    { id: "2", title: "Cyber Sentinel #2", price: 0.2 },
  ];

  const totalEth = calculateTotalEth(simulatedCartItems);
  const totalUsd = formatUsd(Number(totalEth) * 3200);

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <Button
          asChild
          variant="ghost"
          size="sm"
          className="gap-1.5 text-text-muted hover:text-foreground"
        >
          <Link to="/">
            <ArrowLeft className="size-4" />
            <span>Continuar Comprando</span>
          </Link>
        </Button>
      </div>

      <div className="bg-surface-card border border-border rounded-card p-6 sm:p-8 space-y-6 shadow-xl">
        <div className="flex items-center justify-between border-b border-border pb-4">
          <div className="flex items-center gap-2">
            <ShoppingBag className="size-5 text-primary" />
            <h1 className="text-2xl font-bold text-foreground">Carrinho & Finalização</h1>
          </div>
          <Badge variant="default" className="gap-1">
            <CheckCircle2 className="size-3" />
            <span>Simulação Ativa</span>
          </Badge>
        </div>

        {/* Lista de itens no carrinho */}
        <div className="space-y-3">
          {simulatedCartItems.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between p-3 bg-surface-dark border border-border rounded-button"
            >
              <div>
                <p className="text-sm font-semibold text-foreground">{item.title}</p>
                <p className="text-xs text-text-muted">Item em custódia simulada</p>
              </div>
              <span className="font-mono text-sm font-bold text-primary">
                {formatEth(item.price)}
              </span>
            </div>
          ))}
        </div>

        {/* Resumo financeiro */}
        <div className="border-t border-border pt-4 space-y-2">
          <div className="flex items-center justify-between text-sm text-text-muted">
            <span>Subtotal estimado:</span>
            <span className="font-mono text-foreground font-medium">
              {formatEth(totalEth)}
            </span>
          </div>
          <div className="flex items-center justify-between text-sm text-text-muted">
            <span>Taxa de rede (gas simulado):</span>
            <span className="font-mono text-foreground font-medium">0.0000 ETH</span>
          </div>
          <div className="flex items-center justify-between text-base font-bold text-foreground pt-2 border-t border-border">
            <span>Total da Ordem:</span>
            <div className="text-right">
              <span className="font-mono text-primary text-lg block">
                {formatEth(totalEth)}
              </span>
              <span className="text-xs text-text-muted block">aprox. {totalUsd}</span>
            </div>
          </div>
        </div>

        <Button className="w-full gap-2" size="lg">
          <CreditCard className="size-4" />
          <span>Confirmar Transação Simulada</span>
        </Button>
      </div>
    </div>
  );
}
