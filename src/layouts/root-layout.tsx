import { useEffect } from "react";
import { Link, NavLink, Outlet, useLocation } from "react-router-dom";
import { ChevronDown, LogOut, ShoppingBag, Sparkles, Wallet } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatEth, truncateAddress } from "@/lib/formatters";
import { useAuthStore } from "@/store/auth-store";
import { useCartStore } from "@/store/cart-store";

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
  const cartCount = useCartStore((state) => state.items.length);
  const user = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const connectWallet = useAuthStore((state) => state.connectWallet);
  const logout = useAuthStore((state) => state.logout);

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
                `text-sm font-medium transition-colors px-3 py-1.5 rounded-button flex items-center gap-2 ${
                  isActive
                    ? "text-primary bg-surface-raised font-semibold"
                    : "text-text-muted hover:text-foreground hover:bg-surface-dark"
                }`
              }
            >
              <div className="relative flex items-center">
                <ShoppingBag className="size-4" />
                {cartCount > 0 && (
                  <span
                    className="absolute -top-2 -right-2.5 min-w-4 h-4 px-1 rounded-full bg-primary text-ink-deep text-[10px] font-bold flex items-center justify-center animate-in fade-in zoom-in-75 duration-200"
                    aria-label={`${cartCount} itens no carrinho`}
                  >
                    {cartCount}
                  </span>
                )}
              </div>
              <span>Carrinho</span>
            </NavLink>
          </nav>

          {/* Autenticação & Conexão de Carteira */}
          <div className="flex items-center gap-3">
            {isAuthenticated && user ? (
              <div className="flex items-center gap-2.5">
                <div className="hidden sm:flex flex-col items-end text-right">
                  <span className="text-xs font-mono font-bold text-primary">
                    {formatEth(user.balanceEth)}
                  </span>
                  <span className="text-[10px] text-text-muted">Saldo Simulado</span>
                </div>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-2 border-border bg-surface-dark hover:bg-surface-raised font-mono text-xs"
                      aria-label="Menu da carteira do usuário"
                    >
                      <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
                      <span>{truncateAddress(user.walletAddress)}</span>
                      <ChevronDown className="size-3 text-text-muted" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel className="font-normal">
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-semibold leading-none text-foreground">
                          {user.name}
                        </p>
                        <p className="text-xs leading-none text-text-muted truncate">
                          {user.email}
                        </p>
                        <p className="text-xs font-mono text-primary pt-1">
                          {formatEth(user.balanceEth)}
                        </p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={logout}
                      className="text-destructive focus:text-destructive focus:bg-destructive/10 cursor-pointer gap-2"
                    >
                      <LogOut className="size-4" />
                      <span>Desconectar Carteira</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Badge
                  variant="outline"
                  className="hidden sm:inline-flex font-mono text-xs text-text-muted border-border"
                >
                  Ethereum Sepolia (Simulada)
                </Badge>
                <Button
                  size="sm"
                  variant="default"
                  onClick={() => connectWallet()}
                  className="gap-1.5"
                >
                  <Wallet className="size-4" />
                  <span>Conectar Carteira</span>
                </Button>
              </div>
            )}
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
