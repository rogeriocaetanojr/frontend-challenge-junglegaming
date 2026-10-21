/**
 * Configuração do Roteador (TanStack Router) com RouterContext.
 *
 * Fornece tipagem estrita para o contexto do roteador contendo { queryClient, auth }
 * e instancia o roteador a partir da árvore de rotas gerada (routeTree.gen.ts).
 */
import type { QueryClient } from "@tanstack/react-query";
import {
  createRouter as createTanStackRouter,
  type ErrorRouteComponent,
  type RouteComponent,
} from "@tanstack/react-router";

import { RouteErrorComponent } from "@/components/route-error";
import { RoutePendingComponent } from "@/components/route-pending";
import type { Session, User } from "@/contracts/identity";
import { queryClient as defaultQueryClient } from "@/lib/query-client";
import { routeTree } from "./routeTree.gen";

/**
 * Estado de autenticação provido no contexto de rotas.
 */
export interface AuthContext {
  user: User | null;
  session: Session | null;
  isAuthenticated: boolean;
  isLoading?: boolean;
}

/**
 * Contexto estrito de injeção de dependências no roteador.
 */
export interface RouterContext {
  queryClient: QueryClient;
  auth: AuthContext;
}

export const defaultRouterContext: RouterContext = {
  queryClient: defaultQueryClient,
  auth: {
    user: null,
    session: null,
    isAuthenticated: false,
    isLoading: false,
  },
};

/**
 * Opções de feedback visual e de transição de rota.
 */
export interface RouterOptions {
  defaultPendingComponent?: RouteComponent;
  defaultErrorComponent?: ErrorRouteComponent;
}

export const defaultRouterOptions: RouterOptions = {
  defaultPendingComponent: RoutePendingComponent,
  defaultErrorComponent: RouteErrorComponent,
};

/**
 * Criação do roteador injetando o RouterContext fornecido.
 * O contexto fica disponível para guardas de rota (beforeLoad) e loaders.
 */
export function createRouter(
  context: RouterContext = defaultRouterContext,
  options: RouterOptions = defaultRouterOptions,
) {
  return createTanStackRouter({
    routeTree,
    context,
    defaultPreload: "intent",
    ...options,
  });
}

/** Instância singleton do roteador da aplicação. */
export const router = createRouter(defaultRouterContext, defaultRouterOptions);

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}
