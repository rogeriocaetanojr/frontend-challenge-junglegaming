/**
 * Rota de Login (/login) com TanStack Router.
 *
 * Valida o parâmetro de busca ?redirect contra ataques de Open Redirect
 * e redireciona usuários já autenticados de volta para sua rota de destino
 * ou para a página inicial (/).
 */
import { createFileRoute, redirect } from "@tanstack/react-router";

import { LoginForm } from "@/features/auth/LoginForm";
import { sanitizeReturnTo } from "@/lib/auth/return-to";
import { hasValidSession } from "@/lib/auth/session-store";
import type { RouterContext } from "@/router";

export interface LoginSearchParams {
  redirect?: string;
}

export const Route = createFileRoute("/login")({
  validateSearch: (search: Record<string, unknown>): LoginSearchParams => {
    const rawRedirect = typeof search.redirect === "string" ? search.redirect : undefined;

    return {
      redirect: rawRedirect ? sanitizeReturnTo(rawRedirect, "/") : undefined,
    };
  },
  beforeLoad: ({ context, search }) => {
    const routerContext = context as unknown as Partial<RouterContext>;
    const isAuthenticated = Boolean(
      routerContext?.auth?.isAuthenticated || hasValidSession(),
    );

    if (isAuthenticated) {
      const safePath = sanitizeReturnTo(search?.redirect, "/");
      throw redirect({
        // Caminho já sanitizado por sanitizeReturnTo (somente caminhos locais)
        to: safePath as never,
      });
    }
  },
  component: LoginPage,
});

export function LoginPage() {
  const search = Route.useSearch();

  return (
    <main
      className="flex min-h-[calc(100vh-140px)] w-full items-center justify-center px-4 py-12 sm:px-6 lg:px-8 max-md:fixed max-md:inset-0 max-md:z-50 max-md:min-h-0 max-md:h-[100dvh] max-md:flex-col max-md:items-stretch max-md:justify-start max-md:overflow-hidden max-md:bg-[#140D0A] max-md:px-6 max-md:pt-6 max-md:pb-3 max-md:font-mono max-md:text-[#F5F1EB]"
      aria-labelledby="login-heading"
    >
      <h1 id="login-heading" className="sr-only">
        Página de Autenticação
      </h1>

      {/* Mobile: réplica fiel da casca interna do AuthModal (logo + título + LoginForm flat) */}
      <p
        className="md:hidden mt-6 mb-5 text-center text-[26px] font-bold tracking-[0.18em] text-[#F5F1EB] select-none"
        aria-hidden="true"
      >
        KURIO
      </p>
      <h2
        className="hidden max-md:flex w-full justify-center items-center text-center text-base font-bold text-[#F5F1EB] mt-5 mb-1 whitespace-nowrap"
        aria-live="polite"
      >
        Entrar
      </h2>

      <div className="w-full max-w-md max-md:max-w-none max-md:flex-1 max-md:min-h-0">
        <LoginForm
          redirectPath={search.redirect}
          className="max-md:flex-1 max-md:min-h-0 max-md:max-w-none max-md:border-0 max-md:bg-transparent max-md:p-0 max-md:shadow-none max-md:[&_h2]:hidden"
        />
      </div>
    </main>
  );
}

export default LoginPage;
