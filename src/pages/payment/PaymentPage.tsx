import { useRef, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { ChevronDown, Tag, X } from "lucide-react";

import { useAuthStore } from "@/store/auth-store";
import { TransactionSuccessModal } from "@/features/cart/TransactionSuccessModal";
import { MobilePageHeader } from "@/components/mobile-page-header";
import { ConnectedWalletPicker } from "@/features/checkout/ConnectedWalletPicker";
import { useWallets } from "@/features/wallets/api";
import { useCheckout } from "@/features/checkout/useCheckout";
import { useQuoteChangeNotice } from "@/features/cart/useQuoteChangeNotice";
import { formatEthFixed } from "@/lib/money";
import {
  lineTotal,
  sumEth,
  useApplyCoupon,
  useCart,
  useCartQuote,
} from "@/features/cart/api";
import { useCouponStore } from "@/features/cart/couponStore";

export function PaymentPage() {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);

  // Itens do carrinho
  const { items, clearCart } = useCart();
  const couponCode = useCouponStore((state) => state.couponCode);
  const removeCoupon = useCouponStore((state) => state.clearCoupon);
  const applyCouponMutation = useApplyCoupon();
  const quoteQuery = useCartQuote();
  const quote = quoteQuery.data;
  const priceNotice = useQuoteChangeNotice(quote?.total);

  // Estados do Formulário "Perfil do colecionador" (lado esquerdo)
  const [displayName, setDisplayName] = useState(user?.name || "Rogerio Caetano");
  const [username, setUsername] = useState(
    user?.email ? user.email.split("@")[0] : "rogeriocaetano",
  );
  const [network, setNetwork] = useState("ethereum");
  const [profileName, setProfileName] = useState(user?.name || "rogeriocaetano");
  const [walletAddress, setWalletAddress] = useState(
    "0x71C8364437a9C27779976872A42F340a6B233921",
  );
  const [secondaryWallet, setSecondaryWallet] = useState("");
  const { wallets } = useWallets();
  const [walletType, setWalletType] = useState("coinbase");
  const [referralCode, setReferralCode] = useState("");
  const [email, setEmail] = useState(user?.email || "rogerio@gmail.com");
  const [ensSuffix, setEnsSuffix] = useState(".eth");
  const [ensName, setEnsName] = useState("");
  const [useOtherWallet, setUseOtherWallet] = useState(false);
  const [collectorNotes, setCollectorNotes] = useState("");

  // Método de pagamento / Carteira selecionada (lado direito)
  // Opções: "all" (METAMASK - WALLETCONNECT - COINBASE), "metamask", "coinbase"
  const [selectedWalletOption, setSelectedWalletOption] = useState<
    "all" | "metamask" | "coinbase"
  >("coinbase");

  // Código promocional
  const [showPromoInput, setShowPromoInput] = useState(false);
  const [promoInputValue, setPromoInputValue] = useState("");

  // Checkout real: cotação -> pedido idempotente -> confirmação (polling)
  const { status, order, error, submitOrder } = useCheckout();
  const [isQuoting, setIsQuoting] = useState(false);
  const [quoteError, setQuoteError] = useState<string | null>(null);
  const [isReceiptDismissed, setIsReceiptDismissed] = useState(false);
  const isSubmittingRef = useRef(false);

  const isProcessing = isQuoting || status === "submitting" || status === "polling";
  // O recibo só abre quando o pedido retornado pela API está CONFIRMED
  const isSuccessModalOpen = status === "success" && !isReceiptDismissed;
  const checkoutError = quoteError ?? (status === "error" ? error?.message : null);

  // Valores exibidos: sempre a cotação emitida pela API (strings decimais de ETH)
  const subtotalEth = quote?.subtotal ?? sumEth(items.map(lineTotal));
  const displaySubtotal = formatEthFixed(subtotalEth, 2);
  const discountEth = formatEthFixed(quote?.discount, 2);
  const displayDiscount = discountEth !== "0.00" ? `(-) ${discountEth}` : "(-) 00.00";
  const displayNetworkFee = formatEthFixed(quote?.networkFee, 3);
  const displayTotal = formatEthFixed(quote?.total, 3);

  const handleApplyPromo = (e: React.FormEvent) => {
    e.preventDefault();
    if (promoInputValue.trim()) {
      applyCouponMutation.mutate(promoInputValue.trim(), {
        onSuccess: () => {
          setPromoInputValue("");
          setShowPromoInput(false);
        },
      });
    }
  };

  const handleConfirmPurchase = async () => {
    if (isSubmittingRef.current || items.length === 0) return;
    isSubmittingRef.current = true;
    setIsQuoting(true);
    setQuoteError(null);
    const reviewedTotal = quote?.total;

    try {
      // 1. Cotação de referência recém-emitida pela API (preço, cupom, taxas e total)
      const { data: freshQuote } = await quoteQuery.refetch({ throwOnError: true });
      if (!freshQuote) {
        throw new Error("Não foi possível obter a cotação do pedido.");
      }
      // Cotação desatualizada: exige nova confirmação com os valores atuais
      if (reviewedTotal !== undefined && freshQuote.total !== reviewedTotal) {
        throw new Error(
          `Os valores do pedido mudaram (novo total ${formatEthFixed(freshQuote.total, 3)} ETH). Revise e confirme novamente.`,
        );
      }
      const blocking = freshQuote.issues.find((issue) => issue.type !== "price_changed");
      if (blocking) {
        throw new Error(
          "Há divergências no carrinho (disponibilidade ou cupom). Revise os itens antes de continuar.",
        );
      }

      // 2. Criação idempotente do pedido (o hook envia o header Idempotency-Key)
      await submitOrder({
        buyer: { name: displayName, email, walletAddress },
        paymentMethod: "crypto",
        items: items.map((item) => ({
          id: item.id,
          title: item.title,
          price: item.price,
          quantity: item.quantity,
        })),
        totalEth: freshQuote.total,
        quoteId: freshQuote.quoteId,
      });
    } catch (err) {
      setQuoteError(
        err instanceof Error
          ? err.message
          : "Não foi possível obter a cotação do pedido.",
      );
    } finally {
      setIsQuoting(false);
      isSubmittingRef.current = false;
    }
  };

  const handleCloseModal = () => {
    setIsReceiptDismissed(true);
    void clearCart().catch(() => undefined);
    navigate({ to: "/" });
  };

  return (
    <div
      className="w-full py-6 sm:py-8 font-mono text-[#F5F1EB] select-none"
      data-testid="payment-page"
    >
      <div className="min-h-[calc(100vh-140px)] flex flex-col justify-start space-y-6">
        {/* Breadcrumb limpo: Início / Mercado / Pagamento */}
        <MobilePageHeader backTo="/cart" title="Pagamento com carteira" />
        <nav aria-label="Navegação estrutural" className="pt-2 max-md:hidden">
          <ol className="flex items-center gap-2 text-xs sm:text-sm font-medium text-[#F5F1EB]">
            <li>
              <Link to="/" className="hover:text-[#D28A4C] transition-colors">
                Início
              </Link>
            </li>
            <li className="text-[#8C6D58]" aria-hidden="true">
              /
            </li>
            <li>
              <Link to="/" className="hover:text-[#D28A4C] transition-colors">
                Mercado
              </Link>
            </li>
            <li className="text-[#8C6D58]" aria-hidden="true">
              /
            </li>
            <li className="text-[#F5F1EB]" aria-current="page">
              Pagamento
            </li>
          </ol>
        </nav>

        {/* Grid de 2 Colunas: Formulário à Esquerda | Resumo de NFTs e Pagamento à Direita */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-14 items-start pt-2">
          {/* ============================================================== */}
          {/* COLUNA ESQUERDA: Perfil do colecionador                       */}
          {/* ============================================================== */}
          <div className="lg:col-span-7 space-y-5">
            <h1 className="text-base sm:text-lg font-bold text-[#F5F1EB] tracking-wide">
              Perfil do colecionador
            </h1>

            <div className="space-y-4">
              {/* Linha 1: Nome de exibição* & Nome de usuário* */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
                <div className="space-y-1.5">
                  <label
                    htmlFor="pay-displayName"
                    className="block text-xs sm:text-[13px] text-[#F5F1EB]"
                  >
                    Nome de exibição<span className="text-[#D28A4C] ml-0.5">*</span>
                  </label>
                  <input
                    id="pay-displayName"
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Nome de exibição"
                    className="w-full bg-[#140D0A] border border-[#2B1B14] focus:border-[#D28A4C] rounded-lg px-3.5 py-2.5 text-xs sm:text-sm text-[#F5F1EB] placeholder:text-[#5A453A] focus:outline-none transition-colors"
                  />
                </div>

                <div className="space-y-1.5">
                  <label
                    htmlFor="pay-username"
                    className="block text-xs sm:text-[13px] text-[#F5F1EB]"
                  >
                    Nome de usuário<span className="text-[#D28A4C] ml-0.5">*</span>
                  </label>
                  <input
                    id="pay-username"
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Nome de usuário"
                    className="w-full bg-[#140D0A] border border-[#2B1B14] focus:border-[#D28A4C] rounded-lg px-3.5 py-2.5 text-xs sm:text-sm text-[#F5F1EB] placeholder:text-[#5A453A] focus:outline-none transition-colors"
                  />
                </div>
              </div>

              {/* Linha 2: Rede * & Nome do perfil* */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
                <div className="space-y-1.5">
                  <label
                    htmlFor="pay-network"
                    className="block text-xs sm:text-[13px] text-[#F5F1EB]"
                  >
                    Rede <span className="text-[#D28A4C]">*</span>
                  </label>
                  <div className="relative">
                    <select
                      id="pay-network"
                      value={network}
                      onChange={(e) => setNetwork(e.target.value)}
                      className="w-full bg-[#140D0A] border border-[#2B1B14] focus:border-[#D28A4C] rounded-lg px-3.5 py-2.5 text-xs sm:text-sm text-[#F5F1EB] focus:outline-none transition-colors appearance-none cursor-pointer pr-10"
                    >
                      <option value="" className="bg-[#140D0A] text-[#A69788]">
                        Selecione uma rede
                      </option>
                      <option value="ethereum" className="bg-[#140D0A] text-[#F5F1EB]">
                        Ethereum Mainnet
                      </option>
                      <option value="polygon" className="bg-[#140D0A] text-[#F5F1EB]">
                        Polygon
                      </option>
                      <option value="arbitrum" className="bg-[#140D0A] text-[#F5F1EB]">
                        Arbitrum One
                      </option>
                      <option value="solana" className="bg-[#140D0A] text-[#F5F1EB]">
                        Solana
                      </option>
                    </select>
                    <ChevronDown className="size-4 absolute right-3.5 top-1/2 -translate-y-1/2 text-[#CFB28C] pointer-events-none" />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label
                    htmlFor="pay-profileName"
                    className="block text-xs sm:text-[13px] text-[#F5F1EB]"
                  >
                    Nome do perfil<span className="text-[#D28A4C] ml-0.5">*</span>
                  </label>
                  <input
                    id="pay-profileName"
                    type="text"
                    value={profileName}
                    onChange={(e) => setProfileName(e.target.value)}
                    placeholder="Nome do perfil"
                    className="w-full bg-[#140D0A] border border-[#2B1B14] focus:border-[#D28A4C] rounded-lg px-3.5 py-2.5 text-xs sm:text-sm text-[#F5F1EB] placeholder:text-[#5A453A] focus:outline-none transition-colors"
                  />
                </div>
              </div>

              {/* Linha 3: Endereço da carteira* & ENS ou carteira secundária (opcional) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
                <div className="space-y-1.5">
                  <label
                    htmlFor="pay-walletAddress"
                    className="block text-xs sm:text-[13px] text-[#F5F1EB]"
                  >
                    Endereço da carteira<span className="text-[#D28A4C] ml-0.5">*</span>
                  </label>
                  <input
                    id="pay-walletAddress"
                    type="text"
                    value={walletAddress}
                    onChange={(e) => setWalletAddress(e.target.value)}
                    placeholder="Endereço 0x da carteira"
                    className="w-full bg-[#140D0A] border border-[#2B1B14] focus:border-[#D28A4C] rounded-lg px-3.5 py-2.5 text-xs sm:text-sm text-[#F5F1EB] placeholder:text-[#5A453A] focus:outline-none transition-colors font-mono"
                  />
                </div>

                <div className="space-y-1.5">
                  <label
                    htmlFor="pay-secondaryWallet"
                    className="block text-xs sm:text-[13px] text-transparent select-none"
                  >
                    Secundária
                  </label>
                  <input
                    id="pay-secondaryWallet"
                    type="text"
                    value={secondaryWallet}
                    onChange={(e) => setSecondaryWallet(e.target.value)}
                    placeholder="ENS ou carteira secundária (opcional)"
                    className="w-full bg-[#140D0A] border border-[#2B1B14] focus:border-[#D28A4C] rounded-lg px-3.5 py-2.5 text-xs sm:text-sm text-[#F5F1EB] placeholder:text-[#5A453A] focus:outline-none transition-colors"
                  />
                </div>
              </div>

              {/* Linha 4: Tipo de carteira* & Código de indicação* */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
                <div className="space-y-1.5">
                  <label
                    htmlFor="pay-walletType"
                    className="block text-xs sm:text-[13px] text-[#F5F1EB]"
                  >
                    Tipo de carteira<span className="text-[#D28A4C] ml-0.5">*</span>
                  </label>
                  <div className="relative">
                    <select
                      id="pay-walletType"
                      value={walletType}
                      onChange={(e) => setWalletType(e.target.value)}
                      className="w-full bg-[#140D0A] border border-[#2B1B14] focus:border-[#D28A4C] rounded-lg px-3.5 py-2.5 text-xs sm:text-sm text-[#F5F1EB] focus:outline-none transition-colors appearance-none cursor-pointer pr-10"
                    >
                      <option value="" className="bg-[#140D0A] text-[#A69788]">
                        Selecione uma carteira
                      </option>
                      <option value="coinbase" className="bg-[#140D0A] text-[#F5F1EB]">
                        Coinbase Wallet
                      </option>
                      <option value="metamask" className="bg-[#140D0A] text-[#F5F1EB]">
                        MetaMask
                      </option>
                      <option value="phantom" className="bg-[#140D0A] text-[#F5F1EB]">
                        Phantom
                      </option>
                      <option
                        value="walletconnect"
                        className="bg-[#140D0A] text-[#F5F1EB]"
                      >
                        WalletConnect
                      </option>
                    </select>
                    <ChevronDown className="size-4 absolute right-3.5 top-1/2 -translate-y-1/2 text-[#CFB28C] pointer-events-none" />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label
                    htmlFor="pay-referralCode"
                    className="block text-xs sm:text-[13px] text-[#F5F1EB]"
                  >
                    Código de indicação<span className="text-[#D28A4C] ml-0.5">*</span>
                  </label>
                  <input
                    id="pay-referralCode"
                    type="text"
                    value={referralCode}
                    onChange={(e) => setReferralCode(e.target.value)}
                    placeholder=""
                    className="w-full bg-[#140D0A] border border-[#2B1B14] focus:border-[#D28A4C] rounded-lg px-3.5 py-2.5 text-xs sm:text-sm text-[#F5F1EB] placeholder:text-[#5A453A] focus:outline-none transition-colors"
                  />
                </div>
              </div>

              {/* Linha 5: E-mail* & Nome ENS * */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
                <div className="space-y-1.5">
                  <label
                    htmlFor="pay-email"
                    className="block text-xs sm:text-[13px] text-[#F5F1EB]"
                  >
                    E-mail<span className="text-[#D28A4C] ml-0.5">*</span>
                  </label>
                  <input
                    id="pay-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="seuemail@exemplo.com"
                    className="w-full bg-[#140D0A] border border-[#2B1B14] focus:border-[#D28A4C] rounded-lg px-3.5 py-2.5 text-xs sm:text-sm text-[#F5F1EB] placeholder:text-[#5A453A] focus:outline-none transition-colors"
                  />
                </div>

                <div className="space-y-1.5">
                  <label
                    htmlFor="pay-ens"
                    className="block text-xs sm:text-[13px] text-[#F5F1EB]"
                  >
                    Nome ENS <span className="text-[#D28A4C]">*</span>
                  </label>
                  <div className="flex gap-2">
                    <div className="relative w-24 shrink-0">
                      <select
                        id="pay-ensSuffix"
                        value={ensSuffix}
                        onChange={(e) => setEnsSuffix(e.target.value)}
                        className="w-full bg-[#140D0A] border border-[#2B1B14] focus:border-[#D28A4C] rounded-lg px-3 py-2.5 text-xs sm:text-sm text-[#F5F1EB] focus:outline-none transition-colors appearance-none cursor-pointer pr-7"
                      >
                        <option value=".eth" className="bg-[#140D0A] text-[#F5F1EB]">
                          .eth
                        </option>
                        <option value=".sol" className="bg-[#140D0A] text-[#F5F1EB]">
                          .sol
                        </option>
                        <option value=".crypto" className="bg-[#140D0A] text-[#F5F1EB]">
                          .crypto
                        </option>
                      </select>
                      <ChevronDown className="size-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 text-[#CFB28C] pointer-events-none" />
                    </div>
                    <input
                      id="pay-ens"
                      type="text"
                      value={ensName}
                      onChange={(e) => setEnsName(e.target.value)}
                      placeholder=""
                      className="flex-1 min-w-0 bg-[#140D0A] border border-[#2B1B14] focus:border-[#D28A4C] rounded-lg px-3.5 py-2.5 text-xs sm:text-sm text-[#F5F1EB] placeholder:text-[#5A453A] focus:outline-none transition-colors"
                    />
                  </div>
                </div>
              </div>

              {/* Opção circular: Usar outra carteira? */}
              <div className="pt-1">
                <label className="inline-flex items-center gap-2.5 cursor-pointer select-none text-xs sm:text-[13px] text-[#CFB28C] hover:text-[#F5F1EB] transition-colors">
                  <input
                    type="checkbox"
                    checked={useOtherWallet}
                    onChange={(e) => setUseOtherWallet(e.target.checked)}
                    className="sr-only"
                  />
                  <span
                    className={`size-4 rounded-full border flex items-center justify-center transition-colors ${
                      useOtherWallet
                        ? "border-[#D28A4C] bg-[#D28A4C]/20"
                        : "border-[#D28A4C]/70"
                    }`}
                  >
                    {useOtherWallet && (
                      <span className="size-2 rounded-full bg-[#D28A4C]" />
                    )}
                  </span>
                  <span>Usar outra carteira?</span>
                </label>
              </div>

              {/* Observação do colecionador (opcional) */}
              <div className="space-y-1.5 pt-2">
                <label
                  htmlFor="pay-notes"
                  className="block text-xs sm:text-[13px] text-[#F5F1EB]"
                >
                  Observação do colecionador (opcional)
                </label>
                <textarea
                  id="pay-notes"
                  rows={4}
                  value={collectorNotes}
                  onChange={(e) => setCollectorNotes(e.target.value)}
                  placeholder=""
                  className="w-full bg-[#140D0A] border border-[#2B1B14] focus:border-[#D28A4C] rounded-lg p-3.5 text-xs sm:text-sm text-[#F5F1EB] placeholder:text-[#5A453A] focus:outline-none transition-colors resize-none"
                />
              </div>
            </div>
          </div>

          {/* ============================================================== */}
          {/* COLUNA DIREITA: Seus NFTs, Resumo e Carteira / Confirmação     */}
          {/* ============================================================== */}
          <div className="lg:col-span-5 space-y-4">
            {/* Header: Seus NFTs | NFTs - Subtotal */}
            <div>
              <h2 className="text-sm sm:text-base font-bold text-[#F5F1EB] tracking-wide mb-2">
                Seus NFTs
              </h2>
              <div className="flex items-center justify-between text-xs text-[#A69788] pb-1">
                <span>NFTs</span>
                <span>Subtotal</span>
              </div>
            </div>

            {/* Lista dos NFTs adquiridos */}
            <div className="space-y-2.5">
              {items.map((item) => {
                const itemTotal = formatEthFixed(lineTotal(item), 2);
                const tokenId = item.id.replace(/\D/g, "") || "042";
                const formattedTokenId = `#0${tokenId.padStart(3, "0").slice(-3)}`;

                return (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-[#1A120E] border border-[#2E1A13]"
                  >
                    <div className="flex items-center gap-3">
                      <div className="size-13 rounded-lg overflow-hidden bg-[#140D0A] shrink-0 border border-[#2B1B14]">
                        <img
                          src={item.image}
                          alt={item.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="space-y-0.5">
                        <h3 className="text-xs sm:text-[13px] font-bold text-[#F5F1EB] truncate max-w-[150px]">
                          {item.title}
                        </h3>
                        <p className="text-[11px] text-[#A69788]">
                          ID do token: {formattedTokenId}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-[#A69788]">
                        (x {item.quantity})
                      </span>
                      <span className="text-xs sm:text-sm font-bold text-[#D28A4C] font-mono">
                        {itemTotal} ETH
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Código Promocional: "Tem um código promocional? Aplique aqui" */}
            <div className="text-center pt-2">
              {couponCode ? (
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#D28A4C]/15 border border-[#D28A4C]/40 text-xs text-[#D28A4C]">
                  <Tag className="size-3" />
                  <span>{couponCode} (aplicado)</span>
                  <button
                    type="button"
                    onClick={removeCoupon}
                    className="hover:text-white ml-1 cursor-pointer"
                    aria-label="Remover cupom"
                  >
                    <X className="size-3" />
                  </button>
                </div>
              ) : showPromoInput ? (
                <form onSubmit={handleApplyPromo} className="flex gap-2 max-w-xs mx-auto">
                  <input
                    type="text"
                    value={promoInputValue}
                    onChange={(e) => setPromoInputValue(e.target.value)}
                    placeholder="Código promocional"
                    className="flex-1 bg-[#140D0A] border border-[#2B1B14] rounded px-3 py-1 text-xs text-[#F5F1EB] focus:outline-none focus:border-[#D28A4C]"
                  />
                  <button
                    type="submit"
                    className="bg-[#D28A4C] text-[#0E0907] font-bold text-xs px-3 py-1 rounded cursor-pointer hover:bg-[#c47b3e]"
                  >
                    Aplicar
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowPromoInput(false)}
                    className="text-[#A69788] hover:text-[#F5F1EB] text-xs px-1 cursor-pointer"
                  >
                    Cancelar
                  </button>
                </form>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowPromoInput(true)}
                  className="text-xs text-[#CFB28C] hover:text-[#D28A4C] transition-colors cursor-pointer"
                >
                  Tem um código promocional? Aplique aqui
                </button>
              )}
            </div>

            {/* Linhas de Resumo: Subtotal, Desconto do lançamento, Taxa de rede */}
            <div className="space-y-1.5 pt-2 text-xs sm:text-sm">
              <div className="flex justify-between items-center text-[#F5F1EB]">
                <span className="text-[#A69788]">Subtotal</span>
                <span className="font-mono">{displaySubtotal} ETH</span>
              </div>
              <div className="flex justify-between items-center text-[#F5F1EB]">
                <span className="text-[#A69788]">Desconto do lançamento</span>
                <span className="font-mono text-[#CFB28C]">{displayDiscount}</span>
              </div>
              <div className="flex justify-between items-center text-[#F5F1EB]">
                <span className="text-[#A69788]">Taxa de rede</span>
                <span className="font-mono">{displayNetworkFee} ETH</span>
              </div>
              <p className="text-[10px] text-center text-[#A69788] pt-0.5">
                Taxa estimada
              </p>
            </div>

            {/* Total */}
            <div className="flex justify-between items-center pt-2 border-t border-[#2E1A13] text-sm sm:text-base max-md:text-lg max-md:border-t-0 max-md:justify-end max-md:gap-6 font-bold">
              <span className="text-[#F5F1EB]">Total</span>
              <span className="text-[#D28A4C] font-mono">{displayTotal} ETH</span>
            </div>

            <ConnectedWalletPicker
              wallets={wallets}
              selectedAddress={walletAddress}
              onSelect={(wallet) => {
                setWalletAddress(wallet.address);
                setNetwork(wallet.network);
              }}
            />

            {/* Seção: Carteira e rede */}
            <div className="space-y-2 pt-2 max-md:space-y-3">
              <h3 className="text-xs sm:text-sm font-bold text-center max-md:text-left text-[#F5F1EB] tracking-wide mb-2">
                Carteira e rede
              </h3>

              {/* Opção 1: METAMASK • WALLETCONNECT • COINBASE */}
              <button
                type="button"
                onClick={() => setSelectedWalletOption("all")}
                className={`w-full flex items-center gap-3 p-3 max-md:p-4 max-md:rounded-2xl rounded-xl border text-left transition-colors cursor-pointer ${
                  selectedWalletOption === "all"
                    ? "bg-[#1A120E] border-[#D28A4C]"
                    : "bg-[#140D0A] max-md:bg-[#1E1410] border-[#2E1A13] max-md:border-transparent hover:border-[#3F2319]"
                }`}
              >
                <span
                  className={`size-4 rounded-full border flex items-center justify-center shrink-0 transition-colors ${
                    selectedWalletOption === "all"
                      ? "border-[#D28A4C]"
                      : "border-[#D28A4C]/60"
                  }`}
                >
                  {selectedWalletOption === "all" && (
                    <span className="size-2 rounded-full bg-[#D28A4C]" />
                  )}
                </span>
                <span className="px-2 py-0.5 rounded bg-[#2B1B14] text-[10px] sm:text-[11px] text-[#D28A4C] font-bold tracking-wider uppercase">
                  METAMASK • WALLETCONNECT • COINBASE
                </span>
              </button>

              {/* Opção 2: MetaMask */}
              <button
                type="button"
                onClick={() => setSelectedWalletOption("metamask")}
                className={`w-full flex items-center gap-3 p-3 max-md:p-4 max-md:rounded-2xl rounded-xl border text-left transition-colors cursor-pointer ${
                  selectedWalletOption === "metamask"
                    ? "bg-[#1A120E] border-[#D28A4C]"
                    : "bg-[#140D0A] max-md:bg-[#1E1410] border-[#2E1A13] max-md:border-transparent hover:border-[#3F2319]"
                }`}
              >
                <span
                  className={`size-4 rounded-full border flex items-center justify-center shrink-0 transition-colors ${
                    selectedWalletOption === "metamask"
                      ? "border-[#D28A4C]"
                      : "border-[#D28A4C]/60"
                  }`}
                >
                  {selectedWalletOption === "metamask" && (
                    <span className="size-2 rounded-full bg-[#D28A4C]" />
                  )}
                </span>
                <span className="text-xs sm:text-sm font-medium text-[#F5F1EB]">
                  MetaMask
                </span>
              </button>

              {/* Opção 3: Coinbase Wallet (Selecionada por padrão como na imagem) */}
              <button
                type="button"
                onClick={() => setSelectedWalletOption("coinbase")}
                className={`w-full flex items-center gap-3 p-3 max-md:p-4 max-md:rounded-2xl rounded-xl border text-left transition-colors cursor-pointer ${
                  selectedWalletOption === "coinbase"
                    ? "bg-[#1A120E] border-[#D28A4C]"
                    : "bg-[#140D0A] max-md:bg-[#1E1410] border-[#2E1A13] max-md:border-transparent hover:border-[#3F2319]"
                }`}
              >
                <span
                  className={`size-4 rounded-full border flex items-center justify-center shrink-0 transition-colors ${
                    selectedWalletOption === "coinbase"
                      ? "border-[#D28A4C]"
                      : "border-[#D28A4C]/60"
                  }`}
                >
                  {selectedWalletOption === "coinbase" && (
                    <span className="size-2 rounded-full bg-[#D28A4C]" />
                  )}
                </span>
                <span className="text-xs sm:text-sm font-medium text-[#F5F1EB]">
                  Coinbase Wallet
                </span>
              </button>
            </div>

            {/* Botão Oficial: Confirmar compra */}
            <div className="pt-2">
              {priceNotice && (
                <p
                  role="status"
                  aria-live="polite"
                  className="mb-3 text-xs text-[#D28A4C]"
                >
                  {priceNotice}
                </p>
              )}
              {checkoutError && (
                <p role="alert" className="mb-3 text-xs text-red-300">
                  {checkoutError}
                </p>
              )}
              <button
                type="button"
                onClick={handleConfirmPurchase}
                disabled={isProcessing || items.length === 0}
                aria-busy={isProcessing}
                className="disabled:opacity-60 disabled:cursor-not-allowed w-full bg-[#D28A4C] hover:bg-[#c47b3e] active:scale-[0.99] text-[#0E0907] font-bold text-sm sm:text-base py-3 sm:py-3.5 max-md:h-14 max-md:rounded-full max-md:bg-linear-to-r max-md:from-[#D28A4C] max-md:to-[#A9703F] rounded-lg transition-all shadow-md shadow-[#D28A4C]/20 cursor-pointer"
              >
                {isProcessing ? "Processando..." : "Confirmar compra"}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de Confirmação de Pedido / Sucesso da Transação */}
      <TransactionSuccessModal
        isOpen={isSuccessModalOpen}
        onClose={handleCloseModal}
        items={items}
        subtotal={displaySubtotal}
        networkFee={`${displayNetworkFee} ETH`}
        total={displayTotal}
        transactionHash={order?.transactionHash}
        date={
          order?.createdAt
            ? new Date(order.createdAt).toLocaleDateString("pt-BR", {
                day: "2-digit",
                month: "short",
                year: "numeric",
              })
            : undefined
        }
        walletName={
          selectedWalletOption === "coinbase"
            ? "Coinbase Wallet"
            : selectedWalletOption === "metamask"
              ? "MetaMask"
              : "WalletConnect"
        }
      />
    </div>
  );
}

export default PaymentPage;
