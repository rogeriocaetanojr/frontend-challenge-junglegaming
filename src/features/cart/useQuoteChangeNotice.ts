import { useState } from "react";

import { formatEthFixed } from "@/lib/money";

/**
 * Detecta mudanças no total da cotação enquanto a tela está aberta (ex.: `nft.updated`
 * via Socket.IO) e devolve um aviso acessível para o usuário.
 */
export function useQuoteChangeNotice(total: string | undefined) {
  const [baseline, setBaseline] = useState(total);
  const [notice, setNotice] = useState<string | null>(null);

  if (total !== undefined && total !== baseline) {
    setBaseline(total);
    if (baseline !== undefined) {
      setNotice(
        `Preço ou disponibilidade atualizados: o novo total é ${formatEthFixed(total, 3)} ETH.`,
      );
    }
  }

  return notice;
}
