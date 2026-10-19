import { describe, expect, it } from "vitest";

import { asEthString, asId, isEthString } from "@/contracts/common";

describe("src/contracts/common.ts", () => {
  describe("isEthString", () => {
    it("deve aceitar strings numéricas decimais válidas em ETH", () => {
      const validCases = ["0", "1", "1.5", "12.000001", "0.0001", "100.25"];
      for (const val of validCases) {
        expect(isEthString(val)).toBe(true);
      }
    });

    it("deve rejeitar strings inválidas, negativas ou malformadas", () => {
      const invalidCases = [
        "",
        " ",
        "-1",
        "-0.5",
        "abc",
        "1e3",
        "1.",
        ".5",
        "01",
        "00.5",
        "1,5",
        null,
        undefined,
        123,
        {},
      ];
      for (const val of invalidCases) {
        expect(isEthString(val)).toBe(false);
      }
    });
  });

  describe("asEthString", () => {
    it("deve retornar o mesmo valor tipado quando for uma string válida", () => {
      expect(asEthString("1.5")).toBe("1.5");
      expect(asEthString("0")).toBe("0");
      expect(asEthString("12.000001")).toBe("12.000001");
    });

    it("deve lançar TypeError quando o valor for inválido", () => {
      expect(() => asEthString("")).toThrow(TypeError);
      expect(() => asEthString("-1")).toThrow(TypeError);
      expect(() => asEthString("abc")).toThrow(TypeError);
      expect(() => asEthString("1e3")).toThrow(TypeError);
    });
  });

  describe("asId", () => {
    it("deve retornar o identificador quando a string não for vazia", () => {
      expect(asId<"user">("user-123")).toBe("user-123");
      expect(asId<"nft">("nft-42")).toBe("nft-42");
    });

    it("deve lançar TypeError quando o identificador for vazio ou apenas espaços", () => {
      expect(() => asId<"user">("")).toThrow(TypeError);
      expect(() => asId<"user">("   ")).toThrow(TypeError);
    });
  });
});
