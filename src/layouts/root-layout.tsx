import { useEffect, useRef, useState } from "react";
import {
  Link,
  NavLink,
  Outlet,
  useLocation,
  useNavigate,
  useSearchParams,
} from "react-router-dom";
import { LogOut, Search, ShoppingCart, User as UserIcon, X } from "lucide-react";

import { useAuthStore } from "@/store/auth-store";
import { useCartStore } from "@/store/cart-store";
import { AuthModal } from "@/features/auth/AuthModal";
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
  const user = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();

  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const searchValue = searchParams.get("search") || searchParams.get("q") || "";

  // Fecha o popover de busca ao clicar fora ou ao pressionar Escape
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(event.target as Node)
      ) {
        setIsSearchOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsSearchOpen(false);
      }
    };

    if (isSearchOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleKeyDown);
      setTimeout(() => {
        searchInputRef.current?.focus();
        searchInputRef.current?.select();
      }, 50);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isSearchOpen]);

  const scrollToCatalog = () => {
    if (pathname !== "/") {
      navigate("/");
      setTimeout(() => {
        const catalog = document.getElementById("catalog-section");
        if (catalog) {
          catalog.scrollIntoView({ behavior: "smooth" });
        }
      }, 100);
      return;
    }

    const catalog = document.getElementById("catalog-section");
    if (catalog) {
      catalog.scrollIntoView({ behavior: "smooth" });
    }
  };

  const toggleSearch = () => {
    setIsSearchOpen((prev) => {
      const next = !prev;
      if (next) {
        if (pathname !== "/") {
          navigate("/");
        }
        setTimeout(() => {
          const catalog = document.getElementById("catalog-section");
          if (catalog) {
            catalog.scrollIntoView({ behavior: "smooth" });
          }
        }, 50);
      }
      return next;
    });
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    const newParams = new URLSearchParams(searchParams);
    if (val.trim()) {
      newParams.set("search", val);
    } else {
      newParams.delete("search");
      newParams.delete("q");
    }

    if (pathname !== "/") {
      navigate(`/?${newParams.toString()}`);
    } else {
      setSearchParams(newParams, { replace: true });
    }

    const catalog = document.getElementById("catalog-section");
    if (catalog) {
      catalog.scrollIntoView({ behavior: "smooth" });
    }
  };

  const handleClearSearch = () => {
    const newParams = new URLSearchParams(searchParams);
    newParams.delete("search");
    newParams.delete("q");
    if (pathname !== "/") {
      navigate(`/?${newParams.toString()}`);
    } else {
      setSearchParams(newParams, { replace: true });
    }
    searchInputRef.current?.focus();
  };

  return (
    <div className="min-h-screen bg-[#140D0A] text-[#F5F1EB] flex flex-col font-sans antialiased selection:bg-[#D28A4C]/30 selection:text-[#D28A4C]">
      <ScrollToTop />

      {/* Acessibilidade WCAG: Pular para conteúdo principal */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:p-3 focus:bg-[#D28A4C] focus:text-[#0E0907] focus:font-bold focus:rounded-md focus:shadow-lg focus:outline-none"
      >
        Pular para o conteúdo principal
      </a>

      {/* Header Oficial KURIO */}
      <header className="sticky top-0 z-40 w-full bg-[#140D0A]/95 backdrop-blur-md">
        {/* Container externo com o mesmo padding lateral do Hero */}
        <div className="w-full max-w-[1420px] mx-auto px-6 sm:px-8">
          {/* Linha divisória laranja delimitando exatamente do início da logo até o fim do botão Entrar */}
          <div className="h-[58px] sm:h-[62px] flex items-center justify-between relative border-b border-[#D28A4C]/50">
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
                className={({ isActive }) => {
                  const isActuallyHome = isActive && !pathname.startsWith("/nft");
                  return `font-mono text-[14.5px] sm:text-[15px] font-normal leading-normal h-full flex items-center relative transition-colors cursor-pointer ${
                    isActuallyHome ? "text-[#D28A4C]" : "text-[#F5F1EB] hover:text-white"
                  }`;
                }}
              >
                {({ isActive }) => {
                  const isActuallyHome = isActive && !pathname.startsWith("/nft");
                  return (
                    <>
                      <span>Início</span>
                      {isActuallyHome && (
                        <span className="absolute -bottom-[1px] left-0 right-0 h-[2.5px] bg-[#D28A4C]" />
                      )}
                    </>
                  );
                }}
              </NavLink>

              {(() => {
                const isMarketActive = pathname.startsWith("/nft");
                return (
                  <button
                    type="button"
                    onClick={scrollToCatalog}
                    className={`font-mono text-[14.5px] sm:text-[15px] font-normal leading-normal h-full flex items-center relative transition-colors cursor-pointer ${
                      isMarketActive
                        ? "text-[#D28A4C]"
                        : "text-[#F5F1EB] hover:text-white"
                    }`}
                  >
                    <span>Mercado</span>
                    {isMarketActive && (
                      <span className="absolute -bottom-[1px] left-0 right-0 h-[2.5px] bg-[#D28A4C]" />
                    )}
                  </button>
                );
              })()}

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
            <div className="h-full flex items-center gap-3 sm:gap-4">
              {/* Botão de Busca com Input Compacto Inline ao Lado */}
              <div className="flex items-center h-full" ref={searchContainerRef}>
                {isSearchOpen && (
                  <div className="flex items-center animate-in fade-in slide-in-from-right-2 duration-150 mr-1.5">
                    <div className="relative flex items-center">
                      <input
                        ref={searchInputRef}
                        id="catalog-search-input"
                        type="search"
                        role="searchbox"
                        value={searchValue}
                        onChange={handleSearchChange}
                        placeholder="Buscar..."
                        className="w-20 sm:w-24 h-6.5 sm:h-7 pl-2 pr-5 text-[11px] sm:text-[11.5px] font-mono bg-[#140D0A] border border-[#3F2319] rounded text-[#F5F1EB] placeholder:text-[#F5F1EB]/35 transition-colors focus:border-[#D28A4C] focus:ring-1 focus:ring-[#D28A4C] focus:outline-none [&::-webkit-search-cancel-button]:hidden"
                        autoComplete="off"
                        spellCheck="false"
                      />
                      {searchValue && (
                        <button
                          type="button"
                          onClick={handleClearSearch}
                          aria-label="Limpar busca"
                          className="absolute right-1 text-[#F5F1EB]/40 hover:text-[#D28A4C] p-0.5 rounded transition-colors"
                        >
                          <X className="size-2.5" />
                        </button>
                      )}
                    </div>
                  </div>
                )}

                <button
                  type="button"
                  onClick={toggleSearch}
                  className={`p-1.5 transition-colors cursor-pointer rounded-md ${
                    isSearchOpen
                      ? "text-[#D28A4C] bg-[#D28A4C]/10"
                      : "text-[#F5F1EB] hover:text-[#D28A4C]"
                  }`}
                  aria-label={isSearchOpen ? "Fechar busca" : "Buscar no catálogo"}
                  aria-expanded={isSearchOpen}
                >
                  <Search className="size-[19px] sm:size-[20px] stroke-[1.8]" />
                </button>
              </div>

              {/* Ícone de Carrinho (ShoppingCart) com Badge Numérico no topo direito */}
              <Link
                to="/cart"
                className="relative text-[#F5F1EB] hover:text-[#D28A4C] p-1.5 transition-colors"
                aria-label={`Carrinho de compras com ${cartCount} itens`}
              >
                <ShoppingCart className="size-[20px] stroke-[1.8]" />
                <span className="absolute -top-1 -right-1.5 min-w-[17px] h-[17px] px-1 rounded-full bg-[#D28A4C] text-[#0E0907] text-[10px] font-bold font-mono flex items-center justify-center leading-none shadow-sm">
                  {cartCount}
                </span>
              </Link>

              {/* Botão Oficial KURIO: Perfil Minimalista (com nome e avatar à direita) ou Entrar */}
              {isAuthenticated && user ? (
                <button
                  type="button"
                  onClick={() => navigate("/profile")}
                  title="Ver meu perfil"
                  className="group flex items-center gap-2.5 px-2 sm:px-2.5 py-1.5 rounded-lg font-mono text-[13.5px] sm:text-[14px] text-[#F5F1EB] hover:text-[#D28A4C] transition-all cursor-pointer select-none"
                >
                  <span className="font-medium truncate max-w-[130px] group-hover:text-[#D28A4C] transition-colors">
                    {user.name || "Perfil"}
                  </span>
                  {/* Ícone de Avatar circular à direita que reflete foto ou ícone padrão de perfil */}
                  <div className="size-7 sm:size-7.5 rounded-full bg-[#1A120E] border border-[#3F2319] group-hover:border-[#D28A4C] flex items-center justify-center overflow-hidden shrink-0 transition-colors">
                    {user.avatarUrl ? (
                      <img
                        src={user.avatarUrl}
                        alt={user.name || "Avatar"}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <UserIcon className="size-4 text-[#CFB28C] group-hover:text-[#D28A4C] transition-colors" />
                    )}
                  </div>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsAuthModalOpen(true)}
                  className="bg-[#D28A4C] hover:bg-[#c47b3e] text-[#0E0907] font-mono text-[13.5px] sm:text-[14px] font-semibold px-4 py-2 rounded-lg flex items-center gap-2 transition-colors shadow-sm shadow-[#D28A4C]/15 cursor-pointer select-none"
                >
                  <LogOut className="size-4 stroke-[2.2]" />
                  <span>Entrar</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Conteúdo da página com escala confortável de 90%, mantendo navbar intacta */}
      <div className="flex-1 flex flex-col w-full" style={{ zoom: 0.9 }}>
        <main
          id="main-content"
          className="w-full max-w-[1420px] mx-auto px-6 sm:px-8 flex-1"
          tabIndex={-1}
        >
          <Outlet />
        </main>

        {/* Footer Oficial KURIO (oculto na página de perfil) */}
        {pathname !== "/profile" && <Footer />}
      </div>

      {/* Modal de Autenticação (Entrar / Criar Conta) */}
      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
    </div>
  );
}
