/**
 * Aritmética e conversão decimal estrita para ETH baseada em bigint (Wei).
 *
 * PROIBIDO o uso de Number() ou parseFloat() em montantes de ETH para
 * evitar erros de precisão de ponto flutuante IEEE 754.
 *
 * 1 ETH = 10^18 Wei (1_000_000_000_000_000_000n).
 */
import { asEthString, type EthString } from "@/contracts/common";

/** Constante de conversão: 10^18 Wei por 1 ETH. */
export const WEI_PER_ETH = 10n ** 18n;

/** Limite máximo de casas decimais em ETH. */
const MAX_DECIMALS = 18;

/**
 * Converte uma representação textual de ETH (`EthString`) para a menor unidade (Wei).
 * Utiliza manipulação pura de strings sem conversão intermediária para float.
 *
 * @param amount String decimal de ETH (ex.: "1.5", "0.000000000000000001", "12")
 * @returns Quantidade equivalente em Wei (bigint)
 * @throws {TypeError} Se amount não for uma string decimal válida
 * @throws {RangeError} Se o número de casas decimais for superior a 18
 */
export function parseEthToWei(amount: EthString | string): bigint {
  const validated = asEthString(amount);
  const [intPart = "0", fracPart = ""] = validated.split(".");

  if (fracPart.length > MAX_DECIMALS) {
    throw new RangeError(
      `Valor excede o limite máximo de ${MAX_DECIMALS} casas decimais em ETH: "${amount}"`,
    );
  }

  const integerWei = BigInt(intPart) * WEI_PER_ETH;
  const fractionWei = BigInt(fracPart.padEnd(MAX_DECIMALS, "0"));

  return integerWei + fractionWei;
}

/**
 * Converte um valor em Wei (bigint) de volta para o formato decimal `EthString`.
 * Remove zeros excedentes à direita e ponto decimal desnecessário.
 *
 * @param wei Quantidade em Wei (deve ser >= 0n)
 * @param maxDecimals Número máximo de casas decimais a manter (0 a 18, padrão: 18)
 * @returns String decimal tipada como `EthString`
 * @throws {RangeError} Se wei for negativo ou se maxDecimals estiver fora de [0, 18]
 */
export function formatWeiToEth(wei: bigint, maxDecimals = MAX_DECIMALS): EthString {
  if (wei < 0n) {
    throw new RangeError(`Valor em Wei não pode ser negativo: ${wei.toString()}`);
  }

  if (maxDecimals < 0 || maxDecimals > MAX_DECIMALS) {
    throw new RangeError(
      `maxDecimals deve estar entre 0 e ${MAX_DECIMALS}, recebido: ${maxDecimals}`,
    );
  }

  const integerPart = wei / WEI_PER_ETH;
  const remainder = wei % WEI_PER_ETH;

  if (remainder === 0n || maxDecimals === 0) {
    return asEthString(integerPart.toString());
  }

  let fracString = remainder.toString().padStart(MAX_DECIMALS, "0");

  if (maxDecimals < MAX_DECIMALS) {
    fracString = fracString.slice(0, maxDecimals);
  }

  fracString = fracString.replace(/0+$/, "");

  if (fracString.length === 0) {
    return asEthString(integerPart.toString());
  }

  return asEthString(`${integerPart.toString()}.${fracString}`);
}

/**
 * Soma com precisão absoluta dois valores de ETH.
 */
export function addEth(a: EthString, b: EthString): EthString {
  const weiSum = parseEthToWei(a) + parseEthToWei(b);
  return formatWeiToEth(weiSum);
}

/**
 * Subtrai `b` de `a` com precisão absoluta.
 *
 * @throws {RangeError} Se o resultado for negativo (saldos/preços ETH não podem ser negativos).
 */
export function subEth(a: EthString, b: EthString): EthString {
  const diff = parseEthToWei(a) - parseEthToWei(b);
  if (diff < 0n) {
    throw new RangeError(`Subtração de ETH resultaria em valor negativo (${a} - ${b})`);
  }
  return formatWeiToEth(diff);
}

/**
 * Multiplica um valor em ETH por um multiplicador inteiro sem perda de precisão.
 *
 * @param amount Valor base em ETH
 * @param multiplier Inteiro não negativo (quantidade de itens, etc.)
 */
export function mulEthByInt(amount: EthString, multiplier: number | bigint): EthString {
  if (typeof multiplier === "number") {
    if (!Number.isInteger(multiplier) || multiplier < 0) {
      throw new RangeError(
        `Multiplicador deve ser um número inteiro não negativo, recebido: ${multiplier}`,
      );
    }
  }

  const multBig = BigInt(multiplier);
  if (multBig < 0n) {
    throw new RangeError("Multiplicador não pode ser negativo");
  }

  const totalWei = parseEthToWei(amount) * multBig;
  return formatWeiToEth(totalWei);
}

/**
 * Calcula uma porcentagem sobre um valor em ETH usando Basis Points (bps).
 * 10_000 bps = 100% (ex.: 500 bps = 5%, 250 bps = 2.5%).
 *
 * @param amount Valor base em ETH
 * @param bps Pontos-base (inteiro não negativo)
 * @param rounding Modo de arredondamento: 'half-up' (padrão financeiro) ou 'down' (truncado)
 */
export function percentEth(
  amount: EthString,
  bps: number | bigint,
  rounding: "half-up" | "down" = "half-up",
): EthString {
  if (typeof bps === "number") {
    if (!Number.isInteger(bps) || bps < 0) {
      throw new RangeError(
        `Basis points (bps) deve ser um inteiro não negativo, recebido: ${bps}`,
      );
    }
  }

  const bpsBig = BigInt(bps);
  if (bpsBig < 0n) {
    throw new RangeError("Basis points (bps) não pode ser negativo");
  }

  const wei = parseEthToWei(amount);
  const product = wei * bpsBig;

  const resultWei =
    rounding === "half-up" ? (product + 5_000n) / 10_000n : product / 10_000n;

  return formatWeiToEth(resultWei);
}

/**
 * Compara dois valores de ETH com precisão absoluta.
 *
 * @returns -1 se a < b, 0 se a === b, 1 se a > b
 */
export function compareEth(a: EthString, b: EthString): -1 | 0 | 1 {
  const weiA = parseEthToWei(a);
  const weiB = parseEthToWei(b);

  if (weiA < weiB) {
    return -1;
  }
  if (weiA > weiB) {
    return 1;
  }
  return 0;
}

export { asEthString, isEthString } from "@/contracts/common";
