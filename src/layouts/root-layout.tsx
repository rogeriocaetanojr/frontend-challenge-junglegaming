import { useEffect } from "react";
import { Link, NavLink, Outlet, useLocation } from "react-router-dom";
import { LogOut, Search, ShoppingCart } from "lucide-react";

import { useAuthStore } from "@/store/auth-store";
import { useCartStore } from "@/store/cart-store";
import { Footer } from "./components/footer";

/**
 * Restaura a posição de rolagem no topo da página a cada transição de rota.
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
  const connectWallet = useAuthStore((state) => state.connectWallet);

  const scrollToCatalog = () => {
    const catalog = document.getElementById("catalog-section");
    if (catalog) {
      catalog.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <div className="min-h-screen bg-[#0E0907] text-[#F5F1EB] flex flex-col font-sans antialiased selection:bg-[#D28A4C]/30 selection:text-[#D28A4C]">
      <ScrollToTop />

      {/* Acessibilidade WCAG: Pular para conteúdo principal */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:p-3 focus:bg-[#D28A4C] focus:text-[#0E0907] focus:font-bold focus:rounded-md focus:shadow-lg focus:outline-none"
      >
        Pular para o conteúdo principal
      </a>

      {/* Header Oficial KURIO */}
      <header className="sticky top-0 z-40 w-full bg-[#0E0907]/95 backdrop-blur-md">
        {/* Container externo com o mesmo padding lateral do Hero */}
        <div className="w-full max-w-[1420px] mx-auto px-6 sm:px-8">
          {/* Linha divisória laranja delimitando exatamente do início da logo até o fim do botão Entrar */}
          <div className="h-14 sm:h-[58px] flex items-center justify-between relative border-b border-[#D28A4C]/50">
            {/* Logo "KURIO" alinhada e sutilmente rebaixada para nível ótico perfeito */}
            <Link
              to="/"
              className="h-full flex items-center font-mono text-[13px] sm:text-[14px] font-bold tracking-[0.22em] text-[#F5F1EB] uppercase select-none hover:opacity-90 transition-opacity leading-none translate-y-[2px]"
              aria-label="KURIO NFT Marketplace"
            >
              KURIO
            </Link>

            {/* Navegação Central: perfeitamente no meio da tela (2 títulos à esquerda, 2 à direita do centro) */}
            <nav
              className="hidden md:flex items-center gap-11 lg:gap-14 h-full absolute left-1/2 -translate-x-1/2 pointer-events-auto"
              aria-label="Navegação Principal"
            >
              <NavLink
                to="/"
                end
                className={({ isActive }) =>
                  `font-mono text-[14.5px] sm:text-[15px] font-normal leading-normal h-full flex items-center relative transition-colors cursor-pointer ${
                    isActive ? "text-[#D28A4C]" : "text-[#F5F1EB] hover:text-white"
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <span>Início</span>
                    {isActive && (
                      <span className="absolute -bottom-[1px] left-0 right-0 h-[2.5px] bg-[#D28A4C]" />
                    )}
                  </>
                )}
              </NavLink>

              <button
                type="button"
                onClick={scrollToCatalog}
                className="font-mono text-[14.5px] sm:text-[15px] font-normal leading-normal h-full flex items-center text-[#F5F1EB] hover:text-white transition-colors cursor-pointer"
              >
                Mercado
              </button>

              <button
                type="button"
                onClick={scrollToCatalog}
                className="font-mono text-[14.5px] sm:text-[15px] font-normal leading-normal h-full flex items-center text-[#F5F1EB] hover:text-white transition-colors cursor-pointer"
              >
                Criadores
              </button>

              <Link
                to="/not-found"
                className="font-mono text-[14.5px] sm:text-[15px] font-normal leading-normal h-full flex items-center text-[#F5F1EB] hover:text-white transition-colors"
              >
                Aprenda
              </Link>
            </nav>

            {/* Lado Direito: Busca, Carrinho e Botão Entrar rebalanceado */}
            <div className="h-full flex items-center gap-4 sm:gap-5">
              {/* Botão de Busca */}
              <button
                type="button"
                onClick={scrollToCatalog}
                className="text-[#F5F1EB] hover:text-[#D28A4C] p-1.5 transition-colors cursor-pointer"
                aria-label="Buscar no catálogo"
              >
                <Search className="size-[20px] stroke-[1.8]" />
              </button>

              {/* Ícone de Carrinho (ShoppingCart) com Badge Numérico no topo direito */}
              <Link
                to="/checkout"
                className="relative text-[#F5F1EB] hover:text-[#D28A4C] p-1.5 transition-colors"
                aria-label={`Carrinho de compras com ${cartCount} itens`}
              >
                <ShoppingCart className="size-[20px] stroke-[1.8]" />
                <span className="absolute -top-1 -right-1.5 min-w-[17px] h-[17px] px-1 rounded-full bg-[#D28A4C] text-[#0E0907] text-[10px] font-bold font-mono flex items-center justify-center leading-none shadow-sm">
                  {cartCount}
                </span>
              </Link>

              {/* Botão Entrar Oficial KURIO com box confortável e proporcional */}
              <button
                type="button"
                onClick={() => connectWallet()}
                className="bg-[#D28A4C] hover:bg-[#c47b3e] text-[#0E0907] font-mono text-[13.5px] sm:text-[14px] font-semibold px-4 py-2 rounded-lg flex items-center gap-2 transition-colors shadow-sm shadow-[#D28A4C]/15 cursor-pointer select-none"
              >
                <LogOut className="size-4 stroke-[2.2]" />
                <span>Entrar</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Conteúdo com 90% de zoom (mantendo a barra de navegação no tamanho atual) */}
      <div className="flex-1 flex flex-col w-full" style={{ zoom: 0.9 }}>
        <main
          id="main-content"
          className="w-full max-w-[1420px] mx-auto px-6 sm:px-8 flex-1"
          tabIndex={-1}
        >
          <Outlet />
        </main>

        {/* Footer Oficial KURIO */}
        <Footer />
      </div>
    </div>
  );
}
