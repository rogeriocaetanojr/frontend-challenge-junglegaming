import { Link } from "react-router-dom";

import { NewsletterFeaturesSection } from "@/pages/home/components/newsletter-features-section";

export function Footer() {
  return (
    <footer className="w-full bg-[#0E0907] pt-2 pb-16 text-[#F5F1EB] text-xs font-mono">
      <div className="w-full max-w-[1420px] mx-auto px-6 sm:px-8">
        <div className="bg-[#241612] border border-[#38220F] rounded-[24px] overflow-hidden shadow-lg shadow-black/40">
          {/* 1. Topo: Diferenciais W, C, D e Newsletter grudados no topo */}
          <NewsletterFeaturesSection />

          {/* 2. Meio: Faixa divisória KURIO (#38220F) */}
          <div className="bg-[#38220F] border-y border-[#38220F] px-6 sm:px-8 lg:px-10 py-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <Link
              to="/"
              className="text-xl font-mono font-black tracking-widest text-[#F5F1EB] uppercase select-none hover:text-[#D28A4C] transition-colors"
              aria-label="KURIO Home"
            >
              KURIO
            </Link>

            <p className="text-xs text-[#F5F1EB] font-mono">
              Feito para colecionadores, criadores e cultura
            </p>

            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-6 text-xs text-[#F5F1EB]">
              <a
                href="mailto:contato@email.com"
                className="hover:text-[#D28A4C] transition-colors"
              >
                contato@email.com
              </a>
              <span className="hidden sm:inline text-[#F5F1EB]/40">|</span>
              <a
                href="tel:+551140028922"
                className="hover:text-[#D28A4C] transition-colors"
              >
                +55 11 4002 8922
              </a>
            </div>
          </div>

          {/* 2. Colunas de Links Principais: 4 Colunas Perfeitamente Alinhadas */}
          <div className="px-6 sm:px-8 lg:px-10 py-10">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 text-left">
              {/* Coluna 1: Meu Perfil */}
              <div className="space-y-3.5">
                <h4 className="text-sm sm:text-base font-bold font-mono text-[#F5F1EB] tracking-wide">
                  Meu perfil
                </h4>
                <ul className="space-y-2">
                  <li>
                    <Link
                      to="/not-found"
                      className="text-[#F5F1EB] hover:text-[#D28A4C] transition-colors"
                    >
                      Meu perfil
                    </Link>
                  </li>
                  <li>
                    <Link
                      to="/not-found"
                      className="text-[#F5F1EB] hover:text-[#D28A4C] transition-colors"
                    >
                      Minha coleção
                    </Link>
                  </li>
                  <li>
                    <Link
                      to="/not-found"
                      className="text-[#F5F1EB] hover:text-[#D28A4C] transition-colors"
                    >
                      Atividade
                    </Link>
                  </li>
                  <li>
                    <Link
                      to="/not-found"
                      className="text-[#F5F1EB] hover:text-[#D28A4C] transition-colors"
                    >
                      Estúdio do criador
                    </Link>
                  </li>
                  <li>
                    <Link
                      to="/not-found"
                      className="text-[#F5F1EB] hover:text-[#D28A4C] transition-colors"
                    >
                      Lista de interesse
                    </Link>
                  </li>
                </ul>
              </div>

              {/* Coluna 2: Central de Ajuda */}
              <div className="space-y-3.5">
                <h4 className="text-sm sm:text-base font-bold font-mono text-[#F5F1EB] tracking-wide">
                  Central de ajuda
                </h4>
                <ul className="space-y-2">
                  <li>
                    <Link
                      to="/not-found"
                      className="text-[#F5F1EB] hover:text-[#D28A4C] transition-colors"
                    >
                      Central de ajuda
                    </Link>
                  </li>
                  <li>
                    <Link
                      to="/not-found"
                      className="text-[#F5F1EB] hover:text-[#D28A4C] transition-colors"
                    >
                      Como comprar NFTs
                    </Link>
                  </li>
                  <li>
                    <Link
                      to="/not-found"
                      className="text-[#F5F1EB] hover:text-[#D28A4C] transition-colors"
                    >
                      Carteira e segurança
                    </Link>
                  </li>
                  <li>
                    <Link
                      to="/not-found"
                      className="text-[#F5F1EB] hover:text-[#D28A4C] transition-colors"
                    >
                      Políticas do mercado
                    </Link>
                  </li>
                  <li>
                    <Link
                      to="/not-found"
                      className="text-[#F5F1EB] hover:text-[#D28A4C] transition-colors"
                    >
                      Denunciar item
                    </Link>
                  </li>
                </ul>
              </div>

              {/* Coluna 3: Coleções */}
              <div className="space-y-3.5">
                <h4 className="text-sm sm:text-base font-bold font-mono text-[#F5F1EB] tracking-wide">
                  Coleções
                </h4>
                <ul className="space-y-2">
                  <li>
                    <Link
                      to="/"
                      className="text-[#F5F1EB] hover:text-[#D28A4C] transition-colors"
                    >
                      Arte digital
                    </Link>
                  </li>
                  <li>
                    <Link
                      to="/"
                      className="text-[#F5F1EB] hover:text-[#D28A4C] transition-colors"
                    >
                      Fotografia
                    </Link>
                  </li>
                  <li>
                    <Link
                      to="/"
                      className="text-[#F5F1EB] hover:text-[#D28A4C] transition-colors"
                    >
                      Música
                    </Link>
                  </li>
                  <li>
                    <Link
                      to="/"
                      className="text-[#F5F1EB] hover:text-[#D28A4C] transition-colors"
                    >
                      Arte 3D
                    </Link>
                  </li>
                  <li>
                    <Link
                      to="/"
                      className="text-[#F5F1EB] hover:text-[#D28A4C] transition-colors"
                    >
                      Utilidade
                    </Link>
                  </li>
                </ul>
              </div>

              {/* Coluna 4: Redes Sociais e Carteiras Compatíveis */}
              <div className="space-y-6">
                {/* Redes Sociais */}
                <div className="space-y-3.5 w-full max-w-[272px]">
                  <h4 className="text-sm sm:text-base font-bold font-mono text-[#F5F1EB] tracking-wide">
                    Redes sociais
                  </h4>
                  <div className="flex items-center justify-between w-full">
                    {/* Facebook */}
                    <a
                      href="https://facebook.com"
                      target="_blank"
                      rel="noreferrer"
                      className="size-9 rounded-lg bg-[#38220F] border border-[#55321F] flex items-center justify-center text-[#D28A4C] hover:text-white hover:border-[#D28A4C] transition-colors"
                      aria-label="Facebook"
                    >
                      <svg className="size-4 fill-current" viewBox="0 0 24 24">
                        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                      </svg>
                    </a>
                    {/* Instagram */}
                    <a
                      href="https://instagram.com"
                      target="_blank"
                      rel="noreferrer"
                      className="size-9 rounded-lg bg-[#38220F] border border-[#55321F] flex items-center justify-center text-[#D28A4C] hover:text-white hover:border-[#D28A4C] transition-colors"
                      aria-label="Instagram"
                    >
                      <svg className="size-4 fill-current" viewBox="0 0 24 24">
                        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                      </svg>
                    </a>
                    {/* Twitter / X */}
                    <a
                      href="https://twitter.com"
                      target="_blank"
                      rel="noreferrer"
                      className="size-9 rounded-lg bg-[#38220F] border border-[#55321F] flex items-center justify-center text-[#D28A4C] hover:text-white hover:border-[#D28A4C] transition-colors"
                      aria-label="Twitter / X"
                    >
                      <svg className="size-3.5 fill-current" viewBox="0 0 24 24">
                        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                      </svg>
                    </a>
                    {/* LinkedIn */}
                    <a
                      href="https://linkedin.com"
                      target="_blank"
                      rel="noreferrer"
                      className="size-9 rounded-lg bg-[#38220F] border border-[#55321F] flex items-center justify-center text-[#D28A4C] hover:text-white hover:border-[#D28A4C] transition-colors"
                      aria-label="LinkedIn"
                    >
                      <svg className="size-3.5 fill-current" viewBox="0 0 24 24">
                        <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
                      </svg>
                    </a>
                    {/* YouTube */}
                    <a
                      href="https://youtube.com"
                      target="_blank"
                      rel="noreferrer"
                      className="size-9 rounded-lg bg-[#38220F] border border-[#55321F] flex items-center justify-center text-[#D28A4C] hover:text-white hover:border-[#D28A4C] transition-colors"
                      aria-label="YouTube"
                    >
                      <svg className="size-4 fill-current" viewBox="0 0 24 24">
                        <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                      </svg>
                    </a>
                  </div>
                </div>

                {/* Carteiras Compatíveis: Pílula única como na imagem de referência */}
                <div className="space-y-3.5 w-full max-w-[272px]">
                  <h4 className="text-sm sm:text-base font-bold font-mono text-[#F5F1EB] tracking-wide">
                    Carteiras compatíveis
                  </h4>
                  <div className="w-full flex items-center justify-between px-3.5 py-2 rounded-lg bg-[#38220F] border border-[#55321F] font-mono text-[10.5px] font-bold text-[#D28A4C] select-none">
                    <span>METAMASK</span>
                    <span className="text-[#55321F]">•</span>
                    <span>WALLETCONNECT</span>
                    <span className="text-[#55321F]">•</span>
                    <span>COINBASE</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Direitos Autorais com fundo sólido escuro do site */}
      <div className="pt-8 pb-2 text-center text-[#F5F1EB]/60 text-xs font-mono">
        <p>© 2026 Kurio. Propriedade digital para todos.</p>
      </div>
    </footer>
  );
}
