import { forwardRef, useState } from "react";
import { Eye, EyeOff } from "lucide-react";

import { Input, type InputProps } from "@/components/ui/input";

/** Input de senha com toggle de visibilidade. */
export const PasswordInput = forwardRef<HTMLInputElement, Omit<InputProps, "type">>(
  ({ className = "", ...props }, ref) => {
    const [visible, setVisible] = useState(false);
    return (
      <div className="relative">
        <Input
          ref={ref}
          type={visible ? "text" : "password"}
          className={`pr-10 ${className}`}
          {...props}
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? "Ocultar caracteres" : "Mostrar caracteres"}
          aria-pressed={visible}
          className="absolute inset-y-0 right-0 flex w-10 items-center justify-center text-text-muted hover:text-foreground transition-colors cursor-pointer"
        >
          {visible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
        </button>
      </div>
    );
  },
);
PasswordInput.displayName = "PasswordInput";

const SOCIAL_BTN =
  "flex h-10 w-full items-center justify-center gap-2 rounded-button border border-border bg-transparent text-sm text-foreground hover:bg-white/5 transition-colors disabled:cursor-not-allowed disabled:opacity-60 max-md:h-12 max-md:rounded-xl max-md:text-sm";

/** Divisor "Ou continue com" + botões sociais (visuais, sem provedor configurado). */
export function SocialAuth({ compact = false }: { compact?: boolean }) {
  const btn = compact
    ? SOCIAL_BTN.replace("h-10", "h-9")
        .replace("text-sm", "text-xs")
        .replace("gap-2", "gap-1.5")
    : SOCIAL_BTN;
  return (
    <div className={compact ? "space-y-1.5" : "space-y-3"}>
      <div
        className={`flex items-center gap-3 text-text-muted ${compact ? "my-1.5 text-[11px]" : "text-xs"}`}
      >
        <span className="h-px flex-1 bg-border" />
        Ou continue com
        <span className="h-px flex-1 bg-border" />
      </div>
      <button type="button" disabled title="Em breve" className={btn}>
        <svg viewBox="0 0 24 24" className="size-4" aria-hidden="true">
          <path
            fill="#4285F4"
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1z"
          />
          <path
            fill="#34A853"
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23z"
          />
          <path
            fill="#FBBC05"
            d="M5.84 14.1A6.6 6.6 0 0 1 5.5 12c0-.73.13-1.44.34-2.1V7.06H2.18A11 11 0 0 0 1 12c0 1.77.43 3.45 1.18 4.94l3.66-2.84z"
          />
          <path
            fill="#EA4335"
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15A10.96 10.96 0 0 0 12 1 11 11 0 0 0 2.18 7.06l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z"
          />
        </svg>
        Continuar com Google
      </button>
      <button type="button" disabled title="Em breve" className={btn}>
        <svg viewBox="0 0 24 24" className="size-4" aria-hidden="true">
          <path
            fill="#1877F2"
            d="M24 12.07C24 5.41 18.63 0 12 0S0 5.4 0 12.07C0 18.1 4.39 23.1 10.13 24v-8.44H7.08v-3.49h3.04V9.41c0-3.02 1.8-4.7 4.54-4.7 1.31 0 2.68.24 2.68.24v2.97h-1.5c-1.5 0-1.96.93-1.96 1.89v2.26h3.32l-.53 3.5h-2.8V24C19.62 23.1 24 18.1 24 12.07z"
          />
        </svg>
        Continuar com Facebook
      </button>
    </div>
  );
}
