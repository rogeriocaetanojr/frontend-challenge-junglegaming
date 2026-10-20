/**
 * Componente de Carregamento Acessível para Transições de Rotas (RoutePendingComponent).
 *
 * Fornece feedback visual e para tecnologias assistivas durante transições assíncronas
 * no roteador.
 *
 * Atributos de Acessibilidade:
 * - role="status"
 * - aria-live="polite"
 * - Mensagem descritiva visível e acessível para leitores de tela.
 */
import { Loader2 } from "lucide-react";

import { cn } from "@/lib/utils";

export interface RoutePendingProps {
  message?: string;
  className?: string;
}

export function RoutePendingComponent({
  message = "Carregando conteúdo da página...",
  className,
}: RoutePendingProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "flex min-h-[400px] w-full flex-col items-center justify-center gap-4 px-4 py-12 text-center",
        className,
      )}
    >
      <div className="relative flex size-14 items-center justify-center rounded-full bg-primary/10 border border-primary/20">
        <Loader2 className="size-7 animate-spin text-primary" aria-hidden="true" />
      </div>
      <div className="flex flex-col gap-1 max-w-sm">
        <p className="text-base font-semibold text-foreground">Aguarde um instante</p>
        <p className="text-sm text-text-muted">{message}</p>
      </div>
      {/* Texto explícito para tecnologias assistivas */}
      <span className="sr-only">Carregando conteúdo da página. Aguarde.</span>
    </div>
  );
}

export default RoutePendingComponent;
