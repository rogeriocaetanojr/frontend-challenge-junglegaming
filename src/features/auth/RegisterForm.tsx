/**
 * Formulário Acessível de Cadastro (RegisterForm).
 *
 * Integrado ao react-hook-form e validação Zod.
 * Totalmente compatível com WCAG 2.1 AA:
 * - Rótulos semânticos e identificadores únicos associados via htmlFor.
 * - aria-invalid dinâmico e aria-describedby vinculado às mensagens de erro com role="alert".
 * - Tratamento específico de erro 409 Conflict (email_taken) diretamente no campo de e-mail,
 *   preservando os demais campos preenchidos pelo usuário.
 * - Feedback visual e acessível no botão de submissão contra cliques concorrentes.
 */
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import type { ApiErrorBody } from "@/contracts/common";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ApiError } from "@/lib/http";
import { PasswordInput, SocialAuth } from "./AuthExtras";
import { type RegisterFormData, registerFormSchema } from "./schemas";
import { useRegister } from "./useRegister";

export interface RegisterFormProps {
  redirectPath?: string | null;
  onSuccess?: () => void;
  /** Quando informado (uso em modal), troca de formulário sem navegar. */
  onSwitchForm?: () => void;
  className?: string;
}

export function RegisterForm({
  redirectPath,
  onSuccess,
  onSwitchForm,
  className = "",
}: RegisterFormProps) {
  const {
    register,
    handleSubmit,
    setError,
    setFocus,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerFormSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
    mode: "onBlur",
  });

  const registerMutation = useRegister({
    redirectPath,
    onSuccess: () => {
      onSuccess?.();
    },
    onError: (err: unknown) => {
      if (err instanceof ApiError) {
        const details = err.details as ApiErrorBody | undefined;
        // Tratamento específico de erro 409 (e-mail já cadastrado)
        if (err.statusCode === 409 || details?.code === "email_taken") {
          setError(
            "email",
            {
              type: "server",
              message:
                details?.message ||
                "Este endereço de e-mail já está cadastrado no marketplace.",
            },
            { shouldFocus: true },
          );
          setFocus("email");
          if (typeof document !== "undefined") {
            setTimeout(() => {
              document.getElementById("register-email")?.focus();
            }, 0);
          }
        } else if (details?.fieldErrors) {
          for (const [field, messages] of Object.entries(details.fieldErrors)) {
            if (
              field === "name" ||
              field === "email" ||
              field === "password" ||
              field === "confirmPassword"
            ) {
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
              "Não foi possível concluir o cadastro. Verifique os dados informados.",
          });
        }
      } else {
        setError("root", {
          type: "server",
          message:
            "Ocorreu um erro inesperado ao tentar se cadastrar. Tente novamente mais tarde.",
        });
      }
    },
  });

  const isPending = registerMutation.isPending || isSubmitting;

  const onSubmit = async (data: RegisterFormData) => {
    try {
      await registerMutation.mutateAsync({
        name: data.name,
        email: data.email,
        password: data.password,
      });
    } catch (err) {
      if (err instanceof ApiError && err.statusCode === 409) {
        setFocus("email");
        if (typeof document !== "undefined") {
          document.getElementById("register-email")?.focus();
        }
      }
    }
  };

  const loginHref = redirectPath
    ? `/login?redirect=${encodeURIComponent(redirectPath)}`
    : "/login";

  return (
    <div
      className={`flex flex-col w-full max-w-md rounded-card border border-border bg-surface-dark p-6 sm:p-8 shadow-card ${className}`}
    >
      <div className="mb-2 text-center max-md:hidden">
        <h2 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
          Criar sua Conta
        </h2>
        <p className="text-xs leading-snug text-text-muted">
          Crie seu perfil de colecionador e conecte uma carteira quando quiser.
        </p>
      </div>

      <form
        onSubmit={handleSubmit(onSubmit)}
        noValidate
        className="flex flex-1 flex-col justify-between gap-2 max-md:justify-start max-md:gap-3 max-md:w-full max-md:mt-8"
        aria-label="Formulário de Cadastro"
      >
        {errors.root && (
          <div
            id="register-global-error"
            role="alert"
            className="rounded-button border border-error/30 bg-error/10 p-3 text-xs sm:text-sm text-error flex items-start gap-2"
          >
            <span>{errors.root.message}</span>
          </div>
        )}

        {/* Campo Nome */}
        <div className="space-y-1">
          <label
            htmlFor="register-name"
            className="block mb-0.5 max-md:sr-only text-[11px] font-mono font-semibold uppercase tracking-wider text-text-muted"
          >
            Nome Completo
          </label>
          <Input
            id="register-name"
            type="text"
            autoComplete="name"
            placeholder="Nome de usuário"
            className="h-9 px-3 py-1.5 text-xs max-md:h-12 max-md:px-4 max-md:text-sm max-md:rounded-xl"
            disabled={isPending}
            aria-invalid={errors.name ? "true" : "false"}
            aria-describedby={errors.name ? "register-name-error" : undefined}
            {...register("name")}
          />
          {errors.name && (
            <p
              id="register-name-error"
              role="alert"
              className="text-xs text-error font-medium"
            >
              {errors.name.message}
            </p>
          )}
        </div>

        {/* Campo E-mail */}
        <div className="space-y-1">
          <label
            htmlFor="register-email"
            className="block mb-0.5 max-md:sr-only text-[11px] font-mono font-semibold uppercase tracking-wider text-text-muted"
          >
            E-mail
          </label>
          <Input
            id="register-email"
            type="email"
            autoComplete="email"
            placeholder="Digite seu e-mail"
            className="h-9 px-3 py-1.5 text-xs max-md:h-12 max-md:px-4 max-md:text-sm max-md:rounded-xl"
            disabled={isPending}
            aria-invalid={errors.email ? "true" : "false"}
            aria-describedby={errors.email ? "register-email-error" : undefined}
            {...register("email")}
          />
          {errors.email && (
            <p
              id="register-email-error"
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
            htmlFor="register-password"
            className="block mb-0.5 max-md:sr-only text-[11px] font-mono font-semibold uppercase tracking-wider text-text-muted"
          >
            Senha
          </label>
          <PasswordInput
            id="register-password"
            autoComplete="new-password"
            placeholder="Senha"
            className="h-9 px-3 py-1.5 text-xs max-md:h-12 max-md:px-4 max-md:text-sm max-md:rounded-xl"
            disabled={isPending}
            aria-invalid={errors.password ? "true" : "false"}
            aria-describedby={errors.password ? "register-password-error" : undefined}
            {...register("password")}
          />
          {errors.password && (
            <p
              id="register-password-error"
              role="alert"
              className="text-xs text-error font-medium"
            >
              {errors.password.message}
            </p>
          )}
        </div>

        {/* Campo Confirmar Senha */}
        <div className="space-y-1">
          <label
            htmlFor="register-confirm-password"
            className="block mb-0.5 max-md:sr-only text-[11px] font-mono font-semibold uppercase tracking-wider text-text-muted"
          >
            Confirmar Senha
          </label>
          <PasswordInput
            id="register-confirm-password"
            autoComplete="new-password"
            placeholder="Confirmar senha"
            className="h-9 px-3 py-1.5 text-xs max-md:h-12 max-md:px-4 max-md:text-sm max-md:rounded-xl"
            disabled={isPending}
            aria-invalid={errors.confirmPassword ? "true" : "false"}
            aria-describedby={
              errors.confirmPassword ? "register-confirm-password-error" : undefined
            }
            {...register("confirmPassword")}
          />
          {errors.confirmPassword && (
            <p
              id="register-confirm-password-error"
              role="alert"
              className="text-xs text-error font-medium"
            >
              {errors.confirmPassword.message}
            </p>
          )}
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
              <span>Criando conta...</span>
            </span>
          ) : (
            <>
              <span className="max-md:hidden">Criar conta</span>
              <span className="hidden max-md:inline">Criar perfil</span>
            </>
          )}
        </Button>

        <SocialAuth compact />

        {/* Link para Login */}
        <div className="text-center text-xs text-text-muted max-md:text-sm">
          Já tem uma conta?{" "}
          <a
            href={loginHref}
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
            <span className="max-md:hidden">Faça login</span>
            <span className="hidden max-md:inline">Entre</span>
          </a>
        </div>
      </form>
    </div>
  );
}

export default RegisterForm;
