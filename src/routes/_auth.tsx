/**
 * Layout de Rota Protegida (_auth) do TanStack Router.
 *
 * Intercepta o carregamento de qualquer rota filha sob o layout _auth,
 * garantindo que o usuário possua uma sessão ativa e autenticada.
 * Caso contrário, captura a rota atual, sanitiza para prevenir Open Redirects
 * e redireciona para a página de login com o parâmetro de retorno seguro.
 */
import { createFileRoute, isRedirect, Outlet, redirect } from "@tanstack/react-router";

import { sessionQueryOptions } from "@/features/auth/queries";
import { sanitizeReturnTo } from "@/lib/auth/return-to";
import { clearSession, hasValidSession } from "@/lib/auth/session-store";
import { queryClient as defaultQueryClient } from "@/lib/query-client";
import type { RouterContext } from "@/router";

export const Route = createFileRoute("/_auth")({
  beforeLoad: async ({ context, location }) => {
    const routerContext = context as unknown as Partial<RouterContext> | undefined;
    const queryClient = routerContext?.queryClient ?? defaultQueryClient;

    const buildRedirect = () => {
      // Suporta tanto location.search como string ou objeto parsed (searchStr)
      const searchStr =
        typeof location.search === "string"
          ? location.search
          : (location.searchStr ?? "");
      const currentPath = `${location.pathname}${searchStr}`;
      const safePath = sanitizeReturnTo(currentPath, "/");

      return redirect({
        to: "/login",
        search: { redirect: safePath },
      });
    };

    // 1. Se já autenticado no contexto em memória com dados do usuário, permite acesso imediato
    if (routerContext?.auth?.isAuthenticated && routerContext.auth.user) {
      return;
    }

    // 2. Se possui sessão válida no storage local, resolve a sessão concorrentemente com TanStack Query
    if (hasValidSession()) {
      try {
        const session = await queryClient.ensureQueryData(sessionQueryOptions());

        if (session?.user) {
          // Hidrata o contexto do roteador com os dados resolvidos da sessão
          if (routerContext?.auth) {
            routerContext.auth.user = session.user;
            routerContext.auth.session = session;
            routerContext.auth.isAuthenticated = true;
          }

          return {
            auth: {
              ...routerContext?.auth,
              user: session.user,
              session,
              isAuthenticated: true,
            },
          };
        } else {
          // Sessão retornou nulo (backend inválido/anônimo): limpa storage e redireciona
          clearSession();
          throw buildRedirect();
        }
      } catch (err: unknown) {
        if (isRedirect(err)) {
          throw err;
        }
        // Falha ao resolver sessão (ex: erro de rede ou 401): limpa storage e redireciona
        clearSession();
        throw buildRedirect();
      }
    }

    // 3. Sem sessão válida em storage nem no contexto
    clearSession();
    throw buildRedirect();
  },
  component: AuthLayout,
});

export function AuthLayout() {
  return <Outlet />;
}

export default AuthLayout;
