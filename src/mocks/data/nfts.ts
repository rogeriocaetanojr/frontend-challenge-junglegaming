import type { NftItem } from "@/types/nft";

export const MOCK_NFTS: NftItem[] = [
  {
    id: "1",
    name: "Cyber Sentinel #001",
    description:
      "Guardião cibernético autônomo forjado em ligas de titânio digital com núcleo neural quântico.",
    priceEth: 0.45,
    image:
      "https://images.unsplash.com/photo-1633167606207-d840b5070fc2?auto=format&fit=crop&w=800&q=80",
    creator: {
      name: "Aethelgard Labs",
      address: "0x71C8364437a9C27779976872A42F340a6B233921",
      avatar:
        "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80",
    },
    collection: {
      name: "Cyber Sentinels",
      slug: "cyber-sentinels",
    },
    category: "gaming",
    attributes: [
      { trait_type: "Classe", value: "Guardião Pesado" },
      { trait_type: "Núcleo", value: "Quântico" },
      { trait_type: "Raridade", value: "Lendário" },
      { trait_type: "Armadura", value: "Titânio 98%" },
    ],
    likes: 142,
    verified: true,
    createdAt: "2026-09-15T10:00:00Z",
  },
  {
    id: "2",
    name: "Neural Nexus Prism",
    description:
      "Escultura geométrica generativa representando as sinapses entre inteligência artificial e arte sensorial.",
    priceEth: 1.25,
    image:
      "https://images.unsplash.com/photo-1634017839464-5c339ebe3cb4?auto=format&fit=crop&w=800&q=80",
    creator: {
      name: "Nova Synthetics",
      address: "0x89205A3A3b2A69De6Dbf7f01ED13B2108B2c43e7",
      avatar:
        "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80",
    },
    collection: {
      name: "Abstract Dimensions",
      slug: "abstract-dimensions",
    },
    category: "art",
    attributes: [
      { trait_type: "Forma", value: "Prisma Octaédrico" },
      { trait_type: "Paleta", value: "Bronze Neon" },
      { trait_type: "Complexidade", value: "Nível 5" },
    ],
    likes: 89,
    verified: true,
    createdAt: "2026-09-20T14:30:00Z",
  },
  {
    id: "3",
    name: "Aether Void Runner",
    description:
      "Veículo de exploração espacial desenhado para navegação em anomalias gravitacionais hiperdimensionais.",
    priceEth: 0.85,
    image:
      "https://images.unsplash.com/photo-1614728894747-a83421e2b9c9?auto=format&fit=crop&w=800&q=80",
    creator: {
      name: "Starlight Forge",
      address: "0x28C6c06298d514Db089934071355E5743bf21d60",
      avatar:
        "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=200&q=80",
    },
    collection: {
      name: "Void Drifters",
      slug: "void-drifters",
    },
    category: "gaming",
    attributes: [
      { trait_type: "Propulsão", value: "Antimatéria" },
      { trait_type: "Velocidade", value: "Mach 14" },
      { trait_type: "Geração", value: "Mk III" },
    ],
    likes: 215,
    verified: true,
    createdAt: "2026-09-22T08:15:00Z",
  },
  {
    id: "4",
    name: "Golden Mirage Sphere",
    description:
      "Esfera de fusão dourada renderizada com simulação física de partículas em ambiente de gravidade zero.",
    priceEth: 2.4,
    image:
      "https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?auto=format&fit=crop&w=800&q=80",
    creator: {
      name: "Aura Creative",
      address: "0xbDA5747bFD65F08deb54cb465eB87D40e51B197E",
      avatar:
        "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=200&q=80",
    },
    collection: {
      name: "Celestial Orbs",
      slug: "celestial-orbs",
    },
    category: "collectibles",
    attributes: [
      { trait_type: "Material", value: "Ouro Quântico" },
      { trait_type: "Refração", value: "Cromática" },
      { trait_type: "Edição", value: "1 de 1" },
    ],
    likes: 310,
    verified: true,
    createdAt: "2026-09-25T19:40:00Z",
  },
  {
    id: "5",
    name: "Obsidian Citadel Realm",
    description:
      "Terreno virtual exclusivo situado no epicentro da metrópole de Neon Genesis com direitos de construção descentralizados.",
    priceEth: 3.8,
    image:
      "https://images.unsplash.com/photo-1622979135225-d2ba269bc1df?auto=format&fit=crop&w=800&q=80",
    creator: {
      name: "MetaVerse Architects",
      address: "0xdd922d57aA8b19124CEF2B484e55E3a0f757dD2A",
      avatar:
        "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=200&q=80",
    },
    collection: {
      name: "Genesis Worlds",
      slug: "genesis-worlds",
    },
    category: "virtual-worlds",
    attributes: [
      { trait_type: "Setor", value: "Distrito Central" },
      { trait_type: "Área", value: "2500m² Virtuais" },
      { trait_type: "Zoneamento", value: "Comercial / Lazer" },
    ],
    likes: 184,
    verified: true,
    createdAt: "2026-09-28T11:20:00Z",
  },
  {
    id: "6",
    name: "Chrono Shard #42",
    description:
      "Fragmento temporal cristalizado que reflete timelines alternativos sob iluminação infravermelha.",
    priceEth: 0.15,
    image:
      "https://images.unsplash.com/photo-1638803040283-7a5ffd48dad5?auto=format&fit=crop&w=800&q=80",
    creator: {
      name: "TimeForge Guild",
      address: "0x8626f6940E2eb28930eFb4CeF49B2d1F2C9C1199",
      avatar:
        "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80",
    },
    collection: {
      name: "Chrono Relics",
      slug: "chrono-relics",
    },
    category: "collectibles",
    attributes: [
      { trait_type: "Linha Temporal", value: "Alpha-7" },
      { trait_type: "Densidade", value: "Alta" },
      { trait_type: "Pureza", value: "99.4%" },
    ],
    likes: 67,
    verified: false,
    createdAt: "2026-10-01T15:00:00Z",
  },
  {
    id: "7",
    name: "Fluido Cósmico Primordial",
    description:
      "Ondas fluidas geradas proceduralmente utilizando shaders de dinâmica de fluidos Navier-Stokes em tempo real.",
    priceEth: 0.65,
    image:
      "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80",
    creator: {
      name: "Nova Synthetics",
      address: "0x89205A3A3b2A69De6Dbf7f01ED13B2108B2c43e7",
      avatar:
        "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80",
    },
    collection: {
      name: "Abstract Dimensions",
      slug: "abstract-dimensions",
    },
    category: "art",
    attributes: [
      { trait_type: "Algoritmo", value: "Navier-Stokes" },
      { trait_type: "Viscosidade", value: "Baixa" },
      { trait_type: "Tom", value: "Cobre & Ébano" },
    ],
    likes: 122,
    verified: true,
    createdAt: "2026-10-03T18:10:00Z",
  },
  {
    id: "8",
    name: "Valkyrie Core Mech",
    description:
      "Exoesqueleto de combate aéreo blindado com sensores táteis integrados à rede neural de combate descentralizada.",
    priceEth: 1.85,
    image:
      "https://images.unsplash.com/photo-1635322966219-b75ed372eb01?auto=format&fit=crop&w=800&q=80",
    creator: {
      name: "Aethelgard Labs",
      address: "0x71C8364437a9C27779976872A42F340a6B233921",
      avatar:
        "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80",
    },
    collection: {
      name: "Cyber Sentinels",
      slug: "cyber-sentinels",
    },
    category: "gaming",
    attributes: [
      { trait_type: "Potência", value: "4800 kW" },
      { trait_type: "Blindagem", value: "Nanotubos" },
      { trait_type: "Raridade", value: "Mítico" },
    ],
    likes: 278,
    verified: true,
    createdAt: "2026-10-06T09:45:00Z",
  },
  {
    id: "9",
    name: "Nebula Sanctuary Island",
    description:
      "Ilha flutuante no metaverso com ecossistema biológico luminescente e portal de teletransporte interoperável.",
    priceEth: 4.2,
    image:
      "https://images.unsplash.com/photo-1618172193763-c511deb635ca?auto=format&fit=crop&w=800&q=80",
    creator: {
      name: "MetaVerse Architects",
      address: "0xdd922d57aA8b19124CEF2B484e55E3a0f757dD2A",
      avatar:
        "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=200&q=80",
    },
    collection: {
      name: "Genesis Worlds",
      slug: "genesis-worlds",
    },
    category: "virtual-worlds",
    attributes: [
      { trait_type: "Altitude", value: "850m" },
      { trait_type: "Bioma", value: "Cristalino" },
      { trait_type: "Conectividade", value: "WebXR Nativo" },
    ],
    likes: 412,
    verified: true,
    createdAt: "2026-10-08T13:20:00Z",
  },
  {
    id: "10",
    name: "Ethereal Helix Helix",
    description:
      "Representação helicoidal da fita de DNA digital codificada com hashes criptográficos imutáveis na blockchain.",
    priceEth: 0.95,
    image:
      "https://images.unsplash.com/photo-1618005198919-d3d4b5a92ead?auto=format&fit=crop&w=800&q=80",
    creator: {
      name: "Aura Creative",
      address: "0xbDA5747bFD65F08deb54cb465eB87D40e51B197E",
      avatar:
        "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=200&q=80",
    },
    collection: {
      name: "Abstract Dimensions",
      slug: "abstract-dimensions",
    },
    category: "art",
    attributes: [
      { trait_type: "Estrutura", value: "Dupla Hélice" },
      { trait_type: "Renderizador", value: "Octane Render" },
      { trait_type: "Brilho", value: "Fosforescente" },
    ],
    likes: 95,
    verified: true,
    createdAt: "2026-10-10T16:00:00Z",
  },
  {
    id: "11",
    name: "Cybernetic Kintsugi Mask",
    description:
      "Máscara ancestral reparada com ouro líquido condutivo e circuitos de cobre em tributo à filosofia Kintsugi.",
    priceEth: 1.6,
    image:
      "https://images.unsplash.com/photo-1620121692029-d088224ddc74?auto=format&fit=crop&w=800&q=80",
    creator: {
      name: "Starlight Forge",
      address: "0x28C6c06298d514Db089934071355E5743bf21d60",
      avatar:
        "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=200&q=80",
    },
    collection: {
      name: "Chrono Relics",
      slug: "chrono-relics",
    },
    category: "collectibles",
    attributes: [
      { trait_type: "Origem", value: "Neo Kyoto" },
      { trait_type: "Técnica", value: "Kintsugi Digital" },
      { trait_type: "Circuito", value: "Cobre 99.9%" },
    ],
    likes: 198,
    verified: true,
    createdAt: "2026-10-12T20:30:00Z",
  },
  {
    id: "12",
    name: "Singularity Portal Core",
    description:
      "Vórtice interestelar de dobra espacial com simulação de lente gravitacional e horizonte de eventos estocástico.",
    priceEth: 3.15,
    image:
      "https://images.unsplash.com/photo-1634017839464-5c339ebe3cb4?auto=format&fit=crop&w=800&q=80",
    creator: {
      name: "TimeForge Guild",
      address: "0x8626f6940E2eb28930eFb4CeF49B2d1F2C9C1199",
      avatar:
        "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80",
    },
    collection: {
      name: "Void Drifters",
      slug: "void-drifters",
    },
    category: "art",
    attributes: [
      { trait_type: "Dobra Espacial", value: "Gravitacional" },
      { trait_type: "Horizonte", value: "Ergosfera Ativa" },
      { trait_type: "Singularidade", value: "Kerr-Newman" },
    ],
    likes: 340,
    verified: true,
    createdAt: "2026-10-15T12:00:00Z",
  },
];
