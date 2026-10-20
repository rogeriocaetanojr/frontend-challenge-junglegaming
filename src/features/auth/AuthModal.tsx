import { useState } from "react";
import { Eye, EyeOff, X } from "lucide-react";
import { useAuthStore } from "@/store/auth-store";

export interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTab?: "login" | "register";
}

export function AuthModal({ isOpen, onClose, defaultTab = "login" }: AuthModalProps) {
  const [activeTab, setActiveTab] = useState<"login" | "register">(defaultTab);

  // Estados de formulário de Login
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [showLoginPassword, setShowLoginPassword] = useState(false);

  // Estados de formulário de Registro
  const [registerUsername, setRegisterUsername] = useState("");
  const [registerEmail, setRegisterEmail] = useState("");
  const [registerPassword, setRegisterPassword] = useState("");
  const [registerConfirmPassword, setRegisterConfirmPassword] = useState("");
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const login = useAuthStore((state) => state.login);

  if (!isOpen) return null;

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!loginEmail || !loginPassword) {
      setError("Por favor, preencha todos os campos.");
      return;
    }

    try {
      setIsLoading(true);
      await login({
        email: loginEmail,
        name: loginEmail.split("@")[0] || "Colecionador",
      });
      setIsLoading(false);
      onClose();
    } catch {
      setIsLoading(false);
      setError("Erro ao autenticar. Verifique suas credenciais.");
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (
      !registerUsername ||
      !registerEmail ||
      !registerPassword ||
      !registerConfirmPassword
    ) {
      setError("Por favor, preencha todos os campos.");
      return;
    }

    if (registerPassword !== registerConfirmPassword) {
      setError("As senhas não coincidem.");
      return;
    }

    try {
      setIsLoading(true);
      await login({
        name: registerUsername,
        email: registerEmail,
      });
      setIsLoading(false);
      onClose();
    } catch {
      setIsLoading(false);
      setError("Erro ao criar conta. Tente novamente.");
    }
  };

  const handleSocialLogin = async (provider: "google" | "facebook") => {
    try {
      setIsLoading(true);
      await login({
        name: provider === "google" ? "Usuário Google" : "Usuário Facebook",
        email: `usuario.${provider}@exemplo.com`,
      });
      setIsLoading(false);
      onClose();
    } catch {
      setIsLoading(false);
      setError("Não foi possível conectar com o provedor social.");
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="auth-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
    >
      {/* Container Principal do Modal - Altura total idêntica e padronizada (h-[625px]) */}
      <div className="relative w-full max-w-[480px] sm:max-w-[490px] h-[625px] rounded-2xl bg-[#1A120E] border border-[#2E1A13] shadow-2xl overflow-hidden font-mono text-[#F5F1EB] select-none animate-in zoom-in-95 duration-200 flex flex-col justify-between">
        {/* Botão Fechar no topo direito */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Fechar modal"
          className="absolute top-4 right-4 p-1.5 rounded-lg text-[#CFB28C]/80 hover:text-[#F5F1EB] hover:bg-[#25150E] transition-colors cursor-pointer z-20"
        >
          <X className="size-4" />
        </button>

        <div className="pt-8 pb-7 px-6 sm:px-10 flex-1 flex flex-col">
          {/* Cabeçalho com Abas: Entrar | Criar conta */}
          <div className="flex items-center justify-center gap-3 text-lg sm:text-xl font-bold tracking-tight mb-3">
            <button
              type="button"
              onClick={() => {
                setActiveTab("login");
                setError(null);
              }}
              className={`transition-colors cursor-pointer ${
                activeTab === "login"
                  ? "text-[#D28A4C]"
                  : "text-[#F5F1EB]/85 hover:text-[#F5F1EB]"
              }`}
            >
              Entrar
            </button>
            <span className="text-[#CFB28C]/40 font-light text-base select-none">|</span>
            <button
              type="button"
              onClick={() => {
                setActiveTab("register");
                setError(null);
              }}
              className={`transition-colors cursor-pointer ${
                activeTab === "register"
                  ? "text-[#D28A4C]"
                  : "text-[#F5F1EB]/85 hover:text-[#F5F1EB]"
              }`}
            >
              Criar conta
            </button>
          </div>

          {/* Subtítulo descritivo com quebra idêntica às telas de referência */}
          <div className="text-center text-[12px] sm:text-[13px] text-[#F5F1EB] leading-relaxed mb-5 w-full">
            {activeTab === "login" ? (
              <p className="flex flex-col items-center">
                <span className="whitespace-nowrap">
                  Entre para gerenciar sua carteira, coleção e perfil
                </span>
                <span>de criador.</span>
              </p>
            ) : (
              <p className="flex flex-col items-center">
                <span className="whitespace-nowrap">
                  Crie seu perfil de colecionador e conecte uma
                </span>
                <span>carteira quando quiser.</span>
              </p>
            )}
          </div>

          {/* Mensagem de Erro Geral se houver */}
          {error && (
            <div className="mb-4 rounded-lg bg-red-500/10 border border-red-500/30 p-2.5 text-xs text-red-300 text-center">
              {error}
            </div>
          )}

          {/* Formulários */}
          {activeTab === "login" ? (
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div className="space-y-3.5">
                <div>
                  <input
                    type="email"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    placeholder="contato@email.com"
                    className="w-full bg-[#140D0A] border border-[#2B1B14] rounded-lg px-3.5 py-2.5 text-xs sm:text-sm text-[#F5F1EB] placeholder:text-[#B39463] focus:border-[#D28A4C] focus:outline-none transition-colors"
                    required
                  />
                </div>

                <div className="relative">
                  <input
                    type={showLoginPassword ? "text" : "password"}
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="************"
                    className={`w-full bg-[#140D0A] border border-[#2B1B14] focus:border-[#D28A4C] rounded-lg px-3.5 py-2.5 pr-10 text-xs sm:text-sm text-[#F5F1EB] placeholder:text-[#F5F1EB] focus:outline-none transition-colors ${
                      !showLoginPassword ? "tracking-widest" : ""
                    }`}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowLoginPassword((prev) => !prev)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#CFB28C]/70 hover:text-[#CFB28C] transition-colors p-1"
                    aria-label={showLoginPassword ? "Ocultar senha" : "Ver senha"}
                  >
                    {showLoginPassword ? (
                      <Eye className="size-4" />
                    ) : (
                      <EyeOff className="size-4" />
                    )}
                  </button>
                </div>

                {/* Esqueceu a senha */}
                <div className="flex justify-end pt-0.5">
                  <button
                    type="button"
                    onClick={() => alert("Recuperação de senha enviada para seu e-mail.")}
                    className="text-xs text-[#D28A4C] hover:text-[#e09a5c] transition-colors"
                  >
                    Esqueceu a senha?
                  </button>
                </div>
              </div>

              {/* Botão Entrar */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-[#D28A4C] hover:bg-[#c47b3e] active:scale-[0.99] text-[#0E0907] font-bold text-sm sm:text-base py-3 rounded-lg transition-all shadow-md shadow-[#D28A4C]/20 disabled:opacity-50 cursor-pointer"
              >
                {isLoading ? "Entrando..." : "Entrar"}
              </button>
            </form>
          ) : (
            /* Formulário de Criar conta */
            <form onSubmit={handleRegisterSubmit} className="space-y-3">
              <div>
                <input
                  type="text"
                  value={registerUsername}
                  onChange={(e) => setRegisterUsername(e.target.value)}
                  placeholder="Nome de usuário"
                  className="w-full bg-[#140D0A] border border-[#2B1B14] rounded-lg px-3.5 py-2.5 text-xs sm:text-sm text-[#F5F1EB] placeholder:text-[#B39463] focus:border-[#D28A4C] focus:outline-none transition-colors"
                  required
                />
              </div>

              <div>
                <input
                  type="email"
                  value={registerEmail}
                  onChange={(e) => setRegisterEmail(e.target.value)}
                  placeholder="Digite seu e-mail"
                  className="w-full bg-[#140D0A] border border-[#2B1B14] rounded-lg px-3.5 py-2.5 text-xs sm:text-sm text-[#F5F1EB] placeholder:text-[#B39463] focus:border-[#D28A4C] focus:outline-none transition-colors"
                  required
                />
              </div>

              <div className="relative">
                <input
                  type={showRegisterPassword ? "text" : "password"}
                  value={registerPassword}
                  onChange={(e) => setRegisterPassword(e.target.value)}
                  placeholder="Senha"
                  className="w-full bg-[#140D0A] border border-[#2B1B14] focus:border-[#D28A4C] rounded-lg px-3.5 py-2.5 pr-10 text-xs sm:text-sm text-[#F5F1EB] placeholder:text-[#B39463] focus:outline-none transition-colors"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowRegisterPassword((prev) => !prev)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#CFB28C]/70 hover:text-[#CFB28C] transition-colors p-1"
                  aria-label={showRegisterPassword ? "Ocultar senha" : "Ver senha"}
                >
                  {showRegisterPassword ? (
                    <Eye className="size-4" />
                  ) : (
                    <EyeOff className="size-4" />
                  )}
                </button>
              </div>

              <div>
                <input
                  type={showRegisterPassword ? "text" : "password"}
                  value={registerConfirmPassword}
                  onChange={(e) => setRegisterConfirmPassword(e.target.value)}
                  placeholder="Confirmar senha"
                  className="w-full bg-[#140D0A] border border-[#2B1B14] focus:border-[#D28A4C] rounded-lg px-3.5 py-2.5 text-xs sm:text-sm text-[#F5F1EB] placeholder:text-[#B39463] focus:outline-none transition-colors"
                  required
                />
              </div>

              {/* Botão Criar conta */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-[#D28A4C] hover:bg-[#c47b3e] active:scale-[0.99] text-[#0E0907] font-bold text-sm sm:text-base py-3 rounded-lg transition-all shadow-md shadow-[#D28A4C]/20 disabled:opacity-50 cursor-pointer"
              >
                {isLoading ? "Criando conta..." : "Criar conta"}
              </button>
            </form>
          )}

          {/* Seção Inferior: Divisor "Ou continue com" e Redes Sociais */}
          <div className={activeTab === "login" ? "mt-9" : "mt-5"}>
            <div className="relative mb-3 flex items-center justify-center">
              <div className="w-full border-t border-[#D28A4C]/50" />
              <span className="absolute bg-[#1A120E] px-3 text-[11px] sm:text-xs text-[#F5F1EB] tracking-wide">
                Ou continue com
              </span>
            </div>

            {/* Botões de Redes Sociais */}
            <div className="space-y-2.5">
              {/* Google */}
              <button
                type="button"
                onClick={() => handleSocialLogin("google")}
                disabled={isLoading}
                className="w-full bg-[#140D0A] border border-[#2B1B14] hover:border-[#3F2319] hover:bg-[#1a110d] text-[#F5F1EB] text-xs sm:text-sm py-2.5 px-4 rounded-lg flex items-center justify-center gap-2.5 transition-colors cursor-pointer"
              >
                <svg className="size-4 shrink-0" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span>Continuar com Google</span>
              </button>

              {/* Facebook */}
              <button
                type="button"
                onClick={() => handleSocialLogin("facebook")}
                disabled={isLoading}
                className="w-full bg-[#140D0A] border border-[#2B1B14] hover:border-[#3F2319] hover:bg-[#1a110d] text-[#F5F1EB] text-xs sm:text-sm py-2.5 px-4 rounded-lg flex items-center justify-center gap-2.5 transition-colors cursor-pointer"
              >
                <svg className="size-4 shrink-0" viewBox="0 0 24 24" fill="#1877F2">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
                <span>Continuar com Facebook</span>
              </button>
            </div>
          </div>
        </div>

        {/* Faixa decorativa laranja na base inferior (alinhada à identidade visual) */}
        <div className="h-1.5 w-full bg-[#D28A4C]" />
      </div>
    </div>
  );
}
