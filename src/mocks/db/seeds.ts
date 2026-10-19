/**
 * Sementes de dados iniciais para o banco de dados em memória do MSW.
 *
 * Fornece dados representativos fiéis aos contratos de domínio e ao design do Figma:
 * - 12 NFTs em várias categorias, coleções, raridades e redes.
 * - Preços estritamente formatados como `EthString`.
 * - Usuário de teste demo com carteiras primária e secundária.
 * - Cupons de desconto ativos e de teste.
 */
import type { Nft } from "@/contracts/catalog";
import type { Cart, Order, Quote } from "@/contracts/commerce";
import { asEthString, asId, type IsoDate } from "@/contracts/common";
import type { Wallet } from "@/contracts/identity";
import type { DbCoupon, DbUser } from "./schema";

const SEED_TIMESTAMP = "2026-10-19T00:00:00.000Z" as IsoDate;

/** Usuário padrão de demonstração. Senha conhecida para login: `Password123!` */
export const SEED_DEMO_USER: DbUser = {
  id: asId<"user">("user_demo"),
  name: "Alex Jungle",
  email: "demo@jungle.com",
  avatarUrl: "/images/nfts/emerald-ape.png",
  createdAt: "2026-01-01T00:00:00.000Z" as IsoDate,
  passwordHash: "Password123!",
};

export const SEED_USERS: DbUser[] = [SEED_DEMO_USER];

/** Carteiras vinculadas ao usuário demo. */
export const SEED_WALLETS: Wallet[] = [
  {
    id: asId<"wallet">("wallet_demo_eth"),
    userId: asId<"user">("user_demo"),
    role: "primary",
    network: "ethereum",
    address: "0x71C8364437a9C27779976872A42F340a6B233921",
    label: "Main Ethereum Wallet",
  },
  {
    id: asId<"wallet">("wallet_demo_poly"),
    userId: asId<"user">("user_demo"),
    role: "secondary",
    network: "polygon",
    address: "0x28C6c06298d514Db089934071355E5743bf21d60",
    label: "Polygon Gaming Vault",
  },
];

/** Cupons promocionais de teste. */
export const SEED_COUPONS: DbCoupon[] = [
  {
    code: "JUNGLE10",
    bps: 1000, // 10%
    expiresAt: "2027-12-31T23:59:59.000Z" as IsoDate,
    active: true,
  },
  {
    code: "WELCOME20",
    bps: 2000, // 20%
    expiresAt: "2027-12-31T23:59:59.000Z" as IsoDate,
    active: true,
  },
  {
    code: "EXPIRED50",
    bps: 5000, // 50%
    expiresAt: "2025-01-01T00:00:00.000Z" as IsoDate,
    active: false,
  },
];

