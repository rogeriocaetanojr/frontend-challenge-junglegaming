import { useEffect } from "react";
import { Link, NavLink, Outlet, useLocation } from "react-router-dom";
import { ShoppingBag, Sparkles } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

/**
 * Componente utilitário que restaura a posição da barra de rolagem
 * no topo da página a cada transição de rota.
 */
export function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}

export function RootLayout() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans antialiased selection:bg-primary/20 selection:text-primary">
      <ScrollToTop />

      {/* Link de acessibilidade para pular diretamente ao conteúdo principal (WCAG 2.1 AA) */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:p-3 focus:bg-primary focus:text-ink-deep focus:font-semibold focus:rounded-button focus:shadow-lg focus:outline-none"
      >
        Pular para o conteúdo principal
      </a>

      {/* Header estrutural */}
      <header className="sticky top-0 z-40 w-full border-b border-border bg-background/80 backdrop-blur-md">
        <div className="container mx-auto max-w-6xl px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 group">
            <div className="size-8 rounded-card bg-primary/10 border border-primary/20 flex items-center justify-center text-primary group-hover:scale-105 transition-transform">
              <Sparkles className="size-4" />
            </div>
            <span className="font-extrabold text-lg tracking-tight text-foreground">
              NFT<span className="text-primary">Market</span>
            </span>
          </Link>

          <nav
            className="flex items-center gap-2 sm:gap-4"
            aria-label="Navegação Principal"
          >
            <NavLink
              to="/"
              end
              className={({ isActive }) =>
                `text-sm font-medium transition-colors px-3 py-1.5 rounded-button ${
                  isActive
                    ? "text-primary bg-surface-raised font-semibold"
                    : "text-text-muted hover:text-foreground hover:bg-surface-dark"
                }`
              }
            >
              Explorar
            </NavLink>

            <NavLink
              to="/checkout"
              className={({ isActive }) =>
                `text-sm font-medium transition-colors px-3 py-1.5 rounded-button flex items-center gap-1.5 ${
                  isActive
                    ? "text-primary bg-surface-raised font-semibold"
                    : "text-text-muted hover:text-foreground hover:bg-surface-dark"
                }`
              }
            >
              <ShoppingBag className="size-4" />
              <span>Carrinho</span>
            </NavLink>
          </nav>

          <div className="flex items-center gap-2">
            <Badge
              variant="outline"
              className="hidden sm:inline-flex font-mono text-xs text-text-muted border-border"
            >
              Ethereum Sepolia (Simulada)
            </Badge>
            <Button size="sm" variant="default">
              Conectar
            </Button>
          </div>
        </div>
      </header>

      {/* Conteúdo principal envolvendo as rotas aninhadas via Outlet */}
      <main
        id="main-content"
        className="flex-1 container mx-auto max-w-6xl px-4 sm:px-6 py-8"
        tabIndex={-1}
      >
        <Outlet />
      </main>

      {/* Footer estrutural */}
      <footer className="border-t border-border bg-surface-dark/50 py-6 text-center text-xs text-text-muted">
        <div className="container mx-auto max-w-6xl px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p>© 2026 NFT Marketplace. Todos os direitos reservados.</p>
          <p className="font-mono text-[11px]">Desafio Frontend — Jungle Gaming</p>
        </div>
      </footer>
    </div>
  );
}
