import { useState } from "react";
import { AlertCircle, CreditCard, Loader2, Wallet } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { CartItem } from "@/store/cart-store";
import type { CheckoutStatus, CreateOrderPayload, PaymentMethod } from "./types";

export interface CheckoutFormProps {
  items: CartItem[];
  totalEth: string;
  status: CheckoutStatus;
  error: Error | null;
  onSubmit: (payload: CreateOrderPayload) => void;
}

export function CheckoutForm({
  items,
  totalEth,
  status,
  error,
  onSubmit,
}: CheckoutFormProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("crypto");

  const isProcessing = status === "submitting" || status === "polling";

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || isProcessing) return;

    onSubmit({
      buyer: {
        name: name.trim(),
        email: email.trim(),
      },
      paymentMethod,
      items: items.map((i) => ({
        id: i.id,
        title: i.title || i.name || "NFT",
        price: i.price,
        quantity: i.quantity,
      })),
      totalEth,
    });
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="p-5 sm:p-6 rounded-2xl bg-[#1C130E] border border-[#2B1B14] space-y-6 font-mono text-[#F5F1EB]"
      data-testid="checkout-form"
    >
      <div className="space-y-1">
        <h2 className="text-lg sm:text-xl font-bold tracking-tight text-[#F5F1EB]">
          Finalizar Pedido
        </h2>
        <p className="text-xs text-[#8C6D58]">
          Preencha seus dados de identificação para registrar a posse na blockchain.
        </p>
      </div>

      {/* Dados Pessoais */}
      <div className="space-y-3">
        <div>
          <label
            htmlFor="buyer-name"
            className="text-xs font-semibold text-[#F5F1EB] block mb-1"
          >
            Nome Completo *
          </label>
          <input
            id="buyer-name"
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ex: Satoshi Nakamoto"
            disabled={isProcessing}
            className="w-full bg-[#140D0A] border border-[#2B1B14] rounded-lg px-3 py-2 text-xs sm:text-sm text-[#F5F1EB] placeholder:text-[#8C6D58] focus:border-[#D28A4C] focus:outline-none transition-colors"
          />
        </div>

        <div>
          <label
            htmlFor="buyer-email"
            className="text-xs font-semibold text-[#F5F1EB] block mb-1"
          >
            E-mail para Recibo *
          </label>
          <input
            id="buyer-email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Ex: satoshi@kurio.io"
            disabled={isProcessing}
            className="w-full bg-[#140D0A] border border-[#2B1B14] rounded-lg px-3 py-2 text-xs sm:text-sm text-[#F5F1EB] placeholder:text-[#8C6D58] focus:border-[#D28A4C] focus:outline-none transition-colors"
          />
        </div>
      </div>

      {/* Seletor de Método de Pagamento */}
      <div className="space-y-2">
        <span className="text-xs font-semibold text-[#F5F1EB] block">
          Método de Pagamento
        </span>
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setPaymentMethod("crypto")}
            disabled={isProcessing}
            className={`flex items-center justify-center gap-2 p-3 rounded-lg border text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
              paymentMethod === "crypto"
                ? "border-[#D28A4C] bg-[#D28A4C]/15 text-[#D28A4C]"
                : "border-[#2B1B14] bg-[#140D0A] text-[#8C6D58] hover:border-[#3F2319]"
            }`}
          >
            <Wallet className="size-4" />
            <span>Cripto (ETH)</span>
          </button>

          <button
            type="button"
            onClick={() => setPaymentMethod("fiat")}
            disabled={isProcessing}
            className={`flex items-center justify-center gap-2 p-3 rounded-lg border text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
              paymentMethod === "fiat"
                ? "border-[#D28A4C] bg-[#D28A4C]/15 text-[#D28A4C]"
                : "border-[#2B1B14] bg-[#140D0A] text-[#8C6D58] hover:border-[#3F2319]"
            }`}
          >
            <CreditCard className="size-4" />
            <span>Cartão / Fiat</span>
          </button>
        </div>
      </div>

      {/* Resumo Simples dos Itens */}
      <div className="p-3 sm:p-4 rounded-xl bg-[#140D0A] border border-[#2B1B14] space-y-2.5">
        <div className="flex justify-between items-center text-xs font-bold text-[#F5F1EB] border-b border-[#2B1B14] pb-2">
          <span>Resumo dos Ativos ({items.length})</span>
          <span className="text-[#D28A4C]">{totalEth} ETH</span>
        </div>
        <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
          {items.map((item) => (
            <div key={item.id} className="flex justify-between text-xs text-[#8C6D58]">
              <span className="truncate max-w-[200px]">
                {item.quantity}x {item.title || item.name}
              </span>
              <span className="font-medium text-[#F5F1EB]">
                {(item.price * item.quantity).toFixed(2)} ETH
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Mensagem de Erro */}
      {error && (
        <div
          role="alert"
          className="flex items-center gap-2 p-3 rounded-lg bg-[#e05252]/10 border border-[#e05252]/40 text-xs text-[#e05252] animate-in fade-in"
        >
          <AlertCircle className="size-4 shrink-0" />
          <span>{error.message || "Erro ao processar checkout. Tente novamente."}</span>
        </div>
      )}

      {/* Botão de Envio com Loading */}
      <Button
        type="submit"
        disabled={isProcessing || !name.trim() || !email.trim()}
        className="w-full bg-[#D28A4C] hover:bg-[#e0985b] disabled:opacity-50 text-[#0E0907] font-bold py-3.5 h-auto rounded-lg shadow-md transition-colors cursor-pointer"
      >
        {isProcessing ? (
          <div className="flex items-center justify-center gap-2">
            <Loader2 className="size-4 animate-spin" />
            <span>
              {status === "submitting"
                ? "Enviando Pedido..."
                : "Aguardando Confirmação..."}
            </span>
          </div>
        ) : (
          <span>Confirmar e Pagar {totalEth} ETH</span>
        )}
      </Button>
    </form>
  );
}

export default CheckoutForm;
