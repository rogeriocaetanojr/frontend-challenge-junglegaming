/**
 * Componente de Erro Acessível para Falhas em Rotas (RouteErrorComponent).
 *
 * Captura e exibe falhas de transição, loaders ou execução de rota.
 *
 * Requisitos de Acessibilidade e Segurança:
 * - role="alert"
 * - Botão de retry/tentar novamente (acionando reset() ou recarga da página).
 * - Botão/Link para retorno à página inicial ('/').
 * - Proteção de segurança: stack traces técnicos nunca são expostos em produção.
 */
import { AlertTriangle, Home, RotateCcw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface RouteErrorProps {
  error?: Error | unknown;
  reset?: () => void;
  info?: { componentStack?: string };
  className?: string;
  isDev?: boolean;
}

export function RouteErrorComponent({
  error,
  reset,
  info,
  className,
  isDev: customIsDev,
}: RouteErrorProps) {
  const isDev = customIsDev ?? Boolean(import.meta.env.DEV);

  const handleRetry = () => {
    if (reset) {
      reset();
    } else if (typeof window !== "undefined") {
      window.location.reload();
    }
  };

  const handleGoHome = () => {
    if (typeof window !== "undefined") {
      window.location.href = "/";
    }
  };

  // Extrai mensagem amigável sem expor detalhes sensíveis
  let errorMessage = "Ocorreu um erro inesperado ao carregar esta página.";
  let technicalDetail: string | null = null;

  if (error instanceof Error) {
    if (error.message) {
      errorMessage = error.message;
    }
    if (isDev && error.stack) {
      technicalDetail = error.stack;
    }
  } else if (typeof error === "string") {
    errorMessage = error;
  }

  return (
    <div
      role="alert"
      className={cn(
        "flex min-h-[400px] w-full flex-col items-center justify-center gap-5 px-4 py-12 text-center",
        className,
      )}
    >
      <div className="flex size-14 items-center justify-center rounded-full bg-error/10 border border-error/20 text-error">
        <AlertTriangle className="size-7 stroke-[2]" aria-hidden="true" />
      </div>

      <div className="flex flex-col gap-1.5 max-w-md">
        <h2 className="text-xl font-bold tracking-tight text-foreground">
          Falha ao carregar a página
        </h2>
        <p className="text-sm text-text-muted leading-relaxed">{errorMessage}</p>
      </div>

      {isDev && (technicalDetail || info?.componentStack) && (
        <details className="mt-2 max-w-lg w-full text-left rounded-lg border border-border bg-surface-dark p-3 text-xs text-text-muted">
          <summary className="cursor-pointer font-medium text-foreground hover:underline">
            Detalhes técnicos (modo desenvolvimento)
          </summary>
          <pre className="mt-2 max-h-48 overflow-auto whitespace-pre-wrap font-mono text-[11px] text-error">
            {technicalDetail || info?.componentStack}
          </pre>
        </details>
      )}

      <div className="mt-2 flex flex-wrap items-center justify-center gap-3">
        <Button
          type="button"
          onClick={handleRetry}
          variant="default"
          className="bg-primary text-ink-deep hover:bg-primary-dark font-semibold gap-2"
        >
          <RotateCcw className="size-4" aria-hidden="true" />
          <span>Tentar novamente</span>
        </Button>

        <Button
          type="button"
          onClick={handleGoHome}
          variant="outline"
          className="border-border text-foreground hover:bg-surface-raised gap-2"
        >
          <Home className="size-4" aria-hidden="true" />
          <span>Voltar ao início</span>
        </Button>
      </div>
    </div>
  );
}

export default RouteErrorComponent;
