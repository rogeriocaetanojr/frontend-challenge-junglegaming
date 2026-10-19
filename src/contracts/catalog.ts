/**
 * Contratos de domínio do catálogo de NFTs.
 *
 * Representam o formato trafegado pela API de catálogo. Valores monetários
 * usam `EthString` (nunca `number`) para preservar a precisão decimal.
 */
import type { EthString, Id, IsoDate, Page } from "@/contracts/common";

/** Redes blockchain suportadas pelo marketplace. */
export type Network = "ethereum" | "polygon" | "solana" | "arbitrum" | "optimism";

/** Níveis de raridade de um NFT. */
export type NftRarity = "common" | "rare" | "epic" | "legendary";

/** Edição (tiragem) de um NFT com estoque e preço próprios. */
export interface Edition {
  id: Id<"edition">;
  label: string;
  total: number;
  available: number;
  price: EthString;
}

/** Entidade de domínio de um NFT do catálogo. */
export interface Nft {
  id: Id<"nft">;
  title: string;
  description: string;
  images: Array<{ url: string; alt: string }>;
  collection: { id: string; name: string };
  category: string;
  rarity: NftRarity;
  price: EthString;
  editions: Edition[];
  featured: boolean;
  network: Network;
  /** Versão monotônica para controle de concorrência e reconciliação via WebSocket. */
  version: number;
  updatedAt: IsoDate;
}

/** Opções de ordenação aceitas pela listagem do catálogo. */
export type NftSortOption = "recent" | "price_asc" | "price_desc" | "popular";

/** Parâmetros de consulta da listagem do catálogo. */
export interface NftListParams {
  q?: string;
  category?: string[];
  collection?: string[];
  rarity?: NftRarity[];
  network?: Network[];
  availability?: "all" | "available" | "sold_out";
  priceMin?: EthString;
  priceMax?: EthString;
  sort?: NftSortOption;
  page?: number;
  pageSize?: number;
}

/** Item de faceta (filtro agregado) com contagem de resultados. */
export interface NftFacetItem {
  value: string;
  label: string;
  count: number;
}

/** Conjunto de facetas retornado junto à listagem. */
export interface NftFacets {
  collections: NftFacetItem[];
  categories: NftFacetItem[];
  networks: NftFacetItem[];
  rarities: NftFacetItem[];
}

/** Resposta paginada da listagem do catálogo com facetas agregadas. */
export interface NftListResponse extends Page<Nft> {
  facets: NftFacets;
}
