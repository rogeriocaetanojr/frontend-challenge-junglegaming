/**
 * Repositório de usuários e sessões no banco em memória.
 *
 * Centraliza as operações de busca, sanitização, persistência de dados cadastrais,
 * upload de avatar, gestão de sessões e hashing/validação de senhas salgadas via PBKDF2.
 */
import type { IsoDate } from "@/contracts/common";
import type { Session, User } from "@/contracts/identity";
import { db, type DbUser } from "@/mocks/db";

/**
 * Deriva um hash salgado PBKDF2 (SHA-256, 1000 iterações, 256 bits) para a senha fornecida.
 * Formato retornado: `pbkdf2$<salt_hex>$<hash_hex>`
 */
export async function hashPassword(password: string, saltHex?: string): Promise<string> {
  const salt = saltHex
    ? new Uint8Array(saltHex.match(/.{1,2}/g)?.map((byte) => parseInt(byte, 16)) ?? [])
    : crypto.getRandomValues(new Uint8Array(16));

  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    encoder.encode(password),
    { name: "PBKDF2" },
    false,
    ["deriveBits"],
  );

  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt,
      iterations: 1000,
      hash: "SHA-256",
    },
    keyMaterial,
    256,
  );

  const hashArray = Array.from(new Uint8Array(derivedBits));
  const hashStr = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
  const actualSaltHex = Array.from(salt)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  return `pbkdf2$${actualSaltHex}$${hashStr}`;
}

/**
 * Valida a senha contra o hash armazenado.
 * Suporta o formato PBKDF2 e preserva retrocompatibilidade com senhas de seeds em texto puro.
 */
export async function verifyPassword(
  password: string,
  storedHash: string,
): Promise<boolean> {
  if (storedHash.startsWith("pbkdf2$")) {
    const parts = storedHash.split("$");
    if (parts.length !== 3) {
      return false;
    }
    const saltHex = parts[1];
    const computed = await hashPassword(password, saltHex);
    return computed === storedHash;
  }

  // Compatibilidade com senhas das seeds iniciais (ex.: "Password123!")
  return password === storedHash;
}

export const usersRepository = {
  /**
   * Remove campos sensíveis (como passwordHash) para retorno seguro na API.
   */
  sanitize(user: DbUser): User {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      bio: user.bio,
      avatarUrl: user.avatarUrl,
      createdAt: user.createdAt,
    };
  },

  /**
   * Busca um usuário pelo ID único.
   */
  findById(id: string): DbUser | undefined {
    return db.users.get(id);
  },

  /**
   * Busca um usuário pelo e-mail (insensível a maiúsculas e minúsculas).
   */
  findByEmail(email: string): DbUser | undefined {
    const normalized = email.trim().toLowerCase();
    for (const user of db.users.values()) {
      if (user.email.toLowerCase() === normalized) {
        return user;
      }
    }
    return undefined;
  },

  /**
   * Atualiza dados de perfil do usuário e reflete as alterações em sessões ativas.
   */
  update(
    id: string,
    updates: Partial<
      Pick<DbUser, "name" | "email" | "bio" | "avatarUrl" | "passwordHash">
    >,
  ): DbUser | undefined {
    const user = db.users.get(id);
    if (!user) {
      return undefined;
    }

    if (updates.name !== undefined) {
      user.name = updates.name.trim();
    }
    if (updates.email !== undefined) {
      user.email = updates.email.trim().toLowerCase();
    }
    if (updates.bio !== undefined) {
      user.bio = updates.bio.trim();
    }
    if (updates.avatarUrl !== undefined) {
      user.avatarUrl = updates.avatarUrl;
    }
    if (updates.passwordHash !== undefined) {
      user.passwordHash = updates.passwordHash;
    }

    // Sincroniza os dados atualizados com quaisquer sessões ativas do usuário
    for (const session of db.sessions.values()) {
      if (session.user.id === id) {
        session.user = this.sanitize(user);
      }
    }

    return user;
  },

  /**
   * Atualiza a URL do avatar do usuário.
   */
  updateAvatar(id: string, avatarUrl: string): DbUser | undefined {
    return this.update(id, { avatarUrl });
  },

  /**
   * Atualiza o hash de senha do usuário.
   */
  updatePassword(id: string, passwordHash: string): boolean {
    const updated = this.update(id, { passwordHash });
    return !!updated;
  },

  /**
   * Obtém uma sessão ativa pelo token Bearer.
   * Valida também se a sessão não expirou.
   */
  findSessionByToken(token: string): Session | undefined {
    const cleanToken = token.startsWith("Bearer ") ? token.slice(7).trim() : token.trim();

    if (!cleanToken) {
      return undefined;
    }

    const session = db.sessions.get(cleanToken);
    if (!session) {
      return undefined;
    }

    const expiresAt = new Date(session.expiresAt).getTime();
    if (expiresAt < Date.now()) {
      db.sessions.delete(cleanToken);
      return undefined;
    }

    return session;
  },

  /**
   * Registra uma nova sessão associada ao usuário.
   */
  createSession(user: DbUser, customToken?: string): Session {
    const token = customToken ?? `mock-token-${user.id}-${Date.now()}`;
    const session: Session = {
      token,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() as IsoDate,
      user: this.sanitize(user),
    };
    db.sessions.set(token, session);
    return session;
  },

  /**
   * Remove uma sessão ativa (logout).
   */
  removeSession(token: string): boolean {
    const cleanToken = token.startsWith("Bearer ") ? token.slice(7).trim() : token.trim();
    return db.sessions.delete(cleanToken);
  },

  /**
   * Deriva um hash salgado PBKDF2 para a senha fornecida.
   */
  hashPassword(password: string, saltHex?: string): Promise<string> {
    return hashPassword(password, saltHex);
  },

  /**
   * Valida a senha informada contra o hash persistido.
   */
  verifyPassword(password: string, storedHash: string): Promise<boolean> {
    return verifyPassword(password, storedHash);
  },
};
