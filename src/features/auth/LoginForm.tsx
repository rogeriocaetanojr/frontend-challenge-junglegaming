/**
 * Formulário Acessível de Login (LoginForm).
 *
 * Integrado ao react-hook-form e validação Zod.
 * Totalmente compatível com WCAG 2.1 AA:
 * - Rótulos semânticos e identificadores únicos.
 * - aria-invalid e aria-describedby vinculados às mensagens de erro.
 * - Mapeamento dinâmico de fieldErrors e erros globais de API (ApiError 401).
 * - Feedback visual e acessível no botão de submissão contra cliques concorrentes.
 */
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import type { ApiErrorBody } from "@/contracts/common";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ApiError } from "@/lib/http";
import { type LoginFormData, loginFormSchema } from "./schemas";
import { useLogin } from "./useLogin";

export interface LoginFormProps {
  redirectPath?: string;
  onSuccess?: () => void;
  className?: string;
}

export function LoginForm({ redirectPath, onSuccess, className = "" }: LoginFormProps) {
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginFormSchema),
    defaultValues: {
      email: "",
      password: "",
    },
    mode: "onBlur",
  });

  const loginMutation = useLogin({
    redirectPath,
    onSuccess: () => {
      onSuccess?.();
    },
    onError: (err: unknown) => {
      if (err instanceof ApiError) {
        const details = err.details as ApiErrorBody | undefined;
        if (details?.fieldErrors) {
          for (const [field, messages] of Object.entries(details.fieldErrors)) {
            if (field === "email" || field === "password") {
              setError(field, {
                type: "server",
                message: messages[0] || "Campo inválido",
              });
            }
          }
        } else {
          setError("root", {
            type: "server",
            message:
              err.message ||
              "Credenciais inválidas. Verifique o e-mail e a senha informados.",
          });
        }
      } else {
        setError("root", {
          type: "server",
          message:
            "Ocorreu um erro inesperado ao tentar entrar. Tente novamente mais tarde.",
        });
      }
    },
  });

  const isPending = loginMutation.isPending || isSubmitting;

  const onSubmit = async (data: LoginFormData) => {
    try {
      await loginMutation.mutateAsync(data);
    } catch {
      // O tratamento detalhado já é orquestrado no onError do useLogin
    }
  };

  const registerHref = redirectPath
    ? `/register?redirect=${encodeURIComponent(redirectPath)}`
    : "/register";

  return (
    <div
      className={`w-full max-w-md rounded-card border border-border bg-surface-dark p-6 sm:p-8 shadow-card ${className}`}
    >
      <div className="mb-6 space-y-1.5 text-center">
        <h2 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
          Entrar no Marketplace
        </h2>
        <p className="text-xs text-text-muted sm:text-sm">
          Insira suas credenciais para gerenciar seus NFTs e transações.
        </p>
      </div>

      <form
        onSubmit={handleSubmit(onSubmit)}
        noValidate
        className="space-y-4"
        aria-label="Formulário de Login"
      >
        {errors.root && (
          <div
            id="login-global-error"
            role="alert"
            className="rounded-button border border-error/30 bg-error/10 p-3 text-xs sm:text-sm text-error flex items-start gap-2"
          >
            <span>{errors.root.message}</span>
          </div>
        )}

        {/* Campo E-mail */}
        <div className="space-y-1.5">
          <label
            htmlFor="login-email"
            className="block text-xs font-semibold uppercase tracking-wider text-text-muted"
          >
            E-mail
          </label>
          <Input
            id="login-email"
            type="email"
            autoComplete="email"
            placeholder="exemplo@junglegaming.com"
            disabled={isPending}
            aria-invalid={errors.email ? "true" : "false"}
            aria-describedby={errors.email ? "login-email-error" : undefined}
            {...register("email")}
          />
          {errors.email && (
            <p
              id="login-email-error"
              role="alert"
              className="text-xs text-error font-medium"
            >
              {errors.email.message}
            </p>
          )}
        </div>

        {/* Campo Senha */}
        <div className="space-y-1.5">
          <label
            htmlFor="login-password"
            className="block text-xs font-semibold uppercase tracking-wider text-text-muted"
          >
            Senha
          </label>
          <Input
            id="login-password"
            type="password"
            autoComplete="current-password"
            placeholder="••••••••"
            disabled={isPending}
            aria-invalid={errors.password ? "true" : "false"}
            aria-describedby={errors.password ? "login-password-error" : undefined}
            {...register("password")}
          />
          {errors.password && (
            <p
              id="login-password-error"
              role="alert"
              className="text-xs text-error font-medium"
            >
              {errors.password.message}
            </p>
          )}
        </div>

        {/* Botão de Submissão */}
        <Button
          type="submit"
          className="w-full mt-2"
          disabled={isPending}
          aria-busy={isPending}
        >
          {isPending ? (
            <span className="flex items-center justify-center gap-2">
              <span
                className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent"
                aria-hidden="true"
              />
              <span>Entrando...</span>
            </span>
          ) : (
            "Entrar"
          )}
        </Button>

        {/* Link para Registro */}
        <div className="pt-2 text-center text-xs text-text-muted">
          Não tem uma conta?{" "}
          <a
            href={registerHref}
            className="font-medium text-primary hover:underline hover:text-primary-dark transition-colors"
          >
            Cadastre-se
          </a>
        </div>
      </form>
    </div>
  );
}

export default LoginForm;
