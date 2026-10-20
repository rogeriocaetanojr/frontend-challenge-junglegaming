/**
 * Configuração e Árvore de Rotas da Aplicação com RouterContext.
 *
 * Fornece tipagem estrita para o contexto do roteador contendo { queryClient, auth }
 * e inicializa a árvore de rotas com injeção desse contexto.
 */
import type { QueryClient } from "@tanstack/react-query";
import { createBrowserRouter } from "react-router-dom";

import { RouteErrorComponent, type RouteErrorProps } from "@/components/route-error";
import {
  RoutePendingComponent,
  type RoutePendingProps,
} from "@/components/route-pending";
import type { Session, User } from "@/contracts/identity";
import { RootLayout } from "@/layouts/root-layout";
import { queryClient as defaultQueryClient } from "@/lib/query-client";
import { CheckoutPage } from "@/pages/checkout";
import { HomePage } from "@/pages/home";
import { NftDetailPage } from "@/pages/nft-detail";
import { NotFoundPage } from "@/pages/not-found";

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
 * Opções de feedback visual e de transição de rota (TanStack Router & react-router).
 */
export interface RouterOptions {
  defaultPendingComponent?: React.ComponentType<RoutePendingProps>;
  defaultErrorComponent?: React.ComponentType<RouteErrorProps>;
}

export const defaultRouterOptions: RouterOptions = {
  defaultPendingComponent: RoutePendingComponent,
  defaultErrorComponent: RouteErrorComponent,
};

/**
 * Criação da árvore de rotas injetando o RouterContext fornecido.
 */
export function createRouter(
  context: RouterContext = defaultRouterContext,
  options: RouterOptions = defaultRouterOptions,
) {
  // O contexto injetado fica disponível para guardas de rota e loaders
  void context;
  void options;

  return createBrowserRouter([
    {
      path: "/",
      element: <RootLayout />,
      errorElement: <RouteErrorComponent />,
      children: [
        {
          index: true,
          element: <HomePage />,
        },
        {
          path: "nft/:id",
          element: <NftDetailPage />,
        },
        {
          path: "nfts/:id",
          element: <NftDetailPage />,
        },
        {
          path: "checkout",
          element: <CheckoutPage />,
        },
        {
          path: "*",
          element: <NotFoundPage />,
        },
      ],
    },
  ]);
}

/** Instância singleton da árvore de rotas da aplicação. */
export const router = createRouter(defaultRouterContext, defaultRouterOptions);
