export type NftCategory =
  | "art"
  | "photography"
  | "music"
  | "3d-art"
  | "collectibles"
  | "generative"
  | "gaming"
  | "memberships"
  | "utility"
  | "virtual-worlds";

export type NftNetwork = "ethereum" | "polygon" | "solana";

export interface NftCreator {
  name: string;
  address: string;
  avatar: string;
}

export interface NftCollection {
  name: string;
  slug: string;
}

export interface NftAttribute {
  trait_type: string;
  value: string;
}

/**
 * Entidade de domínio representando um item colecionável digital (NFT).
 */
export interface NftItem {
  id: string;
  name: string;
  description: string;
  priceEth: number;
  originalPriceEth?: number;
  image: string;
  creator: NftCreator;
  collection: NftCollection;
  category: NftCategory;
  network?: NftNetwork;
  attributes: NftAttribute[];
  likes: number;
  verified: boolean;
  createdAt?: string;
}

/**
 * Critérios de busca, categorização, faixa de preço, rede e ordenação para listagens de NFTs.
 */
export interface NftFilters {
  search?: string;
  category?: string;
  network?: NftNetwork;
  minPrice?: number;
  maxPrice?: number;
  sortBy?: "price-asc" | "price-desc" | "recent" | "popular";
}

/**
 * Envelope padronizado para respostas paginadas da API.
 */
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
