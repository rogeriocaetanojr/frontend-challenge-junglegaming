/**
 * Rota raiz do TanStack Router.
 *
 * Injeta o RouterContext tipado ({ queryClient, auth }) em todas as rotas,
 * renderiza o layout global e define os fallbacks de 404 e de erro.
 */
import { createRootRouteWithContext } from "@tanstack/react-router";

import { RouteErrorComponent } from "@/components/route-error";
import { RootLayout } from "@/layouts/root-layout";
import { NotFoundPage } from "@/pages/not-found";
import type { RouterContext } from "@/router";

export const Route = createRootRouteWithContext<RouterContext>()({
  component: RootLayout,
  notFoundComponent: NotFoundPage,
  errorComponent: ({ error, reset }) => (
    <RouteErrorComponent error={error} reset={reset} />
  ),
});
