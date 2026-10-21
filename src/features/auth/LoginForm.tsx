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
import { PasswordInput, SocialAuth } from "./AuthExtras";
import { type LoginFormData, loginFormSchema } from "./schemas";
import { useLogin } from "./useLogin";

export interface LoginFormProps {
  redirectPath?: string | null;
  onSuccess?: () => void;
  /** Quando informado (uso em modal), troca de formulário sem navegar. */
  onSwitchForm?: () => void;
  className?: string;
}

export function LoginForm({
  redirectPath,
  onSuccess,
  onSwitchForm,
  className = "",
}: LoginFormProps) {
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
      className={`flex flex-col w-full max-w-md rounded-card border border-border bg-surface-dark p-6 sm:p-8 shadow-card ${className}`}
    >
      <div className="mb-2 text-center max-md:hidden">
        <h2 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
          Entrar no Marketplace
        </h2>
        <p className="text-xs leading-snug text-text-muted">
          Entre para gerenciar sua carteira, coleção e perfil de criador.
        </p>
      </div>

      <form
        onSubmit={handleSubmit(onSubmit)}
        noValidate
        className="flex flex-1 flex-col justify-between gap-3 max-md:justify-start max-md:gap-2.5 max-md:w-full max-md:mt-3"
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
        <div className="space-y-1">
          <label
            htmlFor="login-email"
            className="block mb-0.5 max-md:sr-only text-[11px] font-mono font-semibold uppercase tracking-wider text-text-muted"
          >
            E-mail
          </label>
          <Input
            id="login-email"
            type="email"
            autoComplete="email"
            placeholder="Digite seu e-mail"
            className="h-9 px-3 py-1.5 text-xs max-md:h-12 max-md:px-4 max-md:text-sm max-md:rounded-xl"
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
        <div className="space-y-1">
          <label
            htmlFor="login-password"
            className="block mb-0.5 max-md:sr-only text-[11px] font-mono font-semibold uppercase tracking-wider text-text-muted"
          >
            Senha
          </label>
          <PasswordInput
            id="login-password"
            autoComplete="current-password"
            placeholder="Senha"
            className="h-9 px-3 py-1.5 text-xs max-md:h-12 max-md:px-4 max-md:text-sm max-md:rounded-xl"
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
          <div className="text-right">
            <button
              type="button"
              className="text-xs text-primary hover:underline cursor-pointer"
            >
              Esqueceu a senha?
            </button>
          </div>
        </div>

        {/* Botão de Submissão */}
        <Button
          type="submit"
          className="w-full h-9 mt-1 text-xs font-semibold max-md:h-14 max-md:py-4 max-md:text-base max-md:font-bold max-md:rounded-xl"
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

        <SocialAuth compact />

        {/* Link para Registro */}
        <div className="text-center text-xs text-text-muted max-md:text-sm">
          <span className="max-md:hidden">Não tem uma conta? </span>
          <span className="hidden max-md:inline">Novo na Kurio? </span>
          <a
            href={registerHref}
            onClick={
              onSwitchForm
                ? (event) => {
                    event.preventDefault();
                    onSwitchForm();
                  }
                : undefined
            }
            className="font-medium text-primary hover:underline hover:text-primary-dark transition-colors"
          >
            <span className="max-md:hidden">Cadastre-se</span>
            <span className="hidden max-md:inline">Crie uma conta</span>
          </a>
        </div>
      </form>
    </div>
  );
}

export default LoginForm;
