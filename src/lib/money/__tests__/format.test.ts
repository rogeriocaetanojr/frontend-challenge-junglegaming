import { describe, expect, it } from "vitest";

import { sumEth } from "@/features/cart/api";
import { asEthString } from "@/lib/money";
import { formatEthFixed } from "../format";

describe("formatEthFixed", () => {
  it("deve formatar strings decimais sem erro de ponto flutuante", () => {
    expect(formatEthFixed("0.1", 2)).toBe("0.10");
    expect(formatEthFixed("1.005", 2)).toBe("1.01");
    expect(formatEthFixed("0.002", 3)).toBe("0.002");
  });

  it("deve tratar valores ausentes ou inválidos como zero", () => {
    expect(formatEthFixed(undefined, 2)).toBe("0.00");
    expect(formatEthFixed("abc", 3)).toBe("0.000");
  });
});

describe("sumEth", () => {
  it("deve somar valores em ETH com precisão exata", () => {
    expect(sumEth([asEthString("0.1"), asEthString("0.2")])).toBe("0.3");
  });
});
