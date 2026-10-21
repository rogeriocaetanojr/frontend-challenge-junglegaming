/**
 * Helper de testes: monta um TanStack Router com histórico em memória para componentes
 * que dependem de <Link>, useNavigate e <Navigate>, substituindo o antigo MemoryRouter.
 */
import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  RouterProvider,
} from "@tanstack/react-router";
import { useState, type ReactNode } from "react";

export interface TestRouteDefinition {
  /** Caminho no formato do TanStack Router (ex.: "/nfts/$id"). */
  path: string;
  element: ReactNode;
}

export interface TestRouterProps {
  /** Conteúdo renderizado na rota "/" quando `routes` não for informado. */
  children?: ReactNode;
  /** Rotas explícitas (úteis para validar redirecionamentos e navegação). */
  routes?: TestRouteDefinition[];
  initialEntries?: string[];
}

function buildTestRouter({ children, routes, initialEntries = ["/"] }: TestRouterProps) {
  const definitions: TestRouteDefinition[] =
    routes && routes.length > 0 ? routes : [{ path: "/", element: children }];

  const rootRoute = createRootRoute();
  const routeTree = rootRoute.addChildren(
    definitions.map(({ path, element }) =>
      createRoute({
        getParentRoute: () => rootRoute,
        path,
        component: () => <>{element}</>,
      }),
    ),
  );

  return createRouter({
    routeTree,
    history: createMemoryHistory({ initialEntries }),
  });
}

export function TestRouter(props: TestRouterProps) {
  const [router] = useState(() => buildTestRouter(props));
  return <RouterProvider router={router as never} />;
}
