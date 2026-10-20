/**
 * Schemas Zod para formulários e validações de Autenticação na UI.
 */
import { z } from "zod";

export const loginFormSchema = z.object({
  email: z.string().min(1, "E-mail é obrigatório").email("Informe um e-mail válido"),
  password: z
    .string()
    .min(1, "Senha é obrigatória")
    .min(6, "Senha deve ter no mínimo 6 caracteres"),
});

export type LoginFormData = z.infer<typeof loginFormSchema>;
