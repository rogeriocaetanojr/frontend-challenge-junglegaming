/**
 * Schemas Zod para contratos de identidade, autenticação e carteiras.
 */
import { z } from "zod";

import type {
  Credentials,
  PasswordChange,
  ProfileUpdate,
  RegisterInput,
  Session,
  User,
  Wallet,
  WalletConnectionResult,
  WalletRole,
} from "@/contracts/identity";
import { networkSchema } from "@/contracts/schemas/catalog";
import { createIdSchema, isoDateSchema } from "@/contracts/schemas/common";

/** Schema para dados do usuário. */
export const userSchema = z.object({
  id: createIdSchema<"user">(),
  name: z.string().min(1, "Nome é obrigatório"),
  email: z.string().email("E-mail inválido"),
  avatarUrl: z.string().url("URL de avatar inválida").optional(),
  createdAt: isoDateSchema,
}) satisfies z.ZodType<User>;

/** Schema para sessão de autenticação. */
export const sessionSchema = z.object({
  token: z.string().min(1, "Token de autenticação obrigatório"),
  expiresAt: isoDateSchema,
  user: userSchema,
}) satisfies z.ZodType<Session>;

/** Schema para credenciais de login. */
export const credentialsSchema = z.object({
  email: z.string().email("E-mail inválido"),
  password: z.string().min(6, "Senha deve ter no mínimo 6 caracteres"),
}) satisfies z.ZodType<Credentials>;

/** Schema para cadastro de novo usuário. */
export const registerInputSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  email: z.string().email("E-mail inválido"),
  password: z.string().min(6, "Senha deve ter no mínimo 6 caracteres"),
}) satisfies z.ZodType<RegisterInput>;

/** Schema para atualização parcial de perfil. */
export const profileUpdateSchema = z.object({
  name: z.string().min(1).optional(),
  email: z.string().email("E-mail inválido").optional(),
}) satisfies z.ZodType<ProfileUpdate>;

/** Schema para alteração de senha. */
export const passwordChangeSchema = z.object({
  currentPassword: z.string().min(1, "Senha atual é obrigatória"),
  newPassword: z.string().min(6, "Nova senha deve ter no mínimo 6 caracteres"),
}) satisfies z.ZodType<PasswordChange>;

/** Schema para papel da carteira. */
export const walletRoleSchema = z.enum([
  "primary",
  "secondary",
]) satisfies z.ZodType<WalletRole>;

/** Schema para carteira conectada. */
export const walletSchema = z.object({
  id: createIdSchema<"wallet">(),
  userId: createIdSchema<"user">(),
  role: walletRoleSchema,
  network: networkSchema,
  address: z.string().min(1, "Endereço da carteira é obrigatório"),
  label: z.string().optional(),
}) satisfies z.ZodType<Wallet>;

/** Schema para resultado da conexão de carteira. */
export const walletConnectionResultSchema = z.object({
  connected: z.boolean(),
  wallet: walletSchema.optional(),
  reason: z.string().optional(),
}) satisfies z.ZodType<WalletConnectionResult>;