/** Catálogo inicial de 12 NFTs cobrindo raridades, redes e categorias. */
export const SEED_NFTS: Nft[] = [
  {
    id: asId<"nft">("nft-1"),
    title: "Emerald Ape #042",
    description:
      "Chimpanzé icônico estilizado em 3D com jaqueta bomber verde esmeralda, óculos escuros e medalhão de ouro.",
    images: [
      {
        url: "/images/nfts/emerald-ape.png",
        alt: "Emerald Ape #042",
      },
    ],
    collection: { id: "genesis-apes", name: "Genesis Apes" },
    category: "art",
    rarity: "legendary",
    price: asEthString("1.19"),
    editions: [
      {
        id: asId<"edition">("nft-1-ed-1"),
        label: "Standard Edition",
        total: 50,
        available: 38,
        price: asEthString("1.19"),
      },
      {
        id: asId<"edition">("nft-1-ed-2"),
        label: "Collector Gold",
        total: 5,
        available: 2,
        price: asEthString("2.40"),
      },
    ],
    featured: true,
    network: "ethereum",
    version: 1,
    updatedAt: SEED_TIMESTAMP,
  },
  {
    id: asId<"nft">("nft-2"),
    title: "Sage Nomad #009",
    description:
      "Explorador digital em moletom roxo violeta com chapéu bucket oliva e feição contemplativa serena.",
    images: [
      {
        url: "/images/nfts/sage-nomad.png",
        alt: "Sage Nomad #009",
      },
    ],
    collection: { id: "nomad-wanderers", name: "Nomad Wanderers" },
    category: "collectibles",
    rarity: "epic",
    price: asEthString("1.69"),
    editions: [
      {
        id: asId<"edition">("nft-2-ed-1"),
        label: "Original Cut",
        total: 25,
        available: 14,
        price: asEthString("1.69"),
      },
    ],
    featured: true,
    network: "ethereum",
    version: 1,
    updatedAt: SEED_TIMESTAMP,
  },
  {
    id: asId<"nft">("nft-3"),
    title: "Noct Vessel #552",
    description:
      "Figura aristocrática com blazer marfim de alta alfaiataria sobre gola alta escura e postura imponente.",
    images: [
      {
        url: "/images/nfts/noct-vessel.png",
        alt: "Noct Vessel #552",
      },
    ],
    collection: { id: "ivory-nobility", name: "Ivory Nobility" },
    category: "3d-art",
    rarity: "epic",
    price: asEthString("1.98"),
    editions: [
      {
        id: asId<"edition">("nft-3-ed-1"),
        label: "First Print",
        total: 10,
        available: 4,
        price: asEthString("1.98"),
      },
    ],
    featured: true,
    network: "polygon",
    version: 1,
    updatedAt: SEED_TIMESTAMP,
  },
  {
    id: asId<"nft">("nft-4"),
    title: "Cosmic Bloom #118",
    description:
      "Mente generativa expressa em cores serenas, simbolizando a fusão de algoritmos e consciência visual.",
    images: [
      {
        url: "/images/nfts/sage-nomad.png",
        alt: "Cosmic Bloom #118",
      },
    ],
    collection: { id: "nomad-wanderers", name: "Nomad Wanderers" },
    category: "generative",
    rarity: "rare",
    price: asEthString("1.23"),
    editions: [
      {
        id: asId<"edition">("nft-4-ed-1"),
        label: "Neural Release",
        total: 100,
        available: 72,
        price: asEthString("1.23"),
      },
    ],
    featured: false,
    network: "ethereum",
    version: 1,
    updatedAt: SEED_TIMESTAMP,
  },
  {
    id: asId<"nft">("nft-5"),
    title: "Violet Nomad #314",
    description:
      "Avatar representativo da tribo nômade espacial, em trajes confortáveis para viagens interplanetárias.",
    images: [
      {
        url: "/images/nfts/sage-nomad.png",
        alt: "Violet Nomad #314",
      },
    ],
    collection: { id: "nomad-wanderers", name: "Nomad Wanderers" },
    category: "collectibles",
    rarity: "common",
    price: asEthString("0.45"),
    editions: [
      {
        id: asId<"edition">("nft-5-ed-1"),
        label: "Open Edition",
        total: 250,
        available: 190,
        price: asEthString("0.45"),
      },
    ],
    featured: false,
    network: "solana",
    version: 1,
    updatedAt: SEED_TIMESTAMP,
  },
  {
    id: asId<"nft">("nft-6"),
    title: "Ivory Baron #888",
    description:
      "Membro honorário da confraria dos primatas distinta, com terno bege e acabamento textural hiper-realista.",
    images: [
      {
        url: "/images/nfts/noct-vessel.png",
        alt: "Ivory Baron #888",
      },
    ],
    collection: { id: "ivory-nobility", name: "Ivory Nobility" },
    category: "art",
    rarity: "legendary",
    price: asEthString("1.75"),
    editions: [
      {
        id: asId<"edition">("nft-6-ed-1"),
        label: "Genesis 1/1",
        total: 1,
        available: 1,
        price: asEthString("1.75"),
      },
    ],
    featured: true,
    network: "ethereum",
    version: 1,
    updatedAt: SEED_TIMESTAMP,
  },
  {
    id: asId<"nft">("nft-7"),
    title: "Golden Bear #207",
    description:
      "Campeão gamer em agasalho esportivo creme e fones de ouvido acústicos com cancelamento de ruído.",
    images: [
      {
        url: "/images/nfts/golden-bear.png",
        alt: "Golden Bear #207",
      },
    ],
    collection: { id: "audio-warriors", name: "Audio Warriors" },
    category: "gaming",
    rarity: "epic",
    price: asEthString("0.99"),
    editions: [
      {
        id: asId<"edition">("nft-7-ed-1"),
        label: "Pro Gamer Cut",
        total: 50,
        available: 31,
        price: asEthString("0.99"),
      },
    ],
    featured: true,
    network: "polygon",
    version: 1,
    updatedAt: SEED_TIMESTAMP,
  },
  {
    id: asId<"nft">("nft-8"),
    title: "Golden Signal #140",
    description:
      "Produtor musical com fones de monitoramento de estúdio e sorriso contagiante, emitindo ondas sonoras raras.",
    images: [
      {
        url: "/images/nfts/golden-bear.png",
        alt: "Golden Signal #140",
      },
    ],
    collection: { id: "audio-warriors", name: "Audio Warriors" },
    category: "music",
    rarity: "rare",
    price: asEthString("0.89"),
    editions: [
      {
        id: asId<"edition">("nft-8-ed-1"),
        label: "Sonic Pass",
        total: 75,
        available: 48,
        price: asEthString("0.89"),
      },
    ],
    featured: false,
    network: "solana",
    version: 1,
    updatedAt: SEED_TIMESTAMP,
  },
  {
    id: asId<"nft">("nft-9"),
    title: "Golden Signal #160",
    description:
      "Edição especial da série de primatas sonoros em sintonia com a rede Ethereum e trilha sonora imersiva.",
    images: [
      {
        url: "/images/nfts/golden-bear.png",
        alt: "Golden Signal #160",
      },
    ],
    collection: { id: "audio-warriors", name: "Audio Warriors" },
    category: "music",
    rarity: "rare",
    price: asEthString("1.20"),
    editions: [
      {
        id: asId<"edition">("nft-9-ed-1"),
        label: "Master Vinyl",
        total: 30,
        available: 19,
        price: asEthString("1.20"),
      },
    ],
    featured: false,
    network: "ethereum",
    version: 1,
    updatedAt: SEED_TIMESTAMP,
  },
  {
    id: asId<"nft">("nft-10"),
    title: "Emerald Visionary #088",
    description:
      "Retrato fotográfico de alta precisão capturando os detalhes finos da textura têxtil e reflexo dos óculos.",
    images: [
      {
        url: "/images/nfts/emerald-ape.png",
        alt: "Emerald Visionary #088",
      },
    ],
    collection: { id: "genesis-apes", name: "Genesis Apes" },
    category: "photography",
    rarity: "rare",
    price: asEthString("1.45"),
    editions: [
      {
        id: asId<"edition">("nft-10-ed-1"),
        label: "Archival Print",
        total: 40,
        available: 22,
        price: asEthString("1.45"),
      },
    ],
    featured: false,
    network: "polygon",
    version: 1,
    updatedAt: SEED_TIMESTAMP,
  },
  {
    id: asId<"nft">("nft-11"),
    title: "Noct Vessel #701",
    description:
      "Elegante primata em traje de gala com traços arquitetônicos clássicos e expressão nobre.",
    images: [
      {
        url: "/images/nfts/noct-vessel.png",
        alt: "Noct Vessel #701",
      },
    ],
    collection: { id: "ivory-nobility", name: "Ivory Nobility" },
    category: "memberships",
    rarity: "legendary",
    price: asEthString("2.80"),
    editions: [
      {
        id: asId<"edition">("nft-11-ed-1"),
        label: "Founder Seat",
        total: 3,
        available: 1,
        price: asEthString("2.80"),
      },
    ],
    featured: true,
    network: "arbitrum",
    version: 1,
    updatedAt: SEED_TIMESTAMP,
  },
  {
    id: asId<"nft">("nft-12"),
    title: "Sage Nomad #022",
    description:
      "Nômade das planícies digitais com gorro tático e moletom texturizado em tons terrosos.",
    images: [
      {
        url: "/images/nfts/sage-nomad.png",
        alt: "Sage Nomad #022",
      },
    ],
    collection: { id: "nomad-wanderers", name: "Nomad Wanderers" },
    category: "utility",
    rarity: "common",
    price: asEthString("0.55"),
    editions: [
      {
        id: asId<"edition">("nft-12-ed-1"),
        label: "Utility Token Tier",
        total: 500,
        available: 412,
        price: asEthString("0.55"),
      },
    ],
    featured: false,
    network: "optimism",
    version: 1,
    updatedAt: SEED_TIMESTAMP,
  },
];

/** Carrinhos de compra iniciais. */
export const SEED_CARTS: Cart[] = [
  {
    id: "cart_demo",
    owner: { kind: "user", id: asId<"user">("user_demo") },
    lines: [
      {
        nftId: asId<"nft">("nft-1"),
        editionId: asId<"edition">("nft-1-ed-1"),
        quantity: 1,
      },
    ],
    version: 1,
  },
];

/** Cotações iniciais (vazio por padrão). */
export const SEED_QUOTES: Quote[] = [];

/** Pedidos iniciais (vazio por padrão). */
export const SEED_ORDERS: Order[] = [];
