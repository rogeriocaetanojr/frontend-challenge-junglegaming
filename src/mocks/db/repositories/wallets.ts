/**
 * Repositório de carteiras Web3 no banco em memória.
 *
 * Centraliza as operações de busca isolada por usuário, persistência,
 * controle atômico de papéis (no máximo 1 primary e 1 secondary por usuário),
 * validação estrita de endereço 0x e simulação de connect/disconnect.
 */
import type { Network } from "@/contracts/catalog";
import { asId, type Id, type IsoDate } from "@/contracts/common";
import type { Wallet, WalletRole } from "@/contracts/identity";
import { db } from "@/mocks/db";

const ETH_ADDRESS_REGEX = /^0x[a-fA-F0-9]{40}$/;

export interface CreateWalletInput {
  userId: Id<"user">;
  address: string;
  network?: Network;
  role?: WalletRole;
  label?: string;
}

export interface UpdateWalletInput {
  address?: string;
  network?: Network;
  role?: WalletRole;
  label?: string;
}

export const walletsRepository = {
  /**
   * Valida se o endereço informado segue a especificação 0x com 40 dígitos hexadecimais.
   */
  isValidAddress(address: unknown): address is string {
    return typeof address === "string" && ETH_ADDRESS_REGEX.test(address);
  },

  /**
   * Busca uma carteira pelo identificador único.
   */
  findById(id: string): Wallet | undefined {
    return db.wallets.get(id);
  },

  /**
   * Lista todas as carteiras pertencentes exclusivamente a um usuário específico.
   */
  findByUserId(userId: string): Wallet[] {
    const wallets: Wallet[] = [];
    for (const wallet of db.wallets.values()) {
      if (wallet.userId === userId) {
        wallets.push(wallet);
      }
    }
    return wallets;
  },

  /**
   * Retorna a carteira primária do usuário, se houver.
   */
  findPrimary(userId: string): Wallet | undefined {
    for (const wallet of db.wallets.values()) {
      if (wallet.userId === userId && wallet.role === "primary") {
        return wallet;
      }
    }
    return undefined;
  },

  /**
   * Retorna a carteira secundária do usuário, se houver.
   */
  findSecondary(userId: string): Wallet | undefined {
    for (const wallet of db.wallets.values()) {
      if (wallet.userId === userId && wallet.role === "secondary") {
        return wallet;
      }
    }
    return undefined;
  },

  /**
   * Persiste uma carteira garantindo a regra de unicidade de papéis:
   * No máximo 1 carteira 'primary' e 1 'secondary' por usuário.
   * Se uma nova carteira for definida como 'primary', a primária anterior é rebaixada para 'secondary'.
   */
  save(wallet: Wallet): Wallet {
    const userWallets = Array.from(db.wallets.values()).filter(
      (w) => w.userId === wallet.userId && w.id !== wallet.id,
    );

    if (wallet.role === "primary") {
      // Rebaixa qualquer primária existente para secundária e remove secundárias prévias
      for (const existing of userWallets) {
        if (existing.role === "primary") {
          existing.role = "secondary";
        } else if (existing.role === "secondary") {
          db.wallets.delete(existing.id);
        }
      }
    } else if (wallet.role === "secondary") {
      // Se a nova for secundária, remove qualquer secundária pré-existente para manter unicidade
      for (const existing of userWallets) {
        if (existing.role === "secondary") {
          db.wallets.delete(existing.id);
        }
      }
    }

    db.wallets.set(wallet.id, wallet);
    return wallet;
  },

  /**
   * Cria e persiste uma nova carteira para o usuário.
   */
  create(input: CreateWalletInput): Wallet {
    const existingWallets = this.findByUserId(input.userId);
    const hasPrimary = existingWallets.some((w) => w.role === "primary");

    // Determina o papel padrão caso não tenha sido especificado
    const targetRole: WalletRole = input.role ?? (hasPrimary ? "secondary" : "primary");

    const id = asId<"wallet">(
      `wallet_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    );
    const wallet: Wallet = {
      id,
      userId: input.userId,
      role: targetRole,
      network: input.network ?? "ethereum",
      address: input.address,
      label: input.label,
      connected: false,
    };

    return this.save(wallet);
  },

  /**
   * Atualiza campos de uma carteira existente com garantia da regra de unicidade de papéis.
   */
  update(id: string, updates: UpdateWalletInput): Wallet | undefined {
    const wallet = db.wallets.get(id);
    if (!wallet) {
      return undefined;
    }

    if (updates.address !== undefined) {
      wallet.address = updates.address;
    }
    if (updates.network !== undefined) {
      wallet.network = updates.network;
    }
    if (updates.label !== undefined) {
      wallet.label = updates.label;
    }
    if (updates.role !== undefined) {
      wallet.role = updates.role;
    }

    return this.save(wallet);
  },

  /**
   * Remove uma carteira do banco em memória.
   */
  delete(id: string): boolean {
    return db.wallets.delete(id);
  },

  /**
   * Simula a conexão bem-sucedida da carteira, marcando como conectada com timestamp.
   */
  connect(id: string): Wallet | undefined {
    const wallet = db.wallets.get(id);
    if (!wallet) {
      return undefined;
    }

    wallet.connected = true;
    wallet.connectedAt = new Date().toISOString() as IsoDate;
    return wallet;
  },

  /**
   * Desconecta a carteira e limpa os dados de timestamp de conexão.
   */
  disconnect(id: string): Wallet | undefined {
    const wallet = db.wallets.get(id);
    if (!wallet) {
      return undefined;
    }

    wallet.connected = false;
    delete wallet.connectedAt;
    return wallet;
  },
};
