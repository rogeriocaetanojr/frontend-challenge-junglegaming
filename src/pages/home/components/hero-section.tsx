import { ArrowRight } from "lucide-react";

import type { NftItem } from "@/types/nft";

interface HeroSectionProps {
  featuredNft?: NftItem;
}

export function HeroSection({ featuredNft }: HeroSectionProps) {
  const heroImage = featuredNft?.image || "/images/nfts/emerald-ape.webp";

  const handleScrollToCatalog = () => {
    const catalog = document.getElementById("catalog-section");
    if (catalog) {
      catalog.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <section
      className="pt-4 sm:pt-5 lg:pt-7 pb-8 sm:pb-10 lg:pb-[50px] max-md:pt-2! max-md:pb-0! relative"
      style={{ zoom: 1.12 }}
      aria-label="Apresentação Kurio"
    >
      {/* Mobile (Figma): card compacto com texto à esquerda, arte à direita e dots */}
      <div className="md:hidden relative overflow-hidden rounded-[22px] bg-[#241612] border border-[#3F2319] p-4 pb-7 flex items-center gap-3">
        <div className="flex-1 min-w-0 space-y-2 font-mono">
          <p className="text-[11px] text-white">Bem-vindo à Kurio</p>
          <h1 className="text-[17px] font-bold text-white uppercase leading-snug tracking-tight">
            Seja dono da cultura digital
          </h1>
          <p className="text-[11px] leading-relaxed text-[#CFB28C]">
            Descubra NFTs selecionados de criadores do mundo todo.
          </p>
          <button
            type="button"
            onClick={handleScrollToCatalog}
            className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-[#D28A4C] cursor-pointer"
          >
            Explorar <ArrowRight className="size-3.5" aria-hidden="true" />
          </button>
        </div>
        <div className="relative w-[124px] shrink-0">
          <img
            src={heroImage}
            alt={featuredNft?.name || "Emerald Ape KURIO"}
            className="aspect-square w-full rounded-[16px] object-cover"
          />
          <img
            src="/images/nfts/sage-nomad.webp"
            alt=""
            aria-hidden="true"
            className="absolute -bottom-2 -left-3 size-12 rounded-xl border-2 border-[#241612] object-cover"
          />
        </div>
        <div
          className="absolute bottom-2.5 left-1/2 -translate-x-1/2 flex gap-1.5"
          aria-hidden="true"
        >
          <span className="size-1.5 rounded-full bg-[#D28A4C]" />
          <span className="size-1.5 rounded-full bg-[#D28A4C]/60" />
          <span className="size-1.5 rounded-full bg-[#D28A4C]/60" />
        </div>
      </div>

      {/* Container com a grid e os 3 pontinhos posicionados acima da linha final da foto */}
      <div className="w-full relative max-md:hidden">
        <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          {/* Coluna da Esquerda (span 7): Subtítulo, Título, Descrição, Botão EXPLORAR subido sutilmente */}
          <div className="lg:col-span-7 space-y-6 text-left -translate-y-2 lg:-translate-y-4">
            <p className="font-mono text-sm sm:text-base font-normal text-white">
              Bem-vindo à Kurio
            </p>

            <h1 className="font-mono text-3xl sm:text-4xl lg:text-[50px] font-bold text-white uppercase leading-[1.20] tracking-tight">
              <span className="block">SEJA DONO DO FUTURO</span>
              <span className="block mt-1 sm:mt-1.5 lg:mt-2">DA ARTE DIGITAL</span>
            </h1>

            <p className="font-mono text-sm sm:text-[14.5px] lg:text-[15px] text-[#CFB28C] leading-relaxed max-w-[650px]">
              <span className="block">
                Descubra NFTs selecionados de criadores emergentes e consagrados.
              </span>
              <span className="block">
                Colecione arte digital rara, apoie artistas e tenha uma parte da
              </span>
              <span className="block">cultura da internet.</span>
            </p>

            <div className="pt-2">
              <button
                type="button"
                onClick={handleScrollToCatalog}
                className="bg-[#D28A4C] hover:bg-[#c47b3e] text-[#0E0907] font-mono font-bold text-[13.5px] sm:text-[14px] px-7 py-3 rounded-lg tracking-wider uppercase transition-colors shadow-sm shadow-[#D28A4C]/20 cursor-pointer"
              >
                EXPLORAR
              </button>
            </div>
          </div>

          {/* Coluna da Direita (span 5): Imagem estática com cantos arredondados generosos */}
          <div className="lg:col-span-5 flex justify-center lg:justify-end">
            <div className="w-[360px] h-[360px] sm:w-[440px] sm:h-[440px] lg:w-[470px] lg:h-[470px] aspect-square rounded-[32px] overflow-hidden shadow-2xl border border-[#2A2421] bg-[#140D0A]">
              <img
                src={heroImage}
                alt={featuredNft?.name || "Emerald Ape KURIO"}
                className="size-full object-cover select-none"
              />
            </div>
          </div>
        </div>

        {/* Indicador Central de 3 bolinhas (...) um pouco acima da linha final da imagem da hero */}
        <div
          className="absolute left-1/2 -translate-x-1/2 bottom-3 sm:bottom-4 lg:bottom-6 flex items-center justify-center gap-2.5 z-10"
          aria-hidden="true"
        >
          <span className="size-2 rounded-full bg-[#D28A4C]" />
          <span className="size-2 rounded-full bg-[#3F2B20] hover:bg-neutral-500 transition-colors cursor-pointer" />
          <span className="size-2 rounded-full bg-[#3F2B20] hover:bg-neutral-500 transition-colors cursor-pointer" />
        </div>
      </div>
    </section>
  );
}
