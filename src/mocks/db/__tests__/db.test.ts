/**
 * Testes unitários do banco de dados em memória e rotinas de reset e helpers.
 */
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { db, dbHelpers, resetDb, SEED_NFTS } from "@/mocks/db";
import { verifyPassword } from "@/mocks/db/repositories/users";

describe("InMemoryDatabase (src/mocks/db)", () => {
  beforeEach(() => {
    resetDb();
  });

  afterEach(() => {
    resetDb();
  });

  it("deve inicializar com as seeds completas de NFTs, usuários, carteiras e cupons", () => {
    expect(db.nfts.size).toBe(12);
    expect(db.users.size).toBe(2);
    expect(db.wallets.size).toBe(3);
    expect(db.coupons.size).toBe(3);
    expect(db.carts.size).toBe(1);
  });

  it("deve conter o usuário demo com senha conhecida e carteiras associadas", async () => {
    const user = dbHelpers.findUserByEmail("demo@jungle.com");
    expect(user).toBeDefined();
    expect(user?.name).toBe("Alex Jungle");
    // A senha nunca fica em claro: o seed guarda apenas o hash PBKDF2
    expect(user?.passwordHash).toMatch(/^pbkdf2\$[0-9a-f]{32}\$[0-9a-f]{64}$/);
    expect(await verifyPassword("Password123!", user!.passwordHash)).toBe(true);
    expect(await verifyPassword("Password123?", user!.passwordHash)).toBe(false);

    if (user) {
      const wallets = dbHelpers.findWalletsByUserId(user.id);
      expect(wallets).toHaveLength(2);
      expect(wallets.some((w) => w.network === "ethereum")).toBe(true);
      expect(wallets.some((w) => w.network === "polygon")).toBe(true);
    }
  });

  it("deve conter um segundo usuário isolado, com carteira própria", async () => {
    const curator = dbHelpers.findUserByEmail("curator@kurio.art");
    expect(curator).toBeDefined();
    expect(await verifyPassword("Password123!", curator!.passwordHash)).toBe(true);

    const wallets = dbHelpers.findWalletsByUserId(curator!.id);
    expect(wallets).toHaveLength(1);
    expect(wallets.every((w) => w.userId === curator!.id)).toBe(true);
  });

  it("deve encontrar cupons ativos e ignorar maiúsculas/minúsculas", () => {
    const jungle10 = dbHelpers.findCouponByCode("jungle10");
    expect(jungle10).toBeDefined();
    expect(jungle10?.bps).toBe(1000);
    expect(jungle10?.active).toBe(true);

    const welcome20 = dbHelpers.findCouponByCode("WELCOME20");
    expect(welcome20).toBeDefined();
    expect(welcome20?.bps).toBe(2000);
    expect(welcome20?.active).toBe(true);

    const invalid = dbHelpers.findCouponByCode("NOT_EXIST");
    expect(invalid).toBeUndefined();
  });

  it("deve buscar NFTs por ID corretamente", () => {
    const nft = dbHelpers.findNftById("nft-1");
    expect(nft).toBeDefined();
    expect(nft?.title).toBe("Emerald Ape #042");
    expect(nft?.rarity).toBe("legendary");
    expect(nft?.price).toBe("1.19");
    expect(nft?.editions.length).toBeGreaterThan(0);
  });

  it("deve resetar o banco e restaurar o estado original após mutações sem poluir as seeds", () => {
    // 1. Modifica o preço e disponibilidade de um NFT
    const targetNft = db.nfts.get("nft-1");
    expect(targetNft).toBeDefined();
    if (targetNft) {
      targetNft.title = "Título Alterado";
      targetNft.editions[0]!.available = 0;
    }

    // 2. Remove um cupom e adiciona um novo usuário
    db.coupons.delete("JUNGLE10");
    db.users.clear();

    expect(db.users.size).toBe(0);
    expect(db.coupons.has("JUNGLE10")).toBe(false);

    // 3. Executa o resetDb()
    resetDb();

    // 4. Valida restauração completa
    expect(db.users.size).toBe(2);
    expect(db.coupons.has("JUNGLE10")).toBe(true);

    const restoredNft = db.nfts.get("nft-1");
    expect(restoredNft?.title).toBe("Emerald Ape #042");
    expect(restoredNft?.editions[0]!.available).toBe(38);

    // 5. Garante que as seeds imutáveis de origem continuam intactas
    expect(SEED_NFTS[0]!.title).toBe("Emerald Ape #042");
  });
});
