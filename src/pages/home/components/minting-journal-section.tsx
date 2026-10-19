import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

interface ArticleItem {
  id: string;
  image: string;
  date: string;
  readTime: string;
  title: string;
  description: string;
}

const ARTICLES: ArticleItem[] = [
  {
    id: "1",
    image: "/images/nfts/noct-vessel.png",
    date: "12 de setembro",
    readTime: "Leitura de 6 min",
    title: "Como funciona a propriedade de NFTs",
    description: "Aprenda a colecionar, negociar e verificar ativos digitais.",
  },
  {
    id: "2",
    image: "/images/nfts/emerald-ape.png",
    date: "13 de setembro",
    readTime: "Leitura de 2 min",
    title: "10 artistas digitais para acompanhar",
    description: "Conheça criadores que moldam a cultura digital.",
  },
  {
    id: "3",
    image: "/images/nfts/sage-nomad.png",
    date: "15 de setembro",
    readTime: "Leitura de 3 min",
    title: "Raridade, atributos e procedência",
    description: "Entenda raridade, procedência, direitos autorais e utilidade.",
  },
  {
    id: "4",
    image: "/images/nfts/golden-bear.png",
    date: "15 de setembro",
    readTime: "Leitura de 2 min",
    title: "Como proteger sua carteira",
    description: "Proteja sua carteira, seus ativos e sua identidade.",
  },
];

export function MintingJournalSection() {
  return (
    <section className="py-12 space-y-10" aria-label="Diário da Cunhagem">
      {/* Cabeçalho Centralizado */}
      <div className="text-center space-y-2 max-w-2xl mx-auto">
        <h2 className="text-2xl sm:text-3xl font-mono font-bold text-white tracking-tight">
          Diário da Cunhagem
        </h2>
        <p className="text-xs sm:text-sm text-[#CFB28C]/80">
          Histórias, guias e insights para colecionadores sobre o universo da propriedade
          digital.
        </p>
      </div>

      {/* Grid com 4 Cartões de Artigos com fundo idêntico ao restante do site */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {ARTICLES.map((article) => (
          <article
            key={article.id}
            className="group flex flex-col bg-[#241612] border border-[#3F2319]/80 rounded-[20px] overflow-hidden shadow-lg shadow-black/40 text-left transition-all duration-300 hover:border-[#D28A4C]/40 hover:shadow-xl"
          >
            {/* Imagem do Artigo no topo */}
            <div className="relative aspect-square overflow-hidden bg-[#140D0A]">
              <img
                src={article.image}
                alt={article.title}
                className="size-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
                loading="lazy"
              />
            </div>

            {/* Conteúdo com padding interno */}
            <div className="p-5 sm:p-6 flex flex-col flex-1 space-y-3">
              {/* Metadados de Data e Tempo de Leitura */}
              <p className="text-[11px] font-mono text-[#CFB28C]/80">
                {article.date} <span className="text-[#3F2319]">|</span>{" "}
                {article.readTime}
              </p>

              {/* Título e Descrição */}
              <div className="space-y-1.5 flex-1">
                <h3 className="text-sm sm:text-base font-bold text-white group-hover:text-[#D28A4C] transition-colors leading-snug">
                  {article.title}
                </h3>
                <p className="text-xs text-[#CFB28C]/70 leading-relaxed line-clamp-2">
                  {article.description}
                </p>
              </div>

              {/* Ligação Ler mais */}
              <div className="pt-1">
                <Link
                  to="/not-found"
                  className="inline-flex items-center gap-1.5 text-xs text-[#D28A4C] hover:text-[#c47b3e] font-semibold transition-colors cursor-pointer"
                >
                  <span>Ler mais</span>
                  <ArrowRight className="size-3 stroke-[2.5]" />
                </Link>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
