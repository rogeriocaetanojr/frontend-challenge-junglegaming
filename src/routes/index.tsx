import { createBrowserRouter } from "react-router-dom";

import { RootLayout } from "@/layouts/root-layout";
import { CheckoutPage } from "@/pages/checkout";
import { HomePage } from "@/pages/home";
import { NftDetailPage } from "@/pages/nft-detail";
import { NotFoundPage } from "@/pages/not-found";

/**
 * Definição centralizada do roteamento declarativo da aplicação utilizando
 * o React Router DOM v7 com suporte a layouts aninhados e rotas dinâmicas.
 */
export const router = createBrowserRouter([
  {
    path: "/",
    element: <RootLayout />,
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
