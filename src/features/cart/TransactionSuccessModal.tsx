import { X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { formatEthFixed } from "@/lib/money";
import { type CartItem, lineTotal } from "./api";

export interface TransactionSuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  subtotal: string;
  networkFee: string;
  total: string;
  transactionHash?: string;
  date?: string;
  walletName?: string;
}

export function TransactionSuccessModal({
  isOpen,
  onClose,
  items,
  networkFee = "0.016 ETH",
  total,
  transactionHash = "0xA91F...E82C",
  date = "29 Jul, 2026",
  walletName = "MetaMask",
}: TransactionSuccessModalProps) {
  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="success-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
    >
      {/* Container Principal do Modal - Fundo escuro com barra terrosa/laranja na base */}
      <div className="relative w-full max-w-[580px] rounded-2xl bg-[#1A120E] border border-[#2E1A13] shadow-2xl overflow-hidden font-mono text-[#F5F1EB] select-none animate-in zoom-in-95 duration-200">
        {/* Botão Fechar no topo direito */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Fechar modal"
          className="absolute top-4 right-4 p-1.5 rounded-lg text-[#CFB28C]/80 hover:text-[#F5F1EB] hover:bg-[#25150E] transition-colors cursor-pointer z-20"
        >
          <X className="size-4" />
        </button>

        {/* Topo: Ícone Envelope THANK YOU + Mensagem Principal */}
        <div className="pt-8 pb-5 px-6 sm:px-8 text-center space-y-3">
          {/* Ícone estilizado Thank You Envelope */}
          <div className="mx-auto w-16 h-16 flex items-center justify-center">
            <svg
              className="w-14 h-14 text-[#D28A4C]"
              viewBox="0 0 64 64"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              {/* Carta saindo */}
              <rect
                x="16"
                y="8"
                width="32"
                height="26"
                rx="2"
                stroke="currentColor"
                fill="#1A120E"
              />
              <text
                x="32"
                y="20"
                textAnchor="middle"
                fontSize="7.5"
                fontWeight="bold"
                fill="currentColor"
                stroke="none"
                letterSpacing="0.5"
              >
                THANK
              </text>
              <text
                x="32"
                y="29"
                textAnchor="middle"
                fontSize="7.5"
                fontWeight="bold"
                fill="currentColor"
                stroke="none"
                letterSpacing="0.5"
              >
                YOU
              </text>
              {/* Envelope base */}
              <path
                d="M8 22 L32 38 L56 22 L56 54 L8 54 Z"
                fill="#1A120E"
                stroke="currentColor"
              />
              <path d="M8 54 L26 36" stroke="currentColor" />
              <path d="M56 54 L38 36" stroke="currentColor" />
            </svg>
          </div>

          <h2
            id="success-modal-title"
            className="text-sm sm:text-base font-bold text-[#CFB28C] tracking-wide"
          >
            Seus NFTs agora estão na sua carteira
          </h2>
        </div>

        {/* Linha Divisória */}
        <div className="h-[1px] w-full bg-[#D28A4C]/50" />

        {/* Tabela de Metadados: ID da transação | Data | Total | Carteira (100% alinhado sem quebra) */}
        <div className="flex items-center justify-between px-6 sm:px-8 py-3.5 text-left text-xs whitespace-nowrap border-b border-[#D28A4C]/50">
          <div className="space-y-0.5">
            <span className="text-[#CFB28C] font-bold block text-xs">
              ID da transação
            </span>
            <span className="text-[#CFB28C] block text-xs tracking-tight">
              {transactionHash}
            </span>
          </div>

          <div className="h-7 w-[1px] bg-[#D28A4C]/50 mx-2" aria-hidden="true" />

          <div className="space-y-0.5">
            <span className="text-[#CFB28C] font-bold block text-xs">Data</span>
            <span className="text-[#CFB28C] block text-xs">{date}</span>
          </div>

          <div className="h-7 w-[1px] bg-[#D28A4C]/50 mx-2" aria-hidden="true" />

          <div className="space-y-0.5">
            <span className="text-[#CFB28C] font-bold block text-xs">Total</span>
            <span className="text-[#CFB28C] block text-xs font-medium">{total} ETH</span>
          </div>

          <div className="h-7 w-[1px] bg-[#D28A4C]/50 mx-2" aria-hidden="true" />

          <div className="space-y-0.5">
            <span className="text-[#CFB28C] font-bold block text-xs">Carteira</span>
            <span className="text-[#CFB28C] block text-xs">{walletName}</span>
          </div>
        </div>

        {/* Corpo: Detalhes da transação */}
        <div className="px-6 sm:px-8 py-4 space-y-3.5">
          <div className="space-y-2">
            <h3 className="text-xs sm:text-sm font-bold text-[#F5F1EB]">
              Detalhes da transação
            </h3>

            {/* Cabeçalho de colunas */}
            <div className="flex justify-between items-center text-xs text-[#F5F1EB] pt-1">
              <span className="w-1/2 font-bold">NFTs</span>
              <span className="w-1/4 text-center font-bold">Edições</span>
              <span className="w-1/4 text-right font-bold">Subtotal</span>
            </div>

            {/* Linha da cor da barra de navegação abaixo das colunas */}
            <div className="h-[1px] w-full bg-[#D28A4C]/50" />
          </div>

          {/* Lista de itens adquiridos */}
          <div className="space-y-2 max-h-[190px] overflow-y-auto pr-1">
            {items.map((item) => {
              const tokenIdMatch = item.title.match(/#(\d+)/);
              const tokenIdFormatted = tokenIdMatch?.[1]
                ? `#${tokenIdMatch[1].padStart(4, "0")}`
                : `#${item.id.replace(/\D/g, "").padStart(4, "0") || "0042"}`;
              const itemSubtotal = formatEthFixed(lineTotal(item), 2);

              return (
                <div
                  key={item.id}
                  className="flex items-center justify-between text-xs py-1"
                >
                  {/* NFT Thumb + Nome + Token ID */}
                  <div className="flex items-center gap-2.5 w-1/2 min-w-0">
                    <div className="size-11 sm:size-12 rounded-lg bg-[#140D0A] p-0.5 overflow-hidden shrink-0 border border-[#2B1B14]">
                      <img
                        src={item.image || "/images/nfts/emerald-ape.png"}
                        alt={item.title || "NFT"}
                        className="size-full object-cover rounded-md"
                      />
                    </div>
                    <div className="min-w-0 space-y-0.5">
                      <p className="font-bold text-[#F5F1EB] text-xs truncate">
                        {item.title}
                      </p>
                      <p className="text-[10px] text-[#CFB28C] truncate">
                        ID do token: {tokenIdFormatted}
                      </p>
                    </div>
                  </div>

                  {/* Edições */}
                  <div className="w-1/4 text-center text-xs text-[#CFB28C]">
                    (x {item.quantity})
                  </div>

                  {/* Subtotal */}
                  <div className="w-1/4 text-right font-bold text-xs sm:text-sm text-[#D28A4C]">
                    {itemSubtotal} ETH
                  </div>
                </div>
              );
            })}
          </div>

          {/* Linhas de Taxa de rede e Total */}
          <div className="space-y-1.5 pt-2 border-t border-[#3F2319]/60 text-xs sm:text-sm">
            <div className="flex justify-between items-center text-[#F5F1EB]">
              <span className="text-[#F5F1EB] font-normal ml-auto mr-12">
                Taxa de rede
              </span>
              <span className="text-[#F5F1EB] font-normal">{networkFee}</span>
            </div>
            <div className="flex justify-between items-center text-xs sm:text-sm">
              <span className="text-[#F5F1EB] font-bold ml-auto mr-12">Total</span>
              <span className="text-[#E89B55] font-bold">{total} ETH</span>
            </div>
          </div>

          {/* Mensagem explicativa */}
          <div className="pt-2 border-t border-[#3F2319]/60 text-center">
            <p className="text-[11px] text-[#CFB28C] leading-relaxed max-w-sm mx-auto">
              Transação confirmada na Ethereum. A propriedade foi transferida para sua
              carteira conectada e registrada na rede.
            </p>
          </div>

          {/* Botão Ver no Etherscan */}
          <div className="pt-2 pb-2 flex justify-center">
            <Button
              asChild
              className="bg-[#D28A4C] hover:bg-[#e0985b] text-[#0E0907] font-bold text-xs sm:text-sm px-6 py-2.5 h-auto rounded-md shadow-md cursor-pointer transition-colors"
            >
              <a href="https://etherscan.io" target="_blank" rel="noopener noreferrer">
                Ver no Etherscan
              </a>
            </Button>
          </div>
        </div>

        {/* Barra inferior decorativa sólida em tom laranja/terroso igual à imagem */}
        <div className="h-2 w-full bg-[#D28A4C]" />
      </div>
    </div>
  );
}

export default TransactionSuccessModal;
