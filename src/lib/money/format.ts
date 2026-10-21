import BigNumber from "bignumber.js";

/**
 * Formata uma string decimal de ETH com casas fixas, sem conversão para float.
 * Ex.: formatEthFixed("1.19", 2) => "1.19"; formatEthFixed("0.002", 3) => "0.002".
 * Entradas ausentes ou inválidas resultam em zero.
 */
export function formatEthFixed(value: string | null | undefined, decimals = 2): string {
  let parsed: BigNumber;
  try {
    parsed = new BigNumber(value ?? "0");
  } catch {
    parsed = new BigNumber(0);
  }
  return (parsed.isFinite() ? parsed : new BigNumber(0)).toFixed(
    decimals,
    BigNumber.ROUND_HALF_UP,
  );
}
