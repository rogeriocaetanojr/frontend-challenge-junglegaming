import { ArrowRight } from "lucide-react";

export function FeaturedBanners() {
  const handleScrollToCatalog = () => {
    const catalog = document.getElementById("catalog-section");
    if (catalog) {
      catalog.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <section className="py-6" aria-label="Lançamentos e coleções em destaque">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
        {/* Banner 1: Lançamentos gênesis de edição limitada */}
        <div className="border border-[#38220F] rounded-[24px] overflow-hidden flex flex-col sm:flex-row shadow-lg shadow-black/40 transition-all duration-300 hover:border-[#D28A4C]/30">
          <div className="w-full sm:w-[200px] lg:w-[230px] shrink-0 aspect-[4/3] sm:aspect-auto sm:self-stretch overflow-hidden bg-[#140D0A]">
            <img
              src="/images/nfts/emerald-ape.png"
              alt="Lançamentos Gênesis"
              className="size-full object-cover"
            />
          </div>

          <div className="bg-[#241612] p-6 sm:p-7 lg:p-8 flex-1 flex flex-col justify-between space-y-4 text-left min-w-0">
            <div className="space-y-2">
              <h3 className="text-base sm:text-lg lg:text-xl font-bold text-[#F5F1EB] tracking-tight leading-snug">
                Lançamentos gênesis <br className="hidden sm:inline" />
                de edição limitada
              </h3>
              <p className="text-xs sm:text-sm text-[#CFB28C]/80 leading-relaxed font-mono">
                Colecione edições exclusivas diretamente com criadores antes da revelação
                pública.
              </p>
            </div>
            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={handleScrollToCatalog}
                className="inline-flex items-center gap-2 bg-[#D28A4C] hover:bg-[#c47b3e] text-[#0E0907] font-bold text-xs sm:text-sm px-5 py-2.5 rounded-lg transition-colors cursor-pointer"
              >
                <span>Explorar</span>
                <ArrowRight className="size-3.5 stroke-[2.5]" />
              </button>
            </div>
          </div>
        </div>

        {/* Banner 2: Arte digital selecionada e muito mais */}
        <div className="border border-[#38220F] rounded-[24px] overflow-hidden flex flex-col sm:flex-row shadow-lg shadow-black/40 transition-all duration-300 hover:border-[#D28A4C]/30">
          <div className="w-full sm:w-[200px] lg:w-[230px] shrink-0 aspect-[4/3] sm:aspect-auto sm:self-stretch overflow-hidden bg-[#140D0A]">
            <img
              src="/images/nfts/noct-vessel.png"
              alt="Arte digital selecionada"
              className="size-full object-cover"
            />
          </div>

          <div className="bg-[#241612] p-6 sm:p-7 lg:p-8 flex-1 flex flex-col justify-between space-y-4 text-left min-w-0">
            <div className="space-y-2">
              <h3 className="text-base sm:text-lg lg:text-xl font-bold text-[#F5F1EB] tracking-tight leading-snug">
                Arte digital selecionada <br className="hidden sm:inline" />e muito mais
              </h3>
              <p className="text-xs sm:text-sm text-[#CFB28C]/80 leading-relaxed font-mono">
                Explore novos artistas, coleções verificadas e obras digitais que definem
                a cultura.
              </p>
            </div>
            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={handleScrollToCatalog}
                className="inline-flex items-center gap-2 bg-[#D28A4C] hover:bg-[#c47b3e] text-[#0E0907] font-bold text-xs sm:text-sm px-5 py-2.5 rounded-lg transition-colors cursor-pointer"
              >
                <span>Explorar</span>
                <ArrowRight className="size-3.5 stroke-[2.5]" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
