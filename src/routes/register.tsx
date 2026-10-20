/**
 * Rota de Cadastro (/register) com TanStack Router.
 *
 * Valida o parâmetro de busca ?redirect contra ataques de Open Redirect
 * e redireciona usuários já autenticados de volta para sua rota de destino
 * ou para a página inicial (/).
 */
import { type AnyRoute, createFileRoute, redirect } from "@tanstack/react-router";

import { RegisterForm } from "@/features/auth/RegisterForm";
import { sanitizeReturnTo } from "@/lib/auth/return-to";
import { hasValidSession } from "@/lib/auth/session-store";
import type { RouterContext } from "@/router";

declare module "@tanstack/react-router" {
  interface FileRoutesByPath {
    "/register": {
      id: "/register";
      path: "/register";
      fullPath: "/register";
      preLoaderRoute: typeof Route;
      parentRoute: AnyRoute;
    };
  }
}

export interface RegisterSearchParams {
  redirect?: string;
}

export const Route = createFileRoute("/register")({
  validateSearch: (search: Record<string, unknown>): RegisterSearchParams => {
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
        to: safePath,
      });
    }
  },
  component: RegisterPage,
});

export function RegisterPage() {
  const search = Route.useSearch();

  return (
    <main
      className="flex min-h-[calc(100vh-140px)] w-full items-center justify-center px-4 py-12 sm:px-6 lg:px-8"
      aria-labelledby="register-heading"
    >
      <div className="w-full max-w-md">
        <h1 id="register-heading" className="sr-only">
          Página de Cadastro
        </h1>
        <RegisterForm redirectPath={search.redirect} />
      </div>
    </main>
  );
}

export default RegisterPage;
