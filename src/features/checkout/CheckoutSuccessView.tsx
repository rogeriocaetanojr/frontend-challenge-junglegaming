import { CheckCircle2, Copy, ExternalLink } from "lucide-react";
import { Link } from "react-router-dom";

import { Button } from "@/components/ui/button";
import type { CheckoutOrderResponse } from "./types";

export interface CheckoutSuccessViewProps {
  order: CheckoutOrderResponse;
}

export function CheckoutSuccessView({ order }: CheckoutSuccessViewProps) {
  const transactionHash =
    order.transactionHash || "0x7a3f89b2c4e1d90a88ef3912ca87b0019e0cf441";

  return (
    <div
      className="max-w-xl mx-auto py-8 sm:py-12 px-4 space-y-6 font-mono text-[#F5F1EB]"
      data-testid="checkout-success-view"
    >
      <div className="p-6 sm:p-8 rounded-2xl bg-[#1C130E] border border-[#2B1B14] space-y-6 text-center shadow-xl">
        <div className="size-16 mx-auto rounded-full bg-[#22c55e]/15 border border-[#22c55e]/40 flex items-center justify-center text-[#22c55e]">
          <CheckCircle2 className="size-8 stroke-[2.5]" />
        </div>

        <div className="space-y-1.5">
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#F5F1EB]">
            Aquisição Confirmada!
          </h1>
          <p className="text-xs sm:text-sm text-[#8C6D58]">
            Seus ativos foram transferidos com sucesso para sua custódia.
          </p>
        </div>

        {/* Detalhes do Pedido e Hash da Blockchain */}
        <div className="p-4 rounded-xl bg-[#140D0A] border border-[#2B1B14] space-y-3 text-left text-xs sm:text-sm">
          <div className="flex justify-between items-center gap-2">
            <span className="text-[#8C6D58]">ID do Pedido:</span>
            <span
              className="font-bold text-[#F5F1EB] truncate max-w-[200px]"
              data-testid="success-order-id"
            >
              {order.orderId}
            </span>
          </div>

          <div className="flex justify-between items-center gap-2">
            <span className="text-[#8C6D58]">Status:</span>
            <span className="px-2 py-0.5 rounded text-xs font-bold bg-[#22c55e]/15 text-[#22c55e] border border-[#22c55e]/30">
              {order.status}
            </span>
          </div>

          {order.totalEth !== undefined && (
            <div className="flex justify-between items-center gap-2">
              <span className="text-[#8C6D58]">Total Pago:</span>
              <span className="font-bold text-[#D28A4C]">{order.totalEth} ETH</span>
            </div>
          )}

          <div className="space-y-1 pt-1 border-t border-[#2B1B14]">
            <span className="text-[#8C6D58] block text-[11px]">Hash da Transação:</span>
            <div className="flex items-center justify-between gap-2 p-2 rounded bg-[#0B0705] border border-[#2B1B14] text-[11px] font-mono">
              <span className="truncate text-[#D28A4C]" data-testid="success-tx-hash">
                {transactionHash}
              </span>
              <button
                type="button"
                onClick={() => navigator.clipboard?.writeText?.(transactionHash)}
                title="Copiar Hash"
                className="text-[#8C6D58] hover:text-[#F5F1EB] transition-colors p-1"
              >
                <Copy className="size-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Ações */}
        <div className="space-y-3 pt-2">
          <Button
            asChild
            className="w-full bg-[#D28A4C] hover:bg-[#e0985b] text-[#0E0907] font-bold py-3 h-auto rounded-lg transition-colors"
          >
            <Link to="/" data-testid="return-home-btn">
              Retornar ao Catálogo
            </Link>
          </Button>

          <div className="flex items-center justify-center gap-1.5 text-xs text-[#8C6D58]">
            <ExternalLink className="size-3.5" />
            <span>Verificado na rede Ethereum</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CheckoutSuccessView;
