import { createFileRoute } from "@tanstack/react-router";

import { CartPage } from "@/features/cart/CartPage";

declare module "@tanstack/react-router" {
  interface FileRoutesByPath {
    "/cart": {
      id: "/cart";
      path: "/cart";
      fullPath: "/cart";
      preLoaderRoute: typeof Route;
      parentRoute: unknown;
    };
  }
}

export const Route = createFileRoute("/cart")({
  component: CartPage,
});

export default Route;
