import { createFileRoute, redirect } from "@tanstack/react-router";

import { CheckoutPage } from "@/features/checkout/CheckoutPage";
import { useCartStore } from "@/store/cart-store";

declare module "@tanstack/react-router" {
  interface FileRoutesByPath {
    "/checkout": {
      id: "/checkout";
      path: "/checkout";
      fullPath: "/checkout";
      preLoaderRoute: typeof Route;
      parentRoute: unknown;
    };
  }
}

export const Route = createFileRoute("/checkout")({
  beforeLoad: () => {
    const items = useCartStore.getState().items;
    if (!items || items.length === 0) {
      throw redirect({
        to: "/cart",
      });
    }
  },
  component: CheckoutPage,
});

export default Route;
