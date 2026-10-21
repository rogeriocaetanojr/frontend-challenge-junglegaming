import { useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import {
  User as UserIcon,
  Wallet,
  Activity,
  Heart,
  Tag,
  Download,
  HelpCircle,
  LogOut,
  Eye,
  EyeOff,
  ChevronDown,
  Trash2,
} from "lucide-react";
import { useAuthStore } from "@/store/auth-store";
import { useFavorites } from "@/features/favorites/api";
import { useProfile } from "@/features/profile/api";
import { useWallets, type CreateWalletInput } from "@/features/wallets/api";

type TabId =
  "dados" | "carteiras" | "atividade" | "lista" | "ofertas" | "arquivos" | "suporte";

export function ProfilePage() {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const {
    updateProfile,
    isUpdating,
    updateError,
    updateAvatar,
    isUpdatingAvatar,
    changePassword,
    isChangingPassword,
    passwordError,
  } = useProfile();
  const {
    wallets,
    isLoading: isLoadingWallets,
    addWallet,
    isAdding: isAddingWallet,
    addError: walletAddError,
    removeWallet,
    isRemoving: isRemovingWallet,
  } = useWallets();

  const [activeTab, setActiveTab] = useState<TabId>("dados");

  // Form states com dados do usuário autenticado
  const [displayName, setDisplayName] = useState(user?.name || "Rogerio Caetano");
  const [username, setUsername] = useState(
    user?.email ? user.email.split("@")[0] : "rogeriocaetano",
  );
  const [email, setEmail] = useState(user?.email || "rogerio@gmail.com");
  const [ensName, setEnsName] = useState("");
  const [ensSuffix, setEnsSuffix] = useState(".eth");
  const [walletNickname, setWalletNickname] = useState("Minha Carteira Principal");

  // Senhas
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmNewPassword, setShowConfirmNewPassword] = useState(false);

  // Avatar
  const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl || "");
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

  // Estados da Aba Carteiras (conforme imagem de referência)
  const [walletDisplayName, setWalletDisplayName] = useState(
    user?.name || "Rogerio Caetano",
  );
  const [walletAlias, setWalletAlias] = useState("Minha Carteira Principal");
  const [walletNetwork, setWalletNetwork] = useState("");
  const [walletProfileName, setWalletProfileName] = useState("rogeriocaetano");
  const [walletAddress, setWalletAddress] = useState("");
  const [walletSecondaryAddress, setWalletSecondaryAddress] = useState("");
  const [walletType, setWalletType] = useState("");
  const [walletReferralCode, setWalletReferralCode] = useState("");
  const [walletEmail, setWalletEmail] = useState(user?.email || "rogerio@gmail.com");
  const [walletEnsSuffix, setWalletEnsSuffix] = useState(".eth");
  const [walletEnsName, setWalletEnsName] = useState("");
  const [walletFeedback, setWalletFeedback] = useState<string | null>(null);
  const [isSameAsPrimary, setIsSameAsPrimary] = useState(false);

  // Lista de Interesses (Favoritos)
  const { favorites, removeFavorite, clearFavorites } = useFavorites();

  const handleWalletSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addWallet({
        address: walletAddress,
        network: (walletNetwork || "ethereum") as CreateWalletInput["network"],
        label: walletAlias,
      });
      setWalletFeedback("Carteira salva com sucesso!");
      setTimeout(() => setWalletFeedback(null), 3000);
    } catch {
      // erro já exposto via walletAddError
    }
  };

  const handleAddSecondaryWallet = async () => {
    if (!walletSecondaryAddress) return;
    try {
      await addWallet({ address: walletSecondaryAddress, role: "secondary" });
      setWalletFeedback("Carteira secundária adicionada com sucesso!");
      setTimeout(() => setWalletFeedback(null), 3000);
    } catch {
      // erro já exposto via walletAddError
    }
  };

  const handleRemoveWallet = (id: string) => {
    void removeWallet(id);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateProfile({ name: displayName, email });
      if (avatarUrl !== (user?.avatarUrl ?? "")) {
        await updateAvatar(avatarUrl);
      }
      if (newPassword) {
        await changePassword({
          currentPassword,
          newPassword,
          confirmPassword: confirmNewPassword,
        });
        setCurrentPassword("");
        setNewPassword("");
        setConfirmNewPassword("");
      }
      setFeedbackMessage("Perfil atualizado com sucesso!");
      setTimeout(() => setFeedbackMessage(null), 3000);
    } catch {
      // erro já exposto via updateError / passwordError
    }
  };

  const handleLogout = () => {
    logout();
    navigate({ to: "/" });
  };

  const handleAvatarChange = () => {
    const newUrl = prompt("Insira a URL da imagem de avatar:", avatarUrl);
    if (newUrl !== null) {
      setAvatarUrl(newUrl);
    }
  };

  const handleAvatarRemove = () => {
    setAvatarUrl("");
  };

  return (
    <div className="w-full min-h-[calc(100vh-140px)] pt-8 pb-28 sm:pb-36 font-mono text-[#F5F1EB]">
      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-8 lg:gap-12 items-start">
        {/* ============================================================== */}
        {/* BARRA LATERAL (SIDEBAR DE NAVEGAÇÃO DE PERFIL)                */}
        {/* ============================================================== */}
        <aside className="w-full bg-[#1A120E] rounded-xl border border-[#2E1A13] overflow-hidden select-none shadow-xl">
          <div className="p-5 border-b border-[#2E1A13]">
            <h2 className="text-base sm:text-lg font-bold text-[#F5F1EB] tracking-wide">
              Meu perfil
            </h2>
          </div>

          <nav className="py-2" aria-label="Menu do perfil">
            <button
              type="button"
              onClick={() => setActiveTab("dados")}
              className={`w-full flex items-center gap-3.5 px-5 py-3.5 text-xs sm:text-sm font-medium transition-all text-left relative cursor-pointer whitespace-nowrap ${
                activeTab === "dados"
                  ? "text-[#D28A4C] bg-[#D28A4C]/10 border-l-[3.5px] border-[#D28A4C]"
                  : "text-[#CFB28C] hover:text-[#F5F1EB] hover:bg-[#25150E] border-l-[3.5px] border-transparent"
              }`}
            >
              <UserIcon className="size-4 shrink-0 stroke-[1.8]" />
              <span>Dados do perfil</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("carteiras")}
              className={`w-full flex items-center gap-3.5 px-5 py-3.5 text-xs sm:text-sm font-medium transition-all text-left relative cursor-pointer whitespace-nowrap ${
                activeTab === "carteiras"
                  ? "text-[#D28A4C] bg-[#D28A4C]/10 border-l-[3.5px] border-[#D28A4C]"
                  : "text-[#CFB28C] hover:text-[#F5F1EB] hover:bg-[#25150E] border-l-[3.5px] border-transparent"
              }`}
            >
              <Wallet className="size-4 shrink-0 stroke-[1.8]" />
              <span>Carteiras</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("atividade")}
              className={`w-full flex items-center gap-3.5 px-5 py-3.5 text-xs sm:text-sm font-medium transition-all text-left relative cursor-pointer whitespace-nowrap ${
                activeTab === "atividade"
                  ? "text-[#D28A4C] bg-[#D28A4C]/10 border-l-[3.5px] border-[#D28A4C]"
                  : "text-[#CFB28C] hover:text-[#F5F1EB] hover:bg-[#25150E] border-l-[3.5px] border-transparent"
              }`}
            >
              <Activity className="size-4 shrink-0 stroke-[1.8]" />
              <span>Atividade</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("lista")}
              className={`w-full flex items-center gap-3.5 px-5 py-3.5 text-xs sm:text-sm font-medium transition-all text-left relative cursor-pointer whitespace-nowrap ${
                activeTab === "lista"
                  ? "text-[#D28A4C] bg-[#D28A4C]/10 border-l-[3.5px] border-[#D28A4C]"
                  : "text-[#CFB28C] hover:text-[#F5F1EB] hover:bg-[#25150E] border-l-[3.5px] border-transparent"
              }`}
            >
              <Heart className="size-4 shrink-0 stroke-[1.8]" />
              <span>Lista de interesse</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("ofertas")}
              className={`w-full flex items-center gap-3.5 px-5 py-3.5 text-xs sm:text-sm font-medium transition-all text-left relative cursor-pointer ${
                activeTab === "ofertas"
                  ? "text-[#D28A4C] bg-[#D28A4C]/10 border-l-[3.5px] border-[#D28A4C]"
                  : "text-[#CFB28C] hover:text-[#F5F1EB] hover:bg-[#25150E] border-l-[3.5px] border-transparent"
              }`}
            >
              <Tag className="size-4 shrink-0 stroke-[1.8]" />
              <span>Ofertas</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("arquivos")}
              className={`w-full flex items-center gap-3.5 px-5 py-3.5 text-xs sm:text-sm font-medium transition-all text-left relative cursor-pointer ${
                activeTab === "arquivos"
                  ? "text-[#D28A4C] bg-[#D28A4C]/10 border-l-[3.5px] border-[#D28A4C]"
                  : "text-[#CFB28C] hover:text-[#F5F1EB] hover:bg-[#25150E] border-l-[3.5px] border-transparent"
              }`}
            >
              <Download className="size-4 shrink-0 stroke-[1.8]" />
              <span>Arquivos baixados</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("suporte")}
              className={`w-full flex items-center gap-3.5 px-5 py-3.5 text-xs sm:text-sm font-medium transition-all text-left relative cursor-pointer ${
                activeTab === "suporte"
                  ? "text-[#D28A4C] bg-[#D28A4C]/10 border-l-[3.5px] border-[#D28A4C]"
                  : "text-[#CFB28C] hover:text-[#F5F1EB] hover:bg-[#25150E] border-l-[3.5px] border-transparent"
              }`}
            >
              <HelpCircle className="size-4 shrink-0 stroke-[1.8]" />
              <span>Suporte</span>
            </button>

            {/* Linha divisória antes de Sair */}
            <div className="my-1 border-t border-[#2E1A13]" />

            <button
              type="button"
              onClick={handleLogout}
              className="w-full flex items-center gap-3.5 px-5 py-3.5 text-xs sm:text-sm font-medium text-[#CFB28C] hover:text-[#D28A4C] hover:bg-[#25150E] transition-all text-left border-l-[3.5px] border-transparent cursor-pointer"
            >
              <LogOut className="size-4 shrink-0 stroke-[1.8]" />
              <span>Sair</span>
            </button>
          </nav>
        </aside>

        {/* ============================================================== */}
        {/* ÁREA DE CONTEÚDO PRINCIPAL (DADOS DO PERFIL / CARTEIRAS)       */}
        {/* ============================================================== */}
        <main className="w-full">
          {activeTab === "dados" ? (
            <div>
              <h1 className="text-base sm:text-lg font-bold text-[#F5F1EB] tracking-wide mb-6">
                Perfil do colecionador
              </h1>

              {feedbackMessage && (
                <div
                  role="status"
                  className="mb-6 p-3 rounded-lg bg-[#D28A4C]/15 border border-[#D28A4C]/40 text-[#F5F1EB] text-xs sm:text-sm"
                >
                  {feedbackMessage}
                </div>
              )}

              {(updateError || passwordError) && (
                <div
                  role="alert"
                  className="mb-6 p-3 rounded-lg bg-[#e05252]/15 border border-[#e05252]/40 text-[#e05252] text-xs sm:text-sm"
                >
                  {updateError || passwordError}
                </div>
              )}

              <form onSubmit={handleSave} className="space-y-6">
                {/* Linha 1: Nome de exibição & Nome de usuário */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div className="space-y-2">
                    <label
                      htmlFor="profile-displayName"
                      className="block text-xs sm:text-[13px] text-[#F5F1EB]"
                    >
                      Nome de exibição<span className="text-[#D28A4C] ml-0.5">*</span>
                    </label>
                    <input
                      id="profile-displayName"
                      type="text"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder="Nome de exibição"
                      className="w-full bg-[#140D0A] border border-[#2B1B14] focus:border-[#D28A4C] rounded-lg px-3.5 py-2.5 text-xs sm:text-sm text-[#F5F1EB] placeholder:text-[#B39463] focus:outline-none transition-colors"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <label
                      htmlFor="profile-username"
                      className="block text-xs sm:text-[13px] text-[#F5F1EB]"
                    >
                      Nome de usuário<span className="text-[#D28A4C] ml-0.5">*</span>
                    </label>
                    <input
                      id="profile-username"
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="Nome de usuário"
                      className="w-full bg-[#140D0A] border border-[#2B1B14] focus:border-[#D28A4C] rounded-lg px-3.5 py-2.5 text-xs sm:text-sm text-[#F5F1EB] placeholder:text-[#B39463] focus:outline-none transition-colors"
                      required
                    />
                  </div>
                </div>

                {/* Linha 2: E-mail & Nome ENS */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div className="space-y-2">
                    <label
                      htmlFor="profile-email"
                      className="block text-xs sm:text-[13px] text-[#F5F1EB]"
                    >
                      E-mail<span className="text-[#D28A4C] ml-0.5">*</span>
                    </label>
                    <input
                      id="profile-email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="E-mail"
                      className="w-full bg-[#140D0A] border border-[#2B1B14] focus:border-[#D28A4C] rounded-lg px-3.5 py-2.5 text-xs sm:text-sm text-[#F5F1EB] placeholder:text-[#B39463] focus:outline-none transition-colors"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <label
                      htmlFor="profile-ensName"
                      className="block text-xs sm:text-[13px] text-[#F5F1EB]"
                    >
                      Nome ENS<span className="text-[#D28A4C] ml-0.5">*</span>
                    </label>
                    <div className="flex items-center gap-2">
                      <div className="relative">
                        <select
                          aria-label="Sufixo ENS"
                          value={ensSuffix}
                          onChange={(e) => setEnsSuffix(e.target.value)}
                          className="appearance-none bg-[#140D0A] border border-[#2B1B14] focus:border-[#D28A4C] rounded-lg pl-3 pr-7 py-2.5 text-xs sm:text-sm text-[#F5F1EB] focus:outline-none transition-colors cursor-pointer"
                        >
                          <option value=".eth">.eth</option>
                          <option value=".xyz">.xyz</option>
                          <option value=".id">.id</option>
                        </select>
                        <ChevronDown className="size-3.5 text-[#CFB28C] absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
                      </div>
                      <input
                        id="profile-ensName"
                        type="text"
                        value={ensName}
                        onChange={(e) => setEnsName(e.target.value)}
                        placeholder="seunome"
                        className="flex-1 bg-[#140D0A] border border-[#2B1B14] focus:border-[#D28A4C] rounded-lg px-3.5 py-2.5 text-xs sm:text-sm text-[#F5F1EB] placeholder:text-[#B39463] focus:outline-none transition-colors"
                      />
                    </div>
                  </div>
                </div>

                {/* Linha 3: Apelido da carteira & Avatar */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 items-start">
                  <div className="space-y-2">
                    <label
                      htmlFor="profile-walletNickname"
                      className="block text-xs sm:text-[13px] text-[#F5F1EB]"
                    >
                      Apelido da carteira<span className="text-[#D28A4C] ml-0.5">*</span>
                    </label>
                    <input
                      id="profile-walletNickname"
                      type="text"
                      value={walletNickname}
                      onChange={(e) => setWalletNickname(e.target.value)}
                      placeholder="Apelido da carteira"
                      className="w-full bg-[#140D0A] border border-[#2B1B14] focus:border-[#D28A4C] rounded-lg px-3.5 py-2.5 text-xs sm:text-sm text-[#F5F1EB] placeholder:text-[#B39463] focus:outline-none transition-colors"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <span className="block text-xs sm:text-[13px] text-[#F5F1EB]">
                      Avatar
                    </span>
                    <div className="flex items-center gap-3 pt-0.5">
                      {/* Avatar circular preview */}
                      <div className="size-10 rounded-full bg-[#140D0A] border border-[#2B1B14] flex items-center justify-center overflow-hidden shrink-0">
                        {avatarUrl ? (
                          <img
                            src={avatarUrl}
                            alt="Avatar"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <UserIcon className="size-5 text-[#CFB28C]/70" />
                        )}
                      </div>

                      {/* Botão Alterar */}
                      <button
                        type="button"
                        onClick={handleAvatarChange}
                        className="bg-[#D28A4C] hover:bg-[#c47b3e] text-[#0E0907] font-bold text-xs sm:text-[13px] px-4 py-2 rounded-lg transition-colors cursor-pointer"
                      >
                        Alterar
                      </button>

                      {/* Botão Remover */}
                      <button
                        type="button"
                        onClick={handleAvatarRemove}
                        className="text-xs sm:text-[13px] text-[#CFB28C] hover:text-[#F5F1EB] transition-colors cursor-pointer"
                      >
                        Remover
                      </button>
                    </div>
                  </div>
                </div>

                {/* Linha separadora / Título: Alterar senha */}
                <div className="pt-4 space-y-4">
                  <h2 className="text-sm sm:text-base font-bold text-[#F5F1EB]">
                    Alterar senha
                  </h2>

                  {/* Senha atual */}
                  <div className="space-y-2">
                    <label
                      htmlFor="profile-currentPassword"
                      className="block text-xs sm:text-[13px] text-[#F5F1EB]"
                    >
                      Senha atual
                    </label>
                    <div className="relative max-w-xl">
                      <input
                        id="profile-currentPassword"
                        type={showCurrentPassword ? "text" : "password"}
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        placeholder="Digite a senha atual"
                        className="w-full bg-[#140D0A] border border-[#2B1B14] focus:border-[#D28A4C] rounded-lg px-3.5 py-2.5 pr-10 text-xs sm:text-sm text-[#F5F1EB] placeholder:text-[#B39463]/50 focus:outline-none transition-colors"
                      />
                      <button
                        type="button"
                        onClick={() => setShowCurrentPassword((prev) => !prev)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[#CFB28C]/70 hover:text-[#CFB28C] p-1 transition-colors"
                        aria-label={showCurrentPassword ? "Ocultar senha" : "Ver senha"}
                      >
                        {showCurrentPassword ? (
                          <Eye className="size-4" />
                        ) : (
                          <EyeOff className="size-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Nova senha */}
                  <div className="space-y-2">
                    <label
                      htmlFor="profile-newPassword"
                      className="block text-xs sm:text-[13px] text-[#F5F1EB]"
                    >
                      Nova senha
                    </label>
                    <div className="relative max-w-xl">
                      <input
                        id="profile-newPassword"
                        type={showNewPassword ? "text" : "password"}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Digite a nova senha"
                        className="w-full bg-[#140D0A] border border-[#2B1B14] focus:border-[#D28A4C] rounded-lg px-3.5 py-2.5 pr-10 text-xs sm:text-sm text-[#F5F1EB] placeholder:text-[#B39463]/50 focus:outline-none transition-colors"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword((prev) => !prev)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[#CFB28C]/70 hover:text-[#CFB28C] p-1 transition-colors"
                        aria-label={showNewPassword ? "Ocultar senha" : "Ver senha"}
                      >
                        {showNewPassword ? (
                          <Eye className="size-4" />
                        ) : (
                          <EyeOff className="size-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Confirmar nova senha */}
                  <div className="space-y-2">
                    <label
                      htmlFor="profile-confirmNewPassword"
                      className="block text-xs sm:text-[13px] text-[#F5F1EB]"
                    >
                      Confirmar nova senha
                    </label>
                    <div className="relative max-w-xl">
                      <input
                        id="profile-confirmNewPassword"
                        type={showConfirmNewPassword ? "text" : "password"}
                        value={confirmNewPassword}
                        onChange={(e) => setConfirmNewPassword(e.target.value)}
                        placeholder="Confirme a nova senha"
                        className="w-full bg-[#140D0A] border border-[#2B1B14] focus:border-[#D28A4C] rounded-lg px-3.5 py-2.5 pr-10 text-xs sm:text-sm text-[#F5F1EB] placeholder:text-[#B39463]/50 focus:outline-none transition-colors"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmNewPassword((prev) => !prev)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[#CFB28C]/70 hover:text-[#CFB28C] p-1 transition-colors"
                        aria-label={
                          showConfirmNewPassword ? "Ocultar senha" : "Ver senha"
                        }
                      >
                        {showConfirmNewPassword ? (
                          <Eye className="size-4" />
                        ) : (
                          <EyeOff className="size-4" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Botão Salvar */}
                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isUpdating || isUpdatingAvatar || isChangingPassword}
                    className="bg-[#D28A4C] hover:bg-[#c47b3e] active:scale-[0.99] text-[#0E0907] font-bold text-xs sm:text-sm px-8 py-2.5 rounded-lg transition-all shadow-md shadow-[#D28A4C]/20 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isUpdating || isUpdatingAvatar || isChangingPassword
                      ? "Salvando..."
                      : "Salvar"}
                  </button>
                </div>
              </form>
            </div>
          ) : activeTab === "carteiras" ? (
            /* ============================================================== */
            /* ABA CARTEIRAS (CONFORME REFERÊNCIA)                           */
            /* ============================================================== */
            <div>
              {/* Carteira principal Header */}
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h1 className="text-base sm:text-lg font-bold text-[#F5F1EB] tracking-wide">
                    Carteira principal
                  </h1>
                  <p className="text-xs sm:text-[13px] text-[#A69788] mt-1">
                    Estas carteiras ficam disponíveis no pagamento e para receber NFTs
                    comprados.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => alert("Adicionar nova carteira principal")}
                  className="text-xs sm:text-sm text-[#D28A4C] hover:underline font-medium cursor-pointer"
                >
                  Adicionar
                </button>
              </div>

              {walletFeedback && (
                <div
                  role="status"
                  className="my-4 p-3 rounded-lg bg-[#D28A4C]/15 border border-[#D28A4C]/40 text-[#F5F1EB] text-xs sm:text-sm"
                >
                  {walletFeedback}
                </div>
              )}

              {walletAddError && (
                <div
                  role="alert"
                  className="my-4 p-3 rounded-lg bg-[#e05252]/15 border border-[#e05252]/40 text-[#e05252] text-xs sm:text-sm"
                >
                  {walletAddError}
                </div>
              )}

              {/* Lista de carteiras vinculadas via API */}
              {!isLoadingWallets && wallets.length > 0 && (
                <ul className="space-y-2 mb-6">
                  {wallets.map((wallet) => (
                    <li
                      key={wallet.id}
                      className="flex items-center justify-between gap-3 p-3 rounded-lg bg-[#140D0A] border border-[#2B1B14]"
                    >
                      <div className="min-w-0">
                        <p className="text-xs sm:text-sm text-[#F5F1EB] font-mono truncate">
                          {wallet.address}
                        </p>
                        <p className="text-[11px] text-[#A69788]">
                          {wallet.role === "primary" ? "Principal" : "Secundária"} ·{" "}
                          {wallet.network}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveWallet(wallet.id)}
                        disabled={isRemovingWallet}
                        className="text-xs text-[#CFB28C]/70 hover:text-[#D28A4C] shrink-0 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                      >
                        Remover
                      </button>
                    </li>
                  ))}
                </ul>
              )}

              {/* Formulário Carteira Principal */}
              <form onSubmit={handleWalletSave} className="space-y-4 mt-5">
                {/* Linha 1: Nome de exibição* & Apelido da carteira* */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div className="space-y-1.5">
                    <label
                      htmlFor="wallet-displayName"
                      className="block text-xs sm:text-[13px] text-[#F5F1EB]"
                    >
                      Nome de exibição<span className="text-[#D28A4C] ml-0.5">*</span>
                    </label>
                    <input
                      id="wallet-displayName"
                      type="text"
                      value={walletDisplayName}
                      onChange={(e) => setWalletDisplayName(e.target.value)}
                      placeholder="Nome de exibição"
                      className="w-full bg-[#140D0A] border border-[#2B1B14] focus:border-[#D28A4C] rounded-lg px-3.5 py-2.5 text-xs sm:text-sm text-[#F5F1EB] placeholder:text-[#5A453A] focus:outline-none transition-colors"
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label
                      htmlFor="wallet-alias"
                      className="block text-xs sm:text-[13px] text-[#F5F1EB]"
                    >
                      Apelido da carteira<span className="text-[#D28A4C] ml-0.5">*</span>
                    </label>
                    <input
                      id="wallet-alias"
                      type="text"
                      value={walletAlias}
                      onChange={(e) => setWalletAlias(e.target.value)}
                      placeholder="Apelido da carteira"
                      className="w-full bg-[#140D0A] border border-[#2B1B14] focus:border-[#D28A4C] rounded-lg px-3.5 py-2.5 text-xs sm:text-sm text-[#F5F1EB] placeholder:text-[#5A453A] focus:outline-none transition-colors"
                      required
                    />
                  </div>
                </div>

                {/* Linha 2: Rede * & Nome do perfil* */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div className="space-y-1.5">
                    <label
                      htmlFor="wallet-network"
                      className="block text-xs sm:text-[13px] text-[#F5F1EB]"
                    >
                      Rede<span className="text-[#D28A4C] ml-0.5">*</span>
                    </label>
                    <div className="relative">
                      <select
                        id="wallet-network"
                        value={walletNetwork}
                        onChange={(e) => setWalletNetwork(e.target.value)}
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
                      htmlFor="wallet-profileName"
                      className="block text-xs sm:text-[13px] text-[#F5F1EB]"
                    >
                      Nome do perfil<span className="text-[#D28A4C] ml-0.5">*</span>
                    </label>
                    <input
                      id="wallet-profileName"
                      type="text"
                      value={walletProfileName}
                      onChange={(e) => setWalletProfileName(e.target.value)}
                      placeholder="Nome do perfil"
                      className="w-full bg-[#140D0A] border border-[#2B1B14] focus:border-[#D28A4C] rounded-lg px-3.5 py-2.5 text-xs sm:text-sm text-[#F5F1EB] placeholder:text-[#5A453A] focus:outline-none transition-colors"
                      required
                    />
                  </div>
                </div>

                {/* Linha 3: Endereço da carteira* & ENS ou carteira secundária (opcional) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div className="space-y-1.5">
                    <label
                      htmlFor="wallet-address"
                      className="block text-xs sm:text-[13px] text-[#F5F1EB]"
                    >
                      Endereço da carteira<span className="text-[#D28A4C] ml-0.5">*</span>
                    </label>
                    <input
                      id="wallet-address"
                      type="text"
                      value={walletAddress}
                      onChange={(e) => setWalletAddress(e.target.value)}
                      placeholder="Endereço 0x da carteira"
                      className="w-full bg-[#140D0A] border border-[#2B1B14] focus:border-[#D28A4C] rounded-lg px-3.5 py-2.5 text-xs sm:text-sm text-[#F5F1EB] placeholder:text-[#5A453A] focus:outline-none transition-colors font-mono"
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label
                      htmlFor="wallet-secondary-optional"
                      className="block text-xs sm:text-[13px] text-transparent select-none"
                    >
                      Secundária
                    </label>
                    <input
                      id="wallet-secondary-optional"
                      type="text"
                      value={walletSecondaryAddress}
                      onChange={(e) => setWalletSecondaryAddress(e.target.value)}
                      placeholder="ENS ou carteira secundária (opcional)"
                      className="w-full bg-[#140D0A] border border-[#2B1B14] focus:border-[#D28A4C] rounded-lg px-3.5 py-2.5 text-xs sm:text-sm text-[#F5F1EB] placeholder:text-[#5A453A] focus:outline-none transition-colors"
                    />
                  </div>
                </div>

                {/* Linha 4: Tipo de carteira* & Código de indicação* */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div className="space-y-1.5">
                    <label
                      htmlFor="wallet-type"
                      className="block text-xs sm:text-[13px] text-[#F5F1EB]"
                    >
                      Tipo de carteira<span className="text-[#D28A4C] ml-0.5">*</span>
                    </label>
                    <div className="relative">
                      <select
                        id="wallet-type"
                        value={walletType}
                        onChange={(e) => setWalletType(e.target.value)}
                        className="w-full bg-[#140D0A] border border-[#2B1B14] focus:border-[#D28A4C] rounded-lg px-3.5 py-2.5 text-xs sm:text-sm text-[#F5F1EB] focus:outline-none transition-colors appearance-none cursor-pointer pr-10"
                      >
                        <option value="" className="bg-[#140D0A] text-[#A69788]">
                          Selecione uma carteira
                        </option>
                        <option value="metamask" className="bg-[#140D0A] text-[#F5F1EB]">
                          MetaMask
                        </option>
                        <option value="coinbase" className="bg-[#140D0A] text-[#F5F1EB]">
                          Coinbase Wallet
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
                        <option value="hardware" className="bg-[#140D0A] text-[#F5F1EB]">
                          Hardware Wallet (Ledger/Trezor)
                        </option>
                      </select>
                      <ChevronDown className="size-4 absolute right-3.5 top-1/2 -translate-y-1/2 text-[#CFB28C] pointer-events-none" />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label
                      htmlFor="wallet-referral"
                      className="block text-xs sm:text-[13px] text-[#F5F1EB]"
                    >
                      Código de indicação<span className="text-[#D28A4C] ml-0.5">*</span>
                    </label>
                    <input
                      id="wallet-referral"
                      type="text"
                      value={walletReferralCode}
                      onChange={(e) => setWalletReferralCode(e.target.value)}
                      placeholder=""
                      className="w-full bg-[#140D0A] border border-[#2B1B14] focus:border-[#D28A4C] rounded-lg px-3.5 py-2.5 text-xs sm:text-sm text-[#F5F1EB] placeholder:text-[#5A453A] focus:outline-none transition-colors"
                    />
                  </div>
                </div>

                {/* Linha 5: E-mail* & Nome ENS * */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div className="space-y-1.5">
                    <label
                      htmlFor="wallet-email"
                      className="block text-xs sm:text-[13px] text-[#F5F1EB]"
                    >
                      E-mail<span className="text-[#D28A4C] ml-0.5">*</span>
                    </label>
                    <input
                      id="wallet-email"
                      type="email"
                      value={walletEmail}
                      onChange={(e) => setWalletEmail(e.target.value)}
                      placeholder="seuemail@exemplo.com"
                      className="w-full bg-[#140D0A] border border-[#2B1B14] focus:border-[#D28A4C] rounded-lg px-3.5 py-2.5 text-xs sm:text-sm text-[#F5F1EB] placeholder:text-[#5A453A] focus:outline-none transition-colors"
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label
                      htmlFor="wallet-ens"
                      className="block text-xs sm:text-[13px] text-[#F5F1EB]"
                    >
                      Nome ENS<span className="text-[#D28A4C] ml-0.5">*</span>
                    </label>
                    <div className="flex gap-2">
                      <div className="relative w-24 shrink-0">
                        <select
                          id="wallet-ensSuffix"
                          value={walletEnsSuffix}
                          onChange={(e) => setWalletEnsSuffix(e.target.value)}
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
                        id="wallet-ens"
                        type="text"
                        value={walletEnsName}
                        onChange={(e) => setWalletEnsName(e.target.value)}
                        placeholder=""
                        className="flex-1 bg-[#140D0A] border border-[#2B1B14] focus:border-[#D28A4C] rounded-lg px-3.5 py-2.5 text-xs sm:text-sm text-[#F5F1EB] placeholder:text-[#5A453A] focus:outline-none transition-colors"
                      />
                    </div>
                  </div>
                </div>

                {/* Botão Salvar carteira */}
                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isAddingWallet}
                    className="bg-[#D28A4C] hover:bg-[#c47b3e] active:scale-[0.99] text-[#0E0907] font-bold text-xs sm:text-sm px-6 py-2.5 rounded-lg transition-all shadow-md shadow-[#D28A4C]/20 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isAddingWallet ? "Salvando..." : "Salvar carteira"}
                  </button>
                </div>
              </form>

              {/* Seção: Carteira secundária */}
              <div className="mt-12 pt-6 pb-12 border-t border-[#2E1A13]/60">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h2 className="text-sm sm:text-base font-bold text-[#F5F1EB] tracking-wide">
                      Carteira secundária
                    </h2>
                    <p className="text-xs sm:text-[13px] text-[#A69788] mt-1">
                      Você ainda não adicionou uma carteira secundária.
                    </p>
                  </div>

                  <div className="flex items-center gap-4 text-xs sm:text-sm">
                    <label className="flex items-center gap-2 cursor-pointer select-none text-[#CFB28C] hover:text-[#F5F1EB]">
                      <input
                        type="checkbox"
                        checked={isSameAsPrimary}
                        onChange={(e) => setIsSameAsPrimary(e.target.checked)}
                        className="sr-only"
                      />
                      <span
                        className={`size-4 rounded-full border flex items-center justify-center transition-colors ${
                          isSameAsPrimary
                            ? "border-[#D28A4C] bg-[#D28A4C]/20"
                            : "border-[#D28A4C]/70"
                        }`}
                      >
                        {isSameAsPrimary && (
                          <span className="size-2 rounded-full bg-[#D28A4C]" />
                        )}
                      </span>
                      <span>Igual à carteira principal</span>
                    </label>

                    <button
                      type="button"
                      onClick={handleAddSecondaryWallet}
                      disabled={isAddingWallet}
                      className="text-[#D28A4C] hover:underline font-medium cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Adicionar
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : activeTab === "lista" ? (
            /* ============================================================== */
            /* ABA LISTA DE INTERESSE (NFTS FAVORITADOS)                     */
            /* ============================================================== */
            <div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
                <div>
                  <h1 className="text-base sm:text-lg font-bold text-[#F5F1EB] tracking-wide flex items-center gap-2">
                    <span>Lista de interesse</span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-[#D28A4C]/15 border border-[#D28A4C]/30 text-[#D28A4C] font-mono">
                      {favorites.length}
                    </span>
                  </h1>
                  <p className="text-xs sm:text-[13px] text-[#A69788] mt-1">
                    Colecionáveis e obras de arte que você favoritou na KURIO.
                  </p>
                </div>

                {favorites.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      if (
                        confirm("Deseja realmente limpar toda a sua lista de interesses?")
                      ) {
                        clearFavorites();
                      }
                    }}
                    className="text-xs text-[#CFB28C]/70 hover:text-[#D28A4C] flex items-center gap-1.5 transition-colors self-start sm:self-auto cursor-pointer"
                  >
                    <Trash2 className="size-3.5" />
                    <span>Limpar lista</span>
                  </button>
                )}
              </div>

              {favorites.length === 0 ? (
                <div className="py-16 px-6 rounded-2xl bg-[#1A120E] border border-[#2E1A13] text-center space-y-4">
                  <div className="size-14 mx-auto rounded-full bg-[#241612] border border-[#3F2319] flex items-center justify-center text-[#D28A4C]/60">
                    <Heart className="size-7" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-base font-bold text-[#F5F1EB]">
                      Sua lista de interesse está vazia
                    </h3>
                    <p className="text-xs sm:text-sm text-[#A69788] max-w-md mx-auto">
                      Explore o catálogo da KURIO e clique no ícone de coração nos cards
                      para salvar seus NFTs favoritos aqui.
                    </p>
                  </div>
                  <Link
                    to="/"
                    className="inline-flex items-center gap-2 bg-[#D28A4C] hover:bg-[#c47b3e] text-[#0E0907] font-bold text-xs sm:text-sm px-6 py-2.5 rounded-lg transition-colors cursor-pointer"
                  >
                    Explorar catálogo
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {favorites.map((fav) => (
                    <article
                      key={fav.id}
                      className="group flex flex-col space-y-3 text-left relative"
                    >
                      {/* Moldura da imagem idêntica aos cards do catálogo */}
                      <div className="relative bg-[#241612] border border-[#3F2319]/80 rounded-[22px] p-2.5 shadow-lg shadow-black/40 transition-all duration-300 group-hover:border-[#D28A4C]/40 group-hover:shadow-xl">
                        <div className="relative aspect-square overflow-hidden rounded-[16px] bg-[#140D0A]">
                          <Link
                            to="/nfts/$id"
                            params={{ id: String(fav.id) }}
                            className="block size-full"
                            aria-label={`Ver detalhes de ${fav.name}`}
                          >
                            <img
                              src={fav.image}
                              alt={fav.name}
                              className="size-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
                              loading="lazy"
                            />
                          </Link>

                          {/* Botão de Remover dos favoritos */}
                          <button
                            type="button"
                            onClick={() => removeFavorite(fav.id)}
                            title="Remover dos favoritos"
                            aria-label={`Remover ${fav.name} da lista de interesse`}
                            className="absolute top-2.5 right-2.5 p-2 rounded-full bg-[#0E0907]/80 hover:bg-[#D28A4C] hover:text-[#0E0907] text-[#D28A4C] backdrop-blur-md border border-[#3F2319] transition-all cursor-pointer shadow-lg"
                          >
                            <Heart className="size-3.5 fill-current" />
                          </button>
                        </div>
                      </div>

                      {/* Metadados: Nome e Preço */}
                      <div className="space-y-1 px-1">
                        <p className="text-[11px] text-[#A69788] truncate font-mono">
                          {fav.collectionName || "Coleção Exclusiva"}
                        </p>
                        <h4 className="text-sm sm:text-base font-normal text-white tracking-tight truncate group-hover:text-[#D28A4C] transition-colors">
                          <Link to="/nfts/$id" params={{ id: String(fav.id) }}>
                            {fav.name}
                          </Link>
                        </h4>
                        <div className="flex items-center justify-between pt-0.5">
                          <span className="text-xs text-[#A69788]">Preço</span>
                          <span className="text-xs sm:text-sm font-bold text-[#D28A4C] font-mono">
                            {fav.priceEth} ETH
                          </span>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </div>
          ) : (
            /* Aba Secundária Placeholder amigável */
            <div className="p-8 rounded-xl bg-[#1A120E] border border-[#2E1A13] text-center space-y-3">
              <h3 className="text-base font-bold text-[#F5F1EB]">
                {activeTab === "atividade" && "Histórico de Atividade"}
                {activeTab === "ofertas" && "Minhas Ofertas"}
                {activeTab === "arquivos" && "Arquivos Baixados"}
                {activeTab === "suporte" && "Suporte e Ajuda"}
              </h3>
              <p className="text-xs sm:text-sm text-[#CFB28C]">
                Esta seção está sincronizada com a sua conta Web3.
              </p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
