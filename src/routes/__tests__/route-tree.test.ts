/**
 * Testes da árvore de rotas real (routeTree.gen.ts): redirecionamentos e proteção.
 */
import { afterEach, describe, expect, it } from "vitest";

import { clearSession } from "@/lib/auth/session-store";
import { createRouter } from "@/router";
import { useAuthStore } from "@/store/auth-store";

describe("Árvore de rotas (TanStack Router)", () => {
  afterEach(() => {
    clearSession();
    useAuthStore.getState().logout();
    window.history.replaceState(null, "", "/");
  });

  it("deve redirecionar /payment para /login preservando o destino em ?redirect", async () => {
    const router = createRouter();
    await router.navigate({ to: "/payment" });

    expect(router.state.location.pathname).toBe("/login");
    expect(router.state.location.search).toMatchObject({ redirect: "/payment" });
  });

  it("deve redirecionar /profile para /login preservando o destino em ?redirect", async () => {
    const router = createRouter();
    await router.navigate({ to: "/profile" });

    expect(router.state.location.pathname).toBe("/login");
    expect(router.state.location.search).toMatchObject({ redirect: "/profile" });
  });

  it("deve manter /cart acessível para visitantes", async () => {
    const router = createRouter();
    await router.navigate({ to: "/cart" });

    expect(router.state.location.pathname).toBe("/cart");
  });

  it("deve redirecionar o alias legado /checkout para a rota autenticada /payment", async () => {
    const router = createRouter();
    await router.navigate({ to: "/checkout" });

    expect(router.state.location.pathname).toBe("/login");
    expect(router.state.location.search).toMatchObject({ redirect: "/payment" });
  });

  it("deve redirecionar o alias legado /nft/$id para /nfts/$id", async () => {
    const router = createRouter();
    await router.navigate({ to: "/nft/$id", params: { id: "7" } });

    expect(router.state.location.pathname).toBe("/nfts/7");
  });

  it("deve validar e sanitizar os search params do catálogo na URL", async () => {
    const router = createRouter();
    await router.navigate({ to: "/", search: { q: "ape", page: 2, sort: "price-asc" } });

    expect(router.state.location.pathname).toBe("/");
    expect(router.state.location.search).toMatchObject({
      q: "ape",
      page: 2,
      sort: "price-asc",
    });
  });
});
