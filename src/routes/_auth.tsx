/**
 * Layout de Rota Protegida (_auth) do TanStack Router.
 *
 * Intercepta o carregamento de qualquer rota filha sob o layout _auth,
 * garantindo que o usuário possua uma sessão ativa e autenticada.
 * Caso contrário, captura a rota atual, sanitiza para prevenir Open Redirects
 * e redireciona para a página de login com o parâmetro de retorno seguro.
 */
import { type AnyRoute, createFileRoute, Outlet, redirect } from "@tanstack/react-router";

import { sanitizeReturnTo } from "@/lib/auth/return-to";
import { hasValidSession } from "@/lib/auth/session-store";
import type { RouterContext } from "@/router";

declare module "@tanstack/react-router" {
  interface FileRoutesByPath {
    "/_auth": {
      id: "/_auth";
      path: "";
      fullPath: "";
      preLoaderRoute: typeof Route;
      parentRoute: AnyRoute;
    };
  }
}

export const Route = createFileRoute("/_auth")({
  beforeLoad: ({ context, location }) => {
    const routerContext = context as unknown as Partial<RouterContext>;
    const isAuthenticated = Boolean(
      routerContext?.auth?.isAuthenticated || hasValidSession(),
    );

    if (!isAuthenticated) {
      // Suporta tanto location.search como string ou objeto parsed (searchStr)
      const searchStr =
        typeof location.search === "string"
          ? location.search
          : (location.searchStr ?? "");
      const currentPath = `${location.pathname}${searchStr}`;
      const safePath = sanitizeReturnTo(currentPath, "/");

      throw redirect({
        to: "/login",
        search: { redirect: safePath },
      });
    }
  },
  component: AuthLayout,
});

export function AuthLayout() {
  return <Outlet />;
}

export default AuthLayout;
