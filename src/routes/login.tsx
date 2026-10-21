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
      className="flex min-h-[calc(100vh-140px)] w-full items-center justify-center px-4 py-12 sm:px-6 lg:px-8"
      aria-labelledby="login-heading"
    >
      <div className="w-full max-w-md">
        <h1 id="login-heading" className="sr-only">
          Página de Autenticação
        </h1>
        <LoginForm redirectPath={search.redirect} />
      </div>
    </main>
  );
}

export default LoginPage;
