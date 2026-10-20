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

export const registerFormSchema = z
  .object({
    name: z.string().min(1, "Nome é obrigatório"),
    email: z.string().min(1, "E-mail é obrigatório").email("Informe um e-mail válido"),
    password: z
      .string()
      .min(1, "Senha é obrigatória")
      .min(8, "Senha deve ter no mínimo 8 caracteres"),
    confirmPassword: z.string().min(1, "Confirmação de senha é obrigatória"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "As senhas não coincidem",
    path: ["confirmPassword"],
  });

export type RegisterFormData = z.infer<typeof registerFormSchema>;
