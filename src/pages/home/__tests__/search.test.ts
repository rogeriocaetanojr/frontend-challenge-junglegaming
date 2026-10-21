import { describe, expect, it } from "vitest";

import { getVisiblePages } from "../pagination";
import { compactHomeSearch, homeSearchSchema, toNftFilters } from "../search";

describe("homeSearchSchema", () => {
  it("deve aceitar busca, filtros, ordenação e página válidos", () => {
    const parsed = homeSearchSchema.parse({
      q: "ape",
      category: "art",
      network: "polygon",
      minPrice: 0.5,
      maxPrice: "2.5",
      sort: "price-asc",
      tab: "popular",
      page: "3",
    });

    expect(parsed).toEqual({
      q: "ape",
      category: "art",
      network: "polygon",
      minPrice: 0.5,
      maxPrice: 2.5,
      sort: "price-asc",
      tab: "popular",
      page: 3,
    });
  });

  it("deve normalizar termos numéricos vindos do parser de URL para string", () => {
    expect(homeSearchSchema.parse({ q: 123 }).q).toBe("123");
  });

  it("deve descartar valores inválidos em vez de falhar", () => {
    const parsed = homeSearchSchema.parse({
      q: "   ",
      category: "inexistente",
      network: "bitcoin",
      minPrice: -1,
      maxPrice: "abc",
      sort: "aleatorio",
      tab: "x",
      page: 0,
    });

    expect(parsed).toEqual({
      q: undefined,
      category: undefined,
      network: undefined,
      minPrice: undefined,
      maxPrice: undefined,
      sort: undefined,
      tab: undefined,
      page: undefined,
    });
  });
});

describe("compactHomeSearch", () => {
  it("deve remover da URL os valores padrão", () => {
    expect(compactHomeSearch({ q: "ape", page: 1, sort: "recent", tab: "all" })).toEqual({
      q: "ape",
      page: undefined,
      sort: undefined,
      tab: undefined,
    });
  });

  it("deve preservar valores diferentes do padrão", () => {
    expect(compactHomeSearch({ page: 2, sort: "popular", tab: "recent" })).toMatchObject({
      page: 2,
      sort: "popular",
      tab: "recent",
    });
  });
});

describe("toNftFilters", () => {
  it("deve mapear a URL para os filtros da API usando ordenação recente por padrão", () => {
    expect(toNftFilters({ q: "ape", category: "art" })).toEqual({
      search: "ape",
      category: "art",
      network: undefined,
      minPrice: undefined,
      maxPrice: undefined,
      sortBy: "recent",
    });
  });
});

describe("getVisiblePages", () => {
  it("deve exibir apenas as páginas existentes quando o total for pequeno", () => {
    expect(getVisiblePages(1, 2)).toEqual([1, 2]);
    expect(getVisiblePages(1, 1)).toEqual([1]);
  });

  it("deve deslizar a janela de 4 páginas acompanhando a página atual", () => {
    expect(getVisiblePages(1, 10)).toEqual([1, 2, 3, 4]);
    expect(getVisiblePages(5, 10)).toEqual([4, 5, 6, 7]);
    expect(getVisiblePages(10, 10)).toEqual([7, 8, 9, 10]);
  });
});
