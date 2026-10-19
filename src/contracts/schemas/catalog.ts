/**
 * Schemas Zod para contratos do catálogo de NFTs.
 */
import { z } from "zod";

import type {
  Edition,
  Network,
  Nft,
  NftFacetItem,
  NftFacets,
  NftListParams,
  NftListResponse,
  NftRarity,
  NftSortOption,
} from "@/contracts/catalog";
import {
  createIdSchema,
  ethStringSchema,
  isoDateSchema,
} from "@/contracts/schemas/common";

/** Schema para redes blockchain suportadas. */
export const networkSchema = z.enum([
  "ethereum",
  "polygon",
  "solana",
  "arbitrum",
  "optimism",
]) satisfies z.ZodType<Network>;

/** Schema para níveis de raridade. */
export const nftRaritySchema = z.enum([
  "common",
  "rare",
  "epic",
  "legendary",
]) satisfies z.ZodType<NftRarity>;

/** Schema para edições de NFT. */
export const editionSchema = z.object({
  id: createIdSchema<"edition">(),
  label: z.string(),
  total: z.number().int().nonnegative(),
  available: z.number().int().nonnegative(),
  price: ethStringSchema,
}) satisfies z.ZodType<Edition>;

/** Schema para entidade NFT. */
export const nftSchema = z.object({
  id: createIdSchema<"nft">(),
  title: z.string(),
  description: z.string(),
  images: z.array(
    z.object({
      url: z.string(),
      alt: z.string(),
    }),
  ),
  collection: z.object({
    id: z.string(),
    name: z.string(),
  }),
  category: z.string(),
  rarity: nftRaritySchema,
  price: ethStringSchema,
  editions: z.array(editionSchema),
  featured: z.boolean(),
  network: networkSchema,
  version: z.number().int().nonnegative(),
  updatedAt: isoDateSchema,
}) satisfies z.ZodType<Nft>;

/** Schema para opções de ordenação do catálogo. */
export const nftSortOptionSchema = z.enum([
  "recent",
  "price_asc",
  "price_desc",
  "popular",
]) satisfies z.ZodType<NftSortOption>;

/** Schema para parâmetros de listagem do catálogo. */
export const nftListParamsSchema = z.object({
  q: z.string().optional(),
  category: z.array(z.string()).optional(),
  collection: z.array(z.string()).optional(),
  rarity: z.array(nftRaritySchema).optional(),
  network: z.array(networkSchema).optional(),
  availability: z.enum(["all", "available", "sold_out"]).optional(),
  priceMin: ethStringSchema.optional(),
  priceMax: ethStringSchema.optional(),
  sort: nftSortOptionSchema.optional(),
  page: z.number().int().positive().optional(),
  pageSize: z.number().int().positive().optional(),
}) satisfies z.ZodType<NftListParams>;

/** Schema para item de faceta. */
export const nftFacetItemSchema = z.object({
  value: z.string(),
  label: z.string(),
  count: z.number().int().nonnegative(),
}) satisfies z.ZodType<NftFacetItem>;

/** Schema para facetas do catálogo. */
export const nftFacetsSchema = z.object({
  collections: z.array(nftFacetItemSchema),
  categories: z.array(nftFacetItemSchema),
  networks: z.array(nftFacetItemSchema),
  rarities: z.array(nftFacetItemSchema),
}) satisfies z.ZodType<NftFacets>;

/** Schema para resposta da listagem de NFTs com facetas. */
export const nftListResponseSchema = z.object({
  items: z.array(nftSchema),
  total: z.number().int().nonnegative(),
  page: z.number().int().positive(),
  pageSize: z.number().int().positive(),
  totalPages: z.number().int().nonnegative(),
  facets: nftFacetsSchema,
}) satisfies z.ZodType<NftListResponse>;
