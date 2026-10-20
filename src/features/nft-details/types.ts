/**
 * Contratos e Tipagens da Feature de Detalhes do NFT (NftDetails).
 */
import type { Edition, Network, Nft, NftRarity } from "@/contracts/catalog";
import type { EthString, Id, IsoDate } from "@/contracts/common";

export type { Edition, Network, Nft, NftRarity };

/**
 * Atributo / propriedade do NFT (ex: Background, Eyes, Level, etc.).
 */
export interface NftAttribute {
  traitType: string;
  value: string | number;
  displayType?: "number" | "boost_percentage" | "boost_number" | "date" | "string";
  rarityPercentage?: number;
}

/**
 * Perfil do criador ou proprietário de um NFT.
 */
export interface NftUserRef {
  id: string;
  name: string;
  address?: string;
  avatarUrl?: string;
  verified?: boolean;
}

/**
 * Lance (bid) registrado em um NFT.
 */
export interface NftBid {
  id: string;
  bidder: NftUserRef;
  amount: EthString;
  createdAt: IsoDate;
}

/**
 * Evento do histórico de atividades de um NFT (mint, transfer, sale, list, etc.).
 */
export interface NftActivityHistory {
  id: string;
  event: "mint" | "transfer" | "sale" | "list" | "bid";
  from?: NftUserRef;
  to?: NftUserRef;
  price?: EthString;
  txHash?: string;
  timestamp: IsoDate;
}

/**
 * Entidade completa e detalhada de um NFT com metadados estendidos.
 */
export interface NftDetail extends Nft {
  creator?: NftUserRef;
  owner?: NftUserRef;
  contractAddress?: string;
  tokenId?: string;
  tokenStandard?: "ERC-721" | "ERC-1155" | "SPL";
  attributes?: NftAttribute[];
  bids?: NftBid[];
  history?: NftActivityHistory[];
  likesCount?: number;
  viewsCount?: number;
}

export type NftDetailId = Id<"nft"> | string;
