import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, ShieldCheck, Tag, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { http } from "@/lib/http";
import { type CartItem, useCartStore } from "@/store/cart-store";

export interface QuoteResponse {
  quoteId: string;
  subtotal: number;
  discount: number;
  networkFee: number;
  total: number;
  couponCode: string | null;
  expiresAt: string;
}

export interface CartSummaryProps {
  items: CartItem[];
  couponCode: string | null;
}

export function CartSummary({ items, couponCode }: CartSummaryProps) {
  const applyCoupon = useCartStore((state) => state.applyCoupon);
  const removeCoupon = useCartStore((state) => state.removeCoupon);

  const [inputCoupon, setInputCoupon] = useState("");
  const [couponError, setCouponError] = useState<string | null>(null);

  // Calcula cotação dinâmica via TanStack Query conectada ao backend MSW
  const { data: quote } = useQuery({
    queryKey: ["cart", "quote", { items, couponCode }],
    queryFn: async () => {
      if (items.length === 0) return null;

      try {
        const payload = {
          items: items.map((i) => ({
            id: i.id,
            price:
              typeof i.price === "number" ? i.price : parseFloat(String(i.priceEth || 0)),
            quantity: i.quantity,
          })),
          couponCode: couponCode || undefined,
        };
        const response = await http.post<QuoteResponse>("/api/quote", payload);
        setCouponError(null);
        return response;
      } catch {
        if (couponCode) {
          setCouponError(`Cupom '${couponCode}' inválido ou expirado.`);
          removeCoupon();
        }
        return null;
      }
    },
    enabled: items.length > 0,
    staleTime: 10_000,
  });

  // Cálculo local síncrono para fallback e exibição instantânea
  const localSubtotal = items.reduce((acc, i) => {
    const p = typeof i.price === "number" ? i.price : parseFloat(String(i.priceEth || 0));
    return acc + p * i.quantity;
  }, 0);
  const isCouponValid = couponCode === "KURIO10" || couponCode === "JUNGLE10";
  const localDiscount = isCouponValid ? localSubtotal * 0.1 : 0;
  const localGas = items.length > 0 ? 0.005 : 0;
  const localTotal = Math.max(0, localSubtotal - localDiscount) + localGas;

  const displaySubtotal = (quote?.subtotal ?? localSubtotal).toFixed(4);
  const displayDiscount = (quote?.discount ?? localDiscount).toFixed(4);
  const displayGas = (quote?.networkFee ?? localGas).toFixed(4);
  const displayTotal = (quote?.total ?? localTotal).toFixed(4);

  const handleApplyCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = inputCoupon.trim().toUpperCase();
    if (!trimmed) return;
    setCouponError(null);
    applyCoupon(trimmed);
    setInputCoupon("");
  };

  return (
    <div className="rounded-2xl bg-[#1E1410] border border-[#3F2319]/60 p-5 sm:p-6 space-y-6 font-mono select-none">
      <h2 className="text-lg font-bold text-[#F5F1EB] border-b border-[#3F2319]/50 pb-3">
        Resumo do Pedido
      </h2>

      {/* Formulário de Cupom */}
      <div className="space-y-2">
        <label htmlFor="coupon-input" className="text-xs text-[#CFB28C] block">
          Possui um cupom de desconto?
        </label>
        {couponCode ? (
          <div className="flex items-center justify-between p-2.5 rounded-lg bg-[#D28A4C]/10 border border-[#D28A4C]/50 text-xs text-[#D28A4C]">
            <div className="flex items-center gap-2">
              <Tag className="size-3.5" />
              <span className="font-bold">{couponCode} (10% OFF aplicado)</span>
            </div>
            <button
              type="button"
              onClick={removeCoupon}
              aria-label="Remover cupom"
              className="p-1 hover:text-[#F5F1EB] transition-colors cursor-pointer"
            >
              <X className="size-3.5" />
            </button>
          </div>
        ) : (
          <form onSubmit={handleApplyCoupon} className="flex gap-2">
            <input
              id="coupon-input"
              type="text"
              value={inputCoupon}
              onChange={(e) => setInputCoupon(e.target.value)}
              placeholder="Ex: KURIO10"
              className="flex-1 bg-[#140D0A] border border-[#3F2319] rounded-lg px-3 py-2 text-xs text-[#F5F1EB] placeholder:text-[#F5F1EB]/30 focus:border-[#D28A4C] focus:outline-none uppercase"
            />
            <Button
              type="submit"
              variant="outline"
              size="sm"
              disabled={!inputCoupon.trim()}
              className="border-[#3F2319] hover:border-[#D28A4C] hover:text-[#D28A4C] text-xs h-auto py-2 font-mono"
            >
              Aplicar
            </Button>
          </form>
        )}
        {couponError && (
          <p className="text-xs text-[#e05252] animate-in fade-in duration-150">
            {couponError}
          </p>
        )}
      </div>

      {/* Detalhamento financeiro */}
      <div className="space-y-2.5 text-xs sm:text-sm border-t border-[#3F2319]/40 pt-4">
        <div className="flex justify-between text-[#CFB28C]">
          <span>Subtotal de ativos ({items.reduce((s, i) => s + i.quantity, 0)})</span>
          <span className="font-bold text-[#F5F1EB]">{displaySubtotal} ETH</span>
        </div>

        {Number(displayDiscount) > 0 && (
          <div className="flex justify-between text-[#22c55e]">
            <span>Desconto promocional</span>
            <span className="font-bold">-{displayDiscount} ETH</span>
          </div>
        )}

        <div className="flex justify-between text-[#CFB28C]">
          <span>Taxa estimada de rede (Gas)</span>
          <span className="font-bold text-[#F5F1EB]">{displayGas} ETH</span>
        </div>

        <div className="flex justify-between items-baseline pt-3 border-t border-[#3F2319]/50 text-base sm:text-lg">
          <span className="font-bold text-[#F5F1EB]">Total a Pagar</span>
          <div className="text-right">
            <span className="text-xl sm:text-2xl font-bold text-[#D28A4C] block">
              {displayTotal} ETH
            </span>
          </div>
        </div>
      </div>

      {/* Botão de Ação: Prosseguir para o Checkout */}
      <div className="space-y-3 pt-2">
        <Button
          asChild
          disabled={items.length === 0}
          className="w-full bg-[#D28A4C] hover:bg-[#c47b3e] disabled:opacity-40 disabled:cursor-not-allowed text-[#0E0907] font-mono font-bold text-sm h-11 rounded-xl shadow-md cursor-pointer transition-colors"
        >
          <Link to="/checkout" className="flex items-center justify-center gap-2">
            <span>Prosseguir para o Checkout</span>
            <ArrowRight className="size-4" />
          </Link>
        </Button>

        <div className="flex items-center justify-center gap-1.5 text-[11px] text-[#CFB28C]/80">
          <ShieldCheck className="size-3.5 text-[#D28A4C]" />
          <span>Garantia de liquidação atômica e segurança na rede</span>
        </div>
      </div>
    </div>
  );
}

export default CartSummary;
