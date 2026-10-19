/**
 * Contratos de identidade: usuário, sessão, autenticação e carteiras.
 *
 * Senhas aparecem apenas nos contratos de entrada (`Credentials`,
 * `RegisterInput`, `PasswordChange`) e nunca em `User` ou `Session`.
 */
import type { Network } from "@/contracts/catalog";
import type { Id, IsoDate } from "@/contracts/common";

/** Usuário autenticado do marketplace. */
export interface User {
  id: Id<"user">;
  name: string;
  email: string;
  avatarUrl?: string;
  createdAt: IsoDate;
}

/** Sessão ativa emitida após login ou cadastro. */
export interface Session {
  token: string;
  expiresAt: IsoDate;
  user: User;
}

/** Credenciais de login por e-mail e senha. */
export interface Credentials {
  email: string;
  password: string;
}

/** Dados de cadastro de um novo usuário. */
export interface RegisterInput {
  name: string;
  email: string;
  password: string;
}

/** Atualização parcial do perfil do usuário. */
export interface ProfileUpdate {
  name?: string;
  email?: string;
}

/** Troca de senha exigindo a senha atual. */
export interface PasswordChange {
  currentPassword: string;
  newPassword: string;
}

/** Papel da carteira vinculada ao usuário. */
export type WalletRole = "primary" | "secondary";

/** Carteira Web3 vinculada a um usuário. */
export interface Wallet {
  id: Id<"wallet">;
  userId: Id<"user">;
  role: WalletRole;
  network: Network;
  address: string;
  label?: string;
}

/** Resultado de uma tentativa de conexão de carteira. */
export interface WalletConnectionResult {
  connected: boolean;
  wallet?: Wallet;
  /** Motivo da falha quando `connected` é `false`. */
  reason?: string;
}
