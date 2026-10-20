import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Tag, X } from "lucide-react";

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
  onConnectAndCheckout?: (quoteData: {
    subtotal: string;
    networkFee: string;
    total: string;
  }) => void;
}

export function CartSummary({
  items,
  couponCode,
  onConnectAndCheckout,
}: CartSummaryProps) {
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

  // Formatação para exibição fiel à imagem
  const displaySubtotal = (quote?.subtotal ?? localSubtotal).toFixed(2);
  const rawDiscount = quote?.discount ?? localDiscount;
  const displayDiscount = rawDiscount > 0 ? `(-) ${rawDiscount.toFixed(2)}` : "(-) 00.00";
  const displayGas = (quote?.networkFee ?? (items.length > 0 ? 0.016 : 0)).toFixed(3);
  const displayTotal = (
    quote?.total ?? localSubtotal - rawDiscount + (items.length > 0 ? 0.016 : 0)
  ).toFixed(3);

  const handleApplyCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = inputCoupon.trim().toUpperCase();
    if (!trimmed) return;
    setCouponError(null);
    applyCoupon(trimmed);
    setInputCoupon("");
  };

  return (
    <div
      className="max-w-[360px] ml-auto space-y-4.5 font-mono select-none"
      data-testid="cart-summary"
    >
      <div className="space-y-2.5">
        <h2 className="text-sm sm:text-base font-bold text-[#F5F1EB] tracking-wide">
          Resumo da carteira
        </h2>
        <div className="h-[1px] w-full bg-[#D28A4C]/50" />
      </div>

      {/* Bloco do Código Promocional */}
      <div className="space-y-1.5">
        <label
          htmlFor="coupon-input"
          className="text-xs font-semibold text-[#F5F1EB] block"
        >
          Código promocional
        </label>
        {couponCode ? (
          <div className="flex items-center justify-between p-2 rounded-lg bg-[#D28A4C]/15 border border-[#D28A4C] text-xs text-[#D28A4C]">
            <div className="flex items-center gap-2">
              <Tag className="size-3" />
              <span className="font-bold">{couponCode} (10% OFF aplicado)</span>
            </div>
            <button
              type="button"
              onClick={removeCoupon}
              aria-label="Remover cupom"
              className="p-1 hover:text-[#F5F1EB] transition-colors cursor-pointer"
            >
              <X className="size-3" />
            </button>
          </div>
        ) : (
          <form onSubmit={handleApplyCoupon} className="flex">
            <input
              id="coupon-input"
              type="text"
              value={inputCoupon}
              onChange={(e) => setInputCoupon(e.target.value)}
              placeholder="Digite o código promocional..."
              className="flex-1 bg-[#140D0A] border border-r-0 border-[#D28A4C]/80 rounded-l-lg px-2.5 py-1.5 text-xs text-[#F5F1EB] placeholder:text-[#8C6D58] focus:border-[#D28A4C] focus:outline-none"
            />
            <Button
              type="submit"
              disabled={!inputCoupon.trim()}
              className="rounded-l-none rounded-r-lg bg-[#D28A4C] hover:bg-[#e0985b] disabled:opacity-50 text-[#0E0907] text-xs font-bold px-3.5 py-1.5 h-auto cursor-pointer transition-colors"
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
      <div className="space-y-2.5 text-xs sm:text-[13px] text-[#F5F1EB]">
        <div className="flex justify-between items-center">
          <span className="text-[#F5F1EB]/90">Subtotal</span>
          <span className="font-medium text-[#F5F1EB]">{displaySubtotal} ETH</span>
        </div>

        <div className="flex justify-between items-center">
          <span className="text-[#F5F1EB]/90">Desconto do lançamento</span>
          <span className="font-medium text-[#F5F1EB]">{displayDiscount}</span>
        </div>

        <div className="space-y-0.5">
          <div className="flex justify-between items-center">
            <span className="text-[#F5F1EB]/90">Taxa de rede</span>
            <span className="font-medium text-[#F5F1EB]">{displayGas} ETH</span>
          </div>
          <div className="text-right">
            <span className="text-[10px] text-[#D28A4C]">Taxa estimada</span>
          </div>
        </div>

        <div className="flex justify-between items-baseline pt-3 text-sm sm:text-base">
          <span className="font-bold text-[#F5F1EB]">Total</span>
          <span className="text-base sm:text-lg font-bold text-[#D28A4C]">
            {displayTotal} ETH
          </span>
        </div>
      </div>

      {/* Botões de Ação */}
      <div className="space-y-3 pt-1">
        {onConnectAndCheckout ? (
          <Button
            type="button"
            disabled={items.length === 0}
            onClick={() =>
              onConnectAndCheckout({
                subtotal: displaySubtotal,
                networkFee: `${displayGas} ETH`,
                total: displayTotal,
              })
            }
            className="w-full bg-[#D28A4C] hover:bg-[#e0985b] disabled:opacity-40 disabled:cursor-not-allowed text-[#0E0907] font-mono font-bold text-xs sm:text-sm py-2.5 sm:py-3 h-auto rounded-lg shadow-md cursor-pointer transition-colors"
          >
            <span>Conectar e finalizar</span>
          </Button>
        ) : (
          <Button
            asChild
            disabled={items.length === 0}
            className="w-full bg-[#D28A4C] hover:bg-[#e0985b] disabled:opacity-40 disabled:cursor-not-allowed text-[#0E0907] font-mono font-bold text-xs sm:text-sm py-2.5 sm:py-3 h-auto rounded-lg shadow-md cursor-pointer transition-colors"
          >
            <Link to="/checkout" className="flex items-center justify-center gap-2">
              <span>Conectar e finalizar</span>
            </Link>
          </Button>
        )}

        <div className="text-center">
          <Link
            to="/"
            className="text-xs text-[#D28A4C] hover:text-[#e0985b] transition-colors"
          >
            Continuar explorando
          </Link>
        </div>
      </div>
    </div>
  );
}

export default CartSummary;
