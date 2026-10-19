import BigNumber from "bignumber.js";

/**
 * Formata valores numéricos em ETH com precisão configurável e sem zeros desnecessários à direita.
 * Ex: 1.25 -> "1.25 ETH", 0.005 -> "0.005 ETH"
 */
export function formatEth(value?: string | number | null, decimals = 4): string {
  if (value === undefined || value === null || value === "") {
    return "0 ETH";
  }

  try {
    const bn = new BigNumber(value);
    if (bn.isNaN()) return "0 ETH";

    const formatted = bn.decimalPlaces(decimals, BigNumber.ROUND_DOWN).toString(10);
    return `${formatted} ETH`;
  } catch {
    return "0 ETH";
  }
}

/**
 * Converte e formata um valor numérico para o padrão monetário americano (USD).
 * Ex: 1250 -> "$1,250.00"
 */
export function formatUsd(value?: string | number | null): string {
  if (value === undefined || value === null || value === "") {
    return "$0.00";
  }

  try {
    const bn = new BigNumber(value);
    if (bn.isNaN()) return "$0.00";

    return `$${bn.toFormat(2, BigNumber.ROUND_HALF_UP)}`;
  } catch {
    return "$0.00";
  }
}

/**
 * Trunca um endereço público Ethereum mantendo prefixo e sufixo legíveis.
 * Ex: "0x1234567890abcdef1234567890abcdef12345678" -> "0x1234...5678"
 */
export function truncateAddress(address: string, start = 6, end = 4): string {
  if (!address) return "";
  if (address.length <= start + end) return address;

  return `${address.slice(0, start)}...${address.slice(-end)}`;
}

/**
 * Calcula a soma dos preços de uma lista de itens usando estritamente BigNumber,
 * garantindo imunidade a erros de ponto flutuante (IEEE 754).
 * Ex: [{ price: 0.1 }, { price: 0.2 }] -> "0.3"
 */
export function calculateTotalEth(
  items: Array<{ price?: string | number | null }>,
): string {
  const total = items.reduce((acc, item) => {
    if (item.price === undefined || item.price === null || item.price === "") {
      return acc;
    }
    try {
      const itemPrice = new BigNumber(item.price);
      return acc.plus(itemPrice.isNaN() ? 0 : itemPrice);
    } catch {
      return acc;
    }
  }, new BigNumber(0));

  return total.toString(10);
}
