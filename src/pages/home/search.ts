/**
 * Contrato dos search params da página inicial (/), validado com Zod.
 *
 * A URL é a fonte única de verdade do catálogo: busca (q), filtros (category,
 * network, minPrice, maxPrice), aba (tab), ordenação (sort) e página (page).
 * Valores inválidos ou fora do domínio são descartados em vez de quebrar a rota.
 */
import { z } from "zod";

import type { NftCategory, NftFilters, NftNetwork } from "@/types/nft";

export const HOME_CATEGORIES = [
  "art",
  "photography",
  "music",
  "3d-art",
  "collectibles",
  "generative",
  "gaming",
  "memberships",
  "utility",
  "virtual-worlds",
] as const satisfies readonly NftCategory[];

export const HOME_NETWORKS = [
  "ethereum",
  "polygon",
  "solana",
] as const satisfies readonly NftNetwork[];

export const HOME_SORT_OPTIONS = [
  "recent",
  "popular",
  "price-asc",
  "price-desc",
] as const satisfies readonly NonNullable<NftFilters["sortBy"]>[];

export const HOME_TABS = ["all", "recent", "popular"] as const;

export type HomeSort = (typeof HOME_SORT_OPTIONS)[number];
export type HomeTab = (typeof HOME_TABS)[number];

/** Quantidade de NFTs por página no catálogo da home. */
export const HOME_PAGE_SIZE = 9;

export const DEFAULT_SORT: HomeSort = "recent";
export const DEFAULT_TAB: HomeTab = "all";

/** O parser de URL converte "123" em número; normalizamos de volta para string. */
const searchTerm = z
  .union([z.string(), z.number()])
  .transform((value) => String(value).trim())
  .pipe(z.string().min(1).max(100));

const price = z.coerce.number().finite().min(0);

export const homeSearchSchema = z.object({
  q: searchTerm.optional().catch(undefined),
  category: z.enum(HOME_CATEGORIES).optional().catch(undefined),
  network: z.enum(HOME_NETWORKS).optional().catch(undefined),
  minPrice: price.optional().catch(undefined),
  maxPrice: price.optional().catch(undefined),
  tab: z.enum(HOME_TABS).optional().catch(undefined),
  sort: z.enum(HOME_SORT_OPTIONS).optional().catch(undefined),
  page: z.coerce.number().int().min(1).optional().catch(undefined),
});

export type HomeSearch = z.output<typeof homeSearchSchema>;

/**
 * Remove da URL os valores iguais ao padrão (página 1, ordenação recente, aba "all"),
 * mantendo endereços curtos e canônicos.
 */
export function compactHomeSearch(search: HomeSearch): HomeSearch {
  return {
    ...search,
    tab: search.tab === DEFAULT_TAB ? undefined : search.tab,
    sort: search.sort === DEFAULT_SORT ? undefined : search.sort,
    page: search.page === 1 ? undefined : search.page,
  };
}

/** Converte os search params da URL nos filtros enviados à API de NFTs. */
export function toNftFilters(search: HomeSearch): NftFilters {
  return {
    search: search.q,
    category: search.category,
    network: search.network,
    minPrice: search.minPrice,
    maxPrice: search.maxPrice,
    sortBy: search.sort ?? DEFAULT_SORT,
  };
}
