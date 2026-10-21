import type { NftCategory } from "@/types/nft";

export interface CollectionItem {
  id: NftCategory;
  name: string;
  count: number;
}

/** Coleções do catálogo, compartilhadas entre a sidebar e as pílulas mobile. */
export const COLLECTIONS: CollectionItem[] = [
  { id: "art", name: "Arte digital", count: 33 },
  { id: "photography", name: "Fotografia", count: 12 },
  { id: "music", name: "Música", count: 55 },
  { id: "3d-art", name: "Arte 3D", count: 39 },
  { id: "collectibles", name: "Colecionáveis", count: 23 },
  { id: "generative", name: "Generativo", count: 17 },
  { id: "gaming", name: "Jogos", count: 15 },
  { id: "memberships", name: "Assinaturas", count: 10 },
  { id: "utility", name: "Utilidade", count: 16 },
];
