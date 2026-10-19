import { Link } from "react-router-dom";
import { ArrowLeft, CheckCircle2, CreditCard, ShoppingBag, Trash2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatEth, truncateAddress } from "@/lib/formatters";
import { useCartStore } from "@/store/cart-store";

export function CheckoutPage() {
  const items = useCartStore((state) => state.items);
  const removeItem = useCartStore((state) => state.removeItem);
  const clearCart = useCartStore((state) => state.clearCart);
  const totalEth = useCartStore((state) => state.getTotalEth());
  const totalUsd = useCartStore((state) => state.getTotalUsd());

  if (items.length === 0) {
    return (
      <div className="max-w-md mx-auto text-center py-16 space-y-6">
        <div className="size-20 mx-auto bg-surface-card border border-border rounded-full flex items-center justify-center text-text-muted">
          <ShoppingBag className="size-10" aria-hidden="true" />
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-foreground tracking-tight">
            Seu Carrinho está Vazio
          </h1>
          <p className="text-sm text-text-muted">
            Você ainda não adicionou nenhum colecionável digital ao seu carrinho. Explore
            o marketplace para descobrir itens exclusivos.
          </p>
        </div>

        <Button asChild size="lg" className="gap-2">
          <Link to="/">
            <ArrowLeft className="size-4" />
            <span>Explorar Marketplace</span>
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Botão de retorno */}
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
        {/* Cabeçalho do carrinho */}
        <div className="flex items-center justify-between border-b border-border pb-4">
          <div className="flex items-center gap-3">
            <ShoppingBag className="size-6 text-primary" />
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold text-foreground">
                  Carrinho & Checkout
                </h1>
                <Badge variant="default" className="text-xs">
                  {items.length} {items.length === 1 ? "item 1/1" : "itens 1/1"}
                </Badge>
              </div>
              <p className="text-xs text-text-muted mt-0.5">
                {items.length === 1
                  ? "1 item exclusivo selecionado"
                  : `${items.length} itens exclusivos selecionados`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={clearCart}
              className="text-text-muted hover:text-destructive hover:border-destructive/40 text-xs gap-1.5"
            >
              <Trash2 className="size-3.5" />
              <span>Limpar Tudo</span>
            </Button>
          </div>
        </div>

        {/* Lista de itens no carrinho */}
        <div className="space-y-3" role="list" aria-label="Itens no carrinho">
          {items.map((item) => (
            <div
              key={item.id}
              role="listitem"
              className="flex items-center justify-between gap-4 p-4 bg-surface-dark border border-border rounded-button hover:border-border-hover transition-colors"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="size-14 rounded-card bg-surface-raised border border-border shrink-0 flex items-center justify-center overflow-hidden">
                  {item.image ? (
                    <img
                      src={item.image}
                      alt={item.name}
                      className="size-full object-cover"
                    />
                  ) : (
                    <span className="text-xs font-mono text-primary font-bold">
                      #{item.id}
                    </span>
                  )}
                </div>

                <div className="min-w-0 space-y-0.5">
                  <p className="text-sm font-bold text-foreground truncate">
                    {item.name}
                  </p>
                  <p className="text-xs text-text-muted truncate">
                    Coleção: <span className="text-foreground">{item.collection}</span>
                  </p>
                  {item.creator && (
                    <p className="text-[11px] text-text-muted truncate">
                      Criador:{" "}
                      <span className="font-mono">{truncateAddress(item.creator)}</span>
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-4 shrink-0">
                <div className="text-right">
                  <span className="font-mono text-sm font-bold text-primary block">
                    {formatEth(item.priceEth)}
                  </span>
                  <span className="text-[11px] text-text-muted block">Qtd: 1 (1/1)</span>
                </div>

                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => removeItem(item.id)}
                  className="size-8 text-text-muted hover:text-destructive hover:bg-destructive/10"
                  aria-label={`Remover ${item.name} do carrinho`}
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>

        {/* Resumo financeiro */}
        <div className="border-t border-border pt-4 space-y-2">
          <div className="flex items-center justify-between text-sm text-text-muted">
            <span>Subtotal de ativos ({items.length}):</span>
            <span className="font-mono text-foreground font-medium">
              {formatEth(totalEth)}
            </span>
          </div>
          <div className="flex items-center justify-between text-sm text-text-muted">
            <span>Taxa estimada de rede (Gas):</span>
            <span className="font-mono text-foreground font-medium">
              0.0000 ETH (Grátis)
            </span>
          </div>
          <div className="flex items-center justify-between text-base font-bold text-foreground pt-3 border-t border-border">
            <span>Total a Pagar:</span>
            <div className="text-right">
              <span className="font-mono text-primary text-xl block">
                {formatEth(totalEth)}
              </span>
              <span className="text-xs text-text-muted block">aprox. {totalUsd}</span>
            </div>
          </div>
        </div>

        {/* Ação de checkout */}
        <div className="space-y-3 pt-2">
          <Button className="w-full gap-2" size="lg">
            <CreditCard className="size-4" />
            <span>Confirmar Transação em ETH</span>
          </Button>

          <div className="flex items-center justify-center gap-1.5 text-xs text-text-muted">
            <CheckCircle2 className="size-3.5 text-primary" />
            <span>Simulação segura sem assinatura de transação real na mainnet</span>
          </div>
        </div>
      </div>
    </div>
  );
}
