import { useRef, useState } from "react";
import { X } from "lucide-react";

import { useFocusTrap } from "@/lib/a11y/useFocusTrap";
import { LoginForm } from "./LoginForm";
import { RegisterForm } from "./RegisterForm";

export interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTab?: "login" | "register";
}

const FORM_CLASS =
  "flex-1 min-h-0 max-w-none border-0 bg-transparent p-0 shadow-none sm:p-0 [&_h2]:hidden";

const TAB_BASE = "transition-colors cursor-pointer";
const TAB_ACTIVE = "text-[#D28A4C]";
const TAB_IDLE = "text-[#F5F1EB]/85 hover:text-[#F5F1EB]";

/**
 * Modal de autenticação: reutiliza os formulários reais (validação Zod e mutações
 * contra a API), que mantêm o usuário na página atual ao concluir.
 */
export function AuthModal({ isOpen, onClose, defaultTab = "login" }: AuthModalProps) {
  const [activeTab, setActiveTab] = useState<"login" | "register">(defaultTab);
  const dialogRef = useRef<HTMLDivElement>(null);
  useFocusTrap(dialogRef, isOpen, onClose);

  if (!isOpen) return null;

  return (
    <div
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby="auth-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 max-md:p-0 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div className="relative w-full max-w-[420px] h-[640px] max-h-[95vh] max-md:max-w-none max-md:h-full max-md:max-h-none max-md:rounded-none max-md:border-0 max-md:bg-[#140D0A] overflow-hidden rounded-2xl bg-[#1A120E] border border-[#2E1A13] shadow-2xl font-mono text-[#F5F1EB] animate-in zoom-in-95 duration-200">
        <button
          type="button"
          onClick={onClose}
          aria-label="Fechar modal"
          className="absolute top-4 right-4 p-1.5 rounded-lg text-[#CFB28C]/80 hover:text-[#F5F1EB] hover:bg-[#25150E] transition-colors cursor-pointer z-20 max-md:hidden"
        >
          <X className="size-4" />
        </button>

        <div className="flex h-full flex-col p-6 pb-4 max-md:overflow-y-auto max-md:[scrollbar-width:none] max-md:px-6 max-md:pt-12">
          <p
            className="md:hidden text-center text-[26px] font-bold tracking-[0.18em] text-[#F5F1EB] mt-8 mb-6 select-none"
            aria-hidden="true"
          >
            KURIO
          </p>
          <div id="auth-modal-title">
            {/* Mobile: título simples refletindo a aba ativa */}
            <h2
              className="hidden max-md:flex w-full justify-center items-center text-center text-base font-bold text-[#F5F1EB] mt-6 mb-2 whitespace-nowrap"
              aria-live="polite"
            >
              {activeTab === "login" ? "Entrar" : "Criar perfil de colecionador"}
            </h2>

            {/* Desktop: abas Entrar | Criar conta */}
            <div className="flex items-center justify-center gap-3 text-lg sm:text-xl font-bold tracking-tight mb-2 shrink-0 max-md:hidden">
              <button
                type="button"
                onClick={() => setActiveTab("login")}
                className={`${TAB_BASE} ${activeTab === "login" ? TAB_ACTIVE : TAB_IDLE}`}
              >
                Entrar
              </button>
              <span className="text-[#CFB28C]/40 font-light text-base select-none">
                |
              </span>
              <button
                type="button"
                onClick={() => setActiveTab("register")}
                className={`${TAB_BASE} ${activeTab === "register" ? TAB_ACTIVE : TAB_IDLE}`}
              >
                Criar conta
              </button>
            </div>
          </div>

          {activeTab === "login" ? (
            <LoginForm
              redirectPath={null}
              onSuccess={onClose}
              onSwitchForm={() => setActiveTab("register")}
              className={FORM_CLASS}
            />
          ) : (
            <RegisterForm
              redirectPath={null}
              onSuccess={onClose}
              onSwitchForm={() => setActiveTab("login")}
              className={FORM_CLASS}
            />
          )}
        </div>
      </div>
    </div>
  );
}
