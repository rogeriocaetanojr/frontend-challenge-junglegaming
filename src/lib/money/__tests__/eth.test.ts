import { describe, expect, it } from "vitest";

import type { EthString } from "@/contracts/common";
import {
  addEth,
  compareEth,
  formatWeiToEth,
  mulEthByInt,
  parseEthToWei,
  percentEth,
  subEth,
  WEI_PER_ETH,
} from "@/lib/money/eth";

describe("src/lib/money/eth.ts", () => {
  it("deve definir WEI_PER_ETH como 10^18", () => {
    expect(WEI_PER_ETH).toBe(1_000_000_000_000_000_000n);
  });

  describe("parseEthToWei", () => {
    it("deve converter valores inteiros e decimais com precisão absoluta", () => {
      expect(parseEthToWei("0")).toBe(0n);
      expect(parseEthToWei("1")).toBe(1_000_000_000_000_000_000n);
      expect(parseEthToWei("1.5")).toBe(1_500_000_000_000_000_000n);
      expect(parseEthToWei("0.000000000000000001")).toBe(1n);
      expect(parseEthToWei("12.123456789012345678")).toBe(12_123_456_789_012_345_678n);
    });

    it("deve lançar RangeError se o valor tiver mais de 18 casas decimais", () => {
      expect(() => parseEthToWei("0.0000000000000000001")).toThrow(RangeError);
    });

    it("deve lançar TypeError se o valor não for uma string decimal válida", () => {
      expect(() => parseEthToWei("")).toThrow(TypeError);
      expect(() => parseEthToWei("-1")).toThrow(TypeError);
      expect(() => parseEthToWei("abc")).toThrow(TypeError);
    });
  });

  describe("formatWeiToEth", () => {
    it("deve formatar Wei em string decimal sem zeros excedentes à direita", () => {
      expect(formatWeiToEth(0n)).toBe("0");
      expect(formatWeiToEth(1_000_000_000_000_000_000n)).toBe("1");
      expect(formatWeiToEth(1_500_000_000_000_000_000n)).toBe("1.5");
      expect(formatWeiToEth(1n)).toBe("0.000000000000000001");
      expect(formatWeiToEth(12_123_456_789_012_345_678n)).toBe("12.123456789012345678");
    });

    it("deve truncar casas decimais conforme maxDecimals", () => {
      const wei = parseEthToWei("1.234567");
      expect(formatWeiToEth(wei, 2)).toBe("1.23");
      expect(formatWeiToEth(wei, 4)).toBe("1.2345");
      expect(formatWeiToEth(wei, 0)).toBe("1");
    });

    it("deve lançar RangeError se wei for negativo ou maxDecimals for inválido", () => {
      expect(() => formatWeiToEth(-1n)).toThrow(RangeError);
      expect(() => formatWeiToEth(100n, -1)).toThrow(RangeError);
      expect(() => formatWeiToEth(100n, 19)).toThrow(RangeError);
    });
  });

  describe("addEth", () => {
    it("deve somar valores decimais sem os erros clássicos de ponto flutuante (0.1 + 0.2 = 0.3)", () => {
      const a = "0.1" as EthString;
      const b = "0.2" as EthString;
      expect(addEth(a, b)).toBe("0.3");
    });

    it("deve somar valores inteiros e fracionários", () => {
      expect(addEth("1.19" as EthString, "2.29" as EthString)).toBe("3.48");
      expect(addEth("0" as EthString, "5.5" as EthString)).toBe("5.5");
    });
  });

  describe("subEth", () => {
    it("deve subtrair valores decimais com exatidão", () => {
      expect(subEth("0.3" as EthString, "0.1" as EthString)).toBe("0.2");
      expect(subEth("5" as EthString, "5" as EthString)).toBe("0");
    });

    it("deve lançar RangeError quando o minuendo for menor que o subtraendo", () => {
      expect(() => subEth("1" as EthString, "2" as EthString)).toThrow(RangeError);
      expect(() => subEth("0.1" as EthString, "0.2" as EthString)).toThrow(RangeError);
    });
  });

  describe("mulEthByInt", () => {
    it("deve multiplicar valor em ETH por um inteiro não negativo", () => {
      expect(mulEthByInt("1.19" as EthString, 3)).toBe("3.57");
      expect(mulEthByInt("1.19" as EthString, 3n)).toBe("3.57");
      expect(mulEthByInt("10.5" as EthString, 0)).toBe("0");
    });

    it("deve lançar RangeError para multiplicadores negativos ou não inteiros", () => {
      expect(() => mulEthByInt("1" as EthString, -1)).toThrow(RangeError);
      expect(() => mulEthByInt("1" as EthString, -1n)).toThrow(RangeError);
      expect(() => mulEthByInt("1" as EthString, 2.5)).toThrow(RangeError);
    });
  });

  describe("percentEth", () => {
    it("deve calcular porcentagens em basis points com exatidão", () => {
      // 500 bps = 5% de 100 = 5
      expect(percentEth("100" as EthString, 500)).toBe("5");
      // 1000 bps = 10% de 1 = 0.1
      expect(percentEth("1" as EthString, 1000)).toBe("0.1");
      // 10000 bps = 100% de 2.5 = 2.5
      expect(percentEth("2.5" as EthString, 10_000n)).toBe("2.5");
      // 0 bps = 0%
      expect(percentEth("10" as EthString, 0)).toBe("0");
    });

    it("deve suportar arredondamento half-up e down", () => {
      // 1 wei * 1 bps = 1 / 10000.
      // half-up: (1 * 1 + 5000) / 10000 = 5001 / 10000 = 0
      const amount = "0.000000000000000001" as EthString;
      expect(percentEth(amount, 1, "half-up")).toBe("0");
      expect(percentEth(amount, 1, "down")).toBe("0");
    });

    it("deve lançar RangeError para bps negativo ou não inteiro", () => {
      expect(() => percentEth("10" as EthString, -100)).toThrow(RangeError);
      expect(() => percentEth("10" as EthString, 5.5)).toThrow(RangeError);
    });
  });

  describe("compareEth", () => {
    it("deve comparar corretamente dois valores de ETH", () => {
      expect(compareEth("1" as EthString, "2" as EthString)).toBe(-1);
      expect(compareEth("2" as EthString, "1" as EthString)).toBe(1);
      expect(compareEth("1.5" as EthString, "1.5" as EthString)).toBe(0);
      expect(compareEth("0.1" as EthString, "0.100000000000000001" as EthString)).toBe(
        -1,
      );
    });
  });
});
