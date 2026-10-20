import { describe, expect, it } from "vitest";

import { queryKeys } from "../keys";

describe("Query Keys Factory (src/lib/query/keys.ts)", () => {
  it("deve padronizar a chave de sessão em ['session']", () => {
    expect(queryKeys.session()).toEqual(["session"]);
  });

  it("deve prefixar todas as chaves públicas com ['public', ...]", () => {
    expect(queryKeys.public.all).toEqual(["public"]);
    expect(queryKeys.public.catalog.all()).toEqual(["public", "catalog"]);
    expect(queryKeys.public.catalog.lists()).toEqual(["public", "catalog", "lists"]);
    expect(queryKeys.public.catalog.list({ page: 1 })).toEqual([
      "public",
      "catalog",
      "lists",
      { page: 1 },
    ]);
    expect(queryKeys.public.catalog.details()).toEqual(["public", "catalog", "details"]);
    expect(queryKeys.public.catalog.detail("nft-1")).toEqual([
      "public",
      "catalog",
      "details",
      "nft-1",
    ]);
    expect(queryKeys.public.catalog.facets()).toEqual(["public", "catalog", "facets"]);
    expect(queryKeys.public.health()).toEqual(["public", "health"]);
  });

  describe("REGRA ELIMINATÓRIA: Isolamento de Dados Privados por userId", () => {
    const testUserId = "usr_crypto_collector_42";

    it("todas as chaves privadas de usuário DEVEM obrigatoriamente iniciar com ['user', userId, ...]", () => {
      const userKeys = queryKeys.user(testUserId);

      const privateKeysList: readonly (readonly unknown[])[] = [
        userKeys.all(),
        userKeys.profile(),
        userKeys.wallets.all(),
        userKeys.wallets.list(),
        userKeys.wallets.detail("wallet-eth-primary"),
        userKeys.orders.all(),
        userKeys.orders.lists(),
        userKeys.orders.list({ status: "settled" }),
        userKeys.orders.detail("order-abc-123"),
        userKeys.cart(),
        userKeys.favorites(),
        userKeys.activities(),
      ];

      for (const key of privateKeysList) {
        expect(key[0]).toBe("user");
        expect(key[1]).toBe(testUserId);
      }
    });

    it("não deve permitir criar escopo privado de usuário com userId vazio ou inválido", () => {
      expect(() => queryKeys.user("")).toThrow(
        "A fábrica de chaves privadas exige um userId válido não-vazio.",
      );
      expect(() => queryKeys.user("   ")).toThrow();
      expect(() => queryKeys.user(null as unknown as string)).toThrow();
      expect(() => queryKeys.user(undefined as unknown as string)).toThrow();
    });
  });
});
