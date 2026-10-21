import { useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { ChevronDown, Tag, X } from "lucide-react";

import { useAuthStore } from "@/store/auth-store";
import { useCartStore } from "@/store/cart-store";
import { TransactionSuccessModal } from "@/features/cart/TransactionSuccessModal";

export function PaymentPage() {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);

  // Itens do carrinho
  const items = useCartStore((state) => state.items);
  const couponCode = useCartStore((state) => state.couponCode);
  const applyCoupon = useCartStore((state) => state.applyCoupon);
  const removeCoupon = useCartStore((state) => state.removeCoupon);
  const clearCart = useCartStore((state) => state.clearCart);

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

  // Modal de Confirmação de Pedido (TransactionSuccessModal)
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);

  // Cálculos de subtotal e total
  const rawSubtotal = items.reduce(
    (acc, item) => acc + (Number(item.priceEth) || item.price || 0) * item.quantity,
    0,
  );
  // Se o carrinho estiver vazio por algum motivo, mantemos o valor de fallback realista da imagem
  const subtotalNum = rawSubtotal > 0 ? rawSubtotal : 26.83;
  const discountNum = couponCode ? subtotalNum * 0.1 : 0;
  const networkFeeNum = 0.016;
  const totalNum = subtotalNum - discountNum + networkFeeNum;

  const displaySubtotal = subtotalNum.toFixed(2);
  const displayDiscount = discountNum > 0 ? `(-) ${discountNum.toFixed(2)}` : "(-) 00.00";
  const displayTotal = totalNum.toFixed(3);

  const handleApplyPromo = (e: React.FormEvent) => {
    e.preventDefault();
    if (promoInputValue.trim()) {
      applyCoupon(promoInputValue.trim().toUpperCase());
      setPromoInputValue("");
      setShowPromoInput(false);
    }
  };

  const handleConfirmPurchase = () => {
    setIsSuccessModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsSuccessModalOpen(false);
    clearCart();
    navigate({ to: "/" });
  };

  return (
    <div
      className="w-full py-6 sm:py-8 font-mono text-[#F5F1EB] select-none"
      data-testid="payment-page"
    >
      <div className="min-h-[calc(100vh-140px)] flex flex-col justify-start space-y-6">
        {/* Breadcrumb limpo: Início / Mercado / Pagamento */}
        <nav aria-label="Navegação estrutural" className="pt-2">
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
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
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
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
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
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
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
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
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
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
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
                      className="flex-1 bg-[#140D0A] border border-[#2B1B14] focus:border-[#D28A4C] rounded-lg px-3.5 py-2.5 text-xs sm:text-sm text-[#F5F1EB] placeholder:text-[#5A453A] focus:outline-none transition-colors"
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
                const itemTotal = (
                  (Number(item.priceEth) || item.price || 0) * item.quantity
                ).toFixed(2);
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
                          alt={item.title || item.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="space-y-0.5">
                        <h3 className="text-xs sm:text-[13px] font-bold text-[#F5F1EB] truncate max-w-[150px]">
                          {item.title || item.name}
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
                  <span>{couponCode} (10% OFF aplicado)</span>
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
                <span className="font-mono">{networkFeeNum} ETH</span>
              </div>
              <p className="text-[10px] text-center text-[#A69788] pt-0.5">
                Taxa estimada
              </p>
            </div>

            {/* Total */}
            <div className="flex justify-between items-center pt-2 border-t border-[#2E1A13] text-sm sm:text-base font-bold">
              <span className="text-[#F5F1EB]">Total</span>
              <span className="text-[#D28A4C] font-mono">{displayTotal} ETH</span>
            </div>

            {/* Seção: Carteira e rede */}
            <div className="space-y-2 pt-2">
              <h3 className="text-xs sm:text-sm font-bold text-center text-[#F5F1EB] tracking-wide mb-2">
                Carteira e rede
              </h3>

              {/* Opção 1: METAMASK • WALLETCONNECT • COINBASE */}
              <button
                type="button"
                onClick={() => setSelectedWalletOption("all")}
                className={`w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-colors cursor-pointer ${
                  selectedWalletOption === "all"
                    ? "bg-[#1A120E] border-[#D28A4C]"
                    : "bg-[#140D0A] border-[#2E1A13] hover:border-[#3F2319]"
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
                className={`w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-colors cursor-pointer ${
                  selectedWalletOption === "metamask"
                    ? "bg-[#1A120E] border-[#D28A4C]"
                    : "bg-[#140D0A] border-[#2E1A13] hover:border-[#3F2319]"
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
                className={`w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-colors cursor-pointer ${
                  selectedWalletOption === "coinbase"
                    ? "bg-[#1A120E] border-[#D28A4C]"
                    : "bg-[#140D0A] border-[#2E1A13] hover:border-[#3F2319]"
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
              <button
                type="button"
                onClick={handleConfirmPurchase}
                className="w-full bg-[#D28A4C] hover:bg-[#c47b3e] active:scale-[0.99] text-[#0E0907] font-bold text-sm sm:text-base py-3 sm:py-3.5 rounded-lg transition-all shadow-md shadow-[#D28A4C]/20 cursor-pointer"
              >
                Confirmar compra
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
        networkFee={`${networkFeeNum} ETH`}
        total={displayTotal}
        transactionHash="0xA91F...E82C"
        date="29 Jul, 2026"
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
