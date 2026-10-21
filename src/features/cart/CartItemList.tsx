import { Link } from "@tanstack/react-router";
import { Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { formatEthFixed } from "@/lib/money";
import { type CartItem, lineTotal } from "./api";

export interface CartItemListProps {
  items: CartItem[];
  isLoading?: boolean;
  /** Mensagem de erro de mutação (ex.: conflito de disponibilidade). */
  error?: string | null;
  onChangeQuantity: (item: CartItem, quantity: number) => void;
  onRemove: (item: CartItem) => void;
}

export function CartItemList({
  items,
  isLoading = false,
  error,
  onChangeQuantity,
  onRemove,
}: CartItemListProps) {
  if (isLoading) {
    return (
      <div className="space-y-2" role="status" aria-label="Carregando carrinho">
        {[0, 1, 2].map((index) => (
          <Skeleton key={index} className="h-[84px] w-full rounded-xl" />
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="text-center py-12 px-4 rounded-2xl bg-[#1E1410] border border-[#3F2319]/60 space-y-5">
        <div className="size-16 mx-auto rounded-full bg-[#140D0A] border border-[#3F2319] flex items-center justify-center text-[#D28A4C]">
          <ShoppingBag className="size-8" aria-hidden="true" />
        </div>
        <div className="space-y-1.5">
          <h2 className="text-xl font-bold text-[#F5F1EB] font-mono">
            Seu Carrinho está Vazio
          </h2>
          <p className="text-sm text-[#CFB28C] font-mono max-w-sm mx-auto">
            Você ainda não selecionou nenhum NFT para compra.
          </p>
        </div>
        <Button
          asChild
          className="bg-[#D28A4C] hover:bg-[#c47b3e] text-[#0E0907] font-mono font-bold"
        >
          <Link to="/">Explorar Mercado</Link>
        </Button>
      </div>
    );
  }

  return (
    <div
      className="space-y-4 font-mono select-none"
      role="region"
      aria-label="Tabela de NFTs no carrinho"
    >
      {/* Cabeçalho da Tabela com linha divisória horizontal abaixo idêntica à barra de navegação */}
      <div className="hidden md:block">
        <div className="grid grid-cols-12 gap-4 px-3 sm:px-4 pb-3 text-sm font-semibold text-[#F5F1EB] tracking-wide">
          <div className="col-span-5">NFTs</div>
          <div className="col-span-2 text-left">Preço</div>
          <div className="col-span-2 text-center">Edições</div>
          <div className="col-span-2 text-left">Total</div>
          <div className="col-span-1"></div>
        </div>
        <div className="h-[1px] w-full bg-[#D28A4C]/50" />
      </div>

      {error && (
        <p role="alert" className="text-xs text-[#e05252]">
          {error}
        </p>
      )}

      {/* Lista de Itens mais compacta com menos espaçamento entre eles */}
      <div className="space-y-2 pt-1" role="list" aria-label="Itens do carrinho">
        {items.map((item) => {
          const subtotalItem = formatEthFixed(lineTotal(item), 2);
          const formattedPrice = formatEthFixed(item.price, 2);
          const canIncrease = item.quantity < item.maxSupply;

          // Extrai ou formata ID do token para exibição fiel: ID do token: #xxxx
          const tokenIdMatch = item.title.match(/#(\d+)/);
          const tokenIdFormatted = tokenIdMatch?.[1]
            ? `#${tokenIdMatch[1].padStart(4, "0")}`
            : `#${item.id.replace(/\D/g, "").padStart(4, "0") || "0042"}`;

          return (
            <div
              key={`${item.id}:${item.editionId}`}
              role="listitem"
              className="grid grid-cols-[96px_1fr_auto] md:grid-cols-12 gap-x-3 gap-y-0.5 md:gap-3.5 items-center max-md:p-0 max-md:pr-3 max-md:overflow-hidden max-md:rounded-2xl p-1.5 sm:p-2 rounded-xl bg-[#1C130E] border border-[#2B1B14] hover:border-[#3F2319] transition-colors"
            >
              {/* Coluna 1: NFT (Thumb mais compacta + Sombra reduzida aparecendo só para a direita na altura exata da foto) */}
              <div className="max-md:contents md:col-span-5 flex items-center gap-3.5 min-w-0">
                <div className="relative shrink-0 pr-[3px] max-md:row-span-2 max-md:self-stretch max-md:pr-0">
                  {/* Sombra reduzida de trás: na mesma altura da foto, aparecendo apenas 3px à direita */}
                  <div
                    className="max-md:hidden absolute inset-y-0 right-0 w-[6px] rounded-r-xl bg-[#090503] border-r border-y border-[#20120B] pointer-events-none"
                    aria-hidden="true"
                  />
                  {/* Card frontal da imagem no tamanho ideal compacto */}
                  <div className="relative size-16 sm:size-[68px] max-md:size-full max-md:min-h-24 max-md:rounded-none max-md:p-0 max-md:border-0 rounded-xl bg-[#140D0A] p-0.5 overflow-hidden flex items-center justify-center border border-[#2B1B14] z-10">
                    <img
                      src={item.image || "/images/nfts/emerald-ape.png"}
                      alt={item.title || "NFT"}
                      className="size-full object-cover rounded-lg max-md:rounded-none"
                      loading="lazy"
                    />
                  </div>
                </div>

                <div className="min-w-0 space-y-0.5 max-md:col-start-2 max-md:row-start-1 max-md:self-end max-md:pt-3">
                  <h3 className="text-sm font-bold text-[#F5F1EB] truncate">
                    {item.title}
                  </h3>
                  <p className="text-xs text-[#8C6D58] truncate">
                    ID do token: {tokenIdFormatted}
                  </p>
                </div>
              </div>

              {/* Coluna 2: Preço Unitário */}
              <div className="max-md:hidden md:col-span-2 flex items-center justify-between md:justify-start">
                <span className="md:hidden text-xs text-[#8C6D58]">Preço:</span>
                <span className="text-sm sm:text-base font-medium text-[#F5F1EB]">
                  {formattedPrice} ETH
                </span>
              </div>

              {/* Coluna 3: Edições (Controles circulares laranjas) */}
              <div className="max-md:col-start-3 max-md:row-start-1 max-md:self-end md:col-span-2 flex items-center justify-between md:justify-center">
                <span className="hidden text-xs text-[#8C6D58]">Edições:</span>
                <div className="flex items-center gap-2.5">
                  <button
                    type="button"
                    onClick={() => onChangeQuantity(item, item.quantity - 1)}
                    aria-label={`Diminuir quantidade de ${item.title}`}
                    className="size-6 sm:size-7 rounded-full bg-[#D28A4C] hover:bg-[#e0985b] text-[#0E0907] flex items-center justify-center font-bold text-sm transition-all cursor-pointer shadow-sm active:scale-95"
                  >
                    <Minus className="size-3.5 stroke-[3]" />
                  </button>

                  <span className="w-5 text-center text-sm sm:text-base font-bold text-[#F5F1EB]">
                    {item.quantity}
                  </span>

                  <button
                    type="button"
                    onClick={() => onChangeQuantity(item, item.quantity + 1)}
                    disabled={!canIncrease}
                    aria-label={`Aumentar quantidade de ${item.title}`}
                    className="size-6 sm:size-7 rounded-full bg-[#D28A4C] hover:bg-[#e0985b] disabled:opacity-40 disabled:cursor-not-allowed text-[#0E0907] flex items-center justify-center font-bold text-sm transition-all cursor-pointer shadow-sm active:scale-95"
                  >
                    <Plus className="size-3.5 stroke-[3]" />
                  </button>
                </div>
              </div>

              {/* Coluna 4: Total da Linha */}
              <div className="max-md:col-start-2 max-md:row-start-2 max-md:self-start max-md:pb-3 md:col-span-2 flex items-center justify-between md:justify-start">
                <span className="hidden text-xs text-[#8C6D58]">Total:</span>
                <span className="text-sm sm:text-base max-md:text-lg font-bold text-[#D28A4C]">
                  {subtotalItem} ETH
                </span>
              </div>

              {/* Coluna 5: Lixeira */}
              <div className="max-md:col-start-3 max-md:row-start-2 max-md:self-start md:col-span-1 flex items-center justify-end">
                <button
                  type="button"
                  onClick={() => onRemove(item)}
                  aria-label={`Remover ${item.title} do carrinho`}
                  className="p-1.5 text-[#8C6D58] hover:text-[#e05252] transition-colors cursor-pointer"
                >
                  <Trash2 className="size-4 sm:size-5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default CartItemList;
