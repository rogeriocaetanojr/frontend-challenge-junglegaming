import { Link } from "@tanstack/react-router";
import { AlertCircle, Home } from "lucide-react";

import { Button } from "@/components/ui/button";

export function NotFoundPage() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center p-6 space-y-6">
      <div className="size-20 bg-surface-dark border border-border rounded-full flex items-center justify-center text-primary">
        <AlertCircle className="size-10" aria-hidden="true" />
      </div>

      <div className="space-y-2 max-w-md">
        <span className="text-xs font-mono font-semibold text-primary uppercase tracking-widest">
          Erro 404
        </span>
        <h1 className="text-3xl font-extrabold text-foreground tracking-tight">
          Página Não Encontrada
        </h1>
        <p className="text-sm text-text-muted">
          O recurso ou rota que você tentou acessar não existe, foi removido ou está
          temporariamente indisponível.
        </p>
      </div>

      <Button asChild size="lg" className="gap-2">
        <Link to="/" aria-label="Voltar para a página inicial">
          <Home className="size-4" />
          <span>Voltar ao Início</span>
        </Link>
      </Button>
    </div>
  );
}
