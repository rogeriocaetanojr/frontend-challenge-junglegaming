import { Link } from "@tanstack/react-router";
import { ChevronLeft } from "lucide-react";

interface MobilePageHeaderProps {
  /** Rota de retorno do botão voltar. */
  backTo: "/" | "/cart";
  title?: string;
  /** Ação opcional exibida à direita (ex.: favoritar). */
  action?: React.ReactNode;
}

/** Cabeçalho dos frames mobile do Figma: voltar à esquerda e título centralizado. */
export function MobilePageHeader({ backTo, title, action }: MobilePageHeaderProps) {
  return (
    <div className="md:hidden grid grid-cols-[36px_1fr_36px] items-center gap-2 font-mono">
      <Link
        to={backTo}
        aria-label="Voltar"
        className="size-9 rounded-full bg-[#2A1A13] border border-[#3F2319] flex items-center justify-center text-[#F5F1EB] hover:text-[#D28A4C] transition-colors"
      >
        <ChevronLeft className="size-4" />
      </Link>
      {title ? (
        <h1 className="text-center text-base font-bold text-[#F5F1EB] tracking-wide">
          {title}
        </h1>
      ) : (
        <span />
      )}
      {action ?? <span />}
    </div>
  );
}
