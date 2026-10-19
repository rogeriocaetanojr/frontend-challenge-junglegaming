/**
 * Testes unitários para utilitários de formatação de strings e moedas.
 */
import { describe, expect, it } from "vitest";

import {
  calculateTotalEth,
  formatEth,
  formatUsd,
  truncateAddress,
} from "@/lib/formatters";

describe("Formatters (src/lib/formatters.ts)", () => {
  describe("formatEth", () => {
    it("deve formatar valores numéricos e textuais de ETH corretamente", () => {
      expect(formatEth(1.25)).toBe("1.25 ETH");
      expect(formatEth("0.45")).toBe("0.45 ETH");
      expect(formatEth(0)).toBe("0 ETH");
      expect(formatEth("0")).toBe("0 ETH");
    });

    it("deve tratar valores undefined, null ou vazios sem disparar exceção", () => {
      expect(formatEth(undefined)).toBe("0 ETH");
      expect(formatEth(null)).toBe("0 ETH");
      expect(formatEth("")).toBe("0 ETH");
    });

    it("deve tratar strings não numéricas retornando 0 ETH", () => {
      expect(formatEth("invalido")).toBe("0 ETH");
    });
  });

  describe("formatUsd", () => {
    it("deve formatar valores monetários em dólar corretamente", () => {
      expect(formatUsd(1250)).toBe("$1,250.00");
      expect(formatUsd("49.9")).toBe("$49.90");
    });

    it("deve tratar valores undefined, null ou vazios retornando $0.00", () => {
      expect(formatUsd(undefined)).toBe("$0.00");
      expect(formatUsd(null)).toBe("$0.00");
      expect(formatUsd("")).toBe("$0.00");
      expect(formatUsd("abc")).toBe("$0.00");
    });
  });

  describe("truncateAddress", () => {
    it("deve truncar endereços longos de carteira", () => {
      expect(truncateAddress("0x71C8364437a9C27779976872A42F340a6B233921")).toBe(
        "0x71C8...3921",
      );
    });

    it("deve retornar string vazia para entrada vazia", () => {
      expect(truncateAddress("")).toBe("");
    });
  });

  describe("calculateTotalEth", () => {
    it("deve somar valores numéricos e strings ignorando undefined", () => {
      const items = [{ price: "1.19" }, { price: 0.81 }, { price: undefined }];
      expect(calculateTotalEth(items)).toBe("2");
    });
  });
});
