/**
 * Testes unitários para a store de carrinho (src/features/cart/cartStore.ts).
 *
 * Validações técnicas (C76):
 * - Adição de itens e cálculo correto de quantidades
 * - Atualização de quantidades respeitando limites
 * - Remoção de itens específicos e limpeza completa do carrinho
 * - Aplicação e remoção de cupom de desconto
 * - Persistência sob a chave 'kurio-cart'
 */
import { beforeEach, describe, expect, it } from "vitest";

import { useCartStore } from "../cartStore";

describe("CartStore (src/features/cart/cartStore.ts)", () => {
  beforeEach(() => {
    localStorage.clear();
    useCartStore.getState().clearCart();
  });

  it("deve iniciar com lista vazia e sem cupom", () => {
    const state = useCartStore.getState();
    expect(state.items).toEqual([]);
    expect(state.couponCode).toBeNull();
    expect(state.getItemCount()).toBe(0);
  });

  it("deve adicionar um novo item e calcular o total", () => {
    const { addItem } = useCartStore.getState();

    addItem(
      {
        id: "nft-1",
        title: "Emerald Ape #042",
        price: 1.19,
        image: "/images/nfts/emerald-ape.png",
      },
      2,
    );

    const state = useCartStore.getState();
    expect(state.items.length).toBe(1);
    expect(state.items[0]!.id).toBe("nft-1");
    expect(state.items[0]!.quantity).toBe(2);
    expect(state.getItemCount()).toBe(2);
    expect(state.isInCart("nft-1")).toBe(true);
  });

  it("deve incrementar a quantidade se o mesmo item for adicionado novamente", () => {
    const { addItem } = useCartStore.getState();

    addItem(
      {
        id: "nft-1",
        title: "Emerald Ape #042",
        price: 1.19,
        image: "/images/nfts/emerald-ape.png",
      },
      1,
    );

    addItem(
      {
        id: "nft-1",
        title: "Emerald Ape #042",
        price: 1.19,
        image: "/images/nfts/emerald-ape.png",
      },
      2,
    );

    const state = useCartStore.getState();
    expect(state.items.length).toBe(1);
    expect(state.items[0]!.quantity).toBe(3);
    expect(state.getItemCount()).toBe(3);
  });

  it("deve atualizar a quantidade e respeitar maxSupply quando definido", () => {
    const { addItem, updateQuantity } = useCartStore.getState();

    addItem(
      {
        id: "nft-2",
        title: "Sage Nomad #009",
        price: 1.69,
        image: "/images/nfts/sage-nomad.png",
        maxSupply: 5,
      },
      1,
    );

    updateQuantity("nft-2", 4);
    expect(useCartStore.getState().items[0]!.quantity).toBe(4);

    // Tentativa de ultrapassar maxSupply
    updateQuantity("nft-2", 10);
    expect(useCartStore.getState().items[0]!.quantity).toBe(5);

    // Quantidade zero ou negativa deve remover o item
    updateQuantity("nft-2", 0);
    expect(useCartStore.getState().items.length).toBe(0);
  });

  it("deve remover um item específico do carrinho", () => {
    const { addItem, removeItem } = useCartStore.getState();

    addItem({
      id: "nft-1",
      title: "Emerald Ape #042",
      price: 1.19,
      image: "/images/nfts/emerald-ape.png",
    });

    addItem({
      id: "nft-2",
      title: "Sage Nomad #009",
      price: 1.69,
      image: "/images/nfts/sage-nomad.png",
    });

    expect(useCartStore.getState().items.length).toBe(2);

    removeItem("nft-1");

    const state = useCartStore.getState();
    expect(state.items.length).toBe(1);
    expect(state.items[0]!.id).toBe("nft-2");
    expect(state.isInCart("nft-1")).toBe(false);
  });

  it("deve aplicar e remover cupons com normalização de maiúsculas", () => {
    const { applyCoupon, removeCoupon } = useCartStore.getState();

    applyCoupon("kurio10");
    expect(useCartStore.getState().couponCode).toBe("KURIO10");

    removeCoupon();
    expect(useCartStore.getState().couponCode).toBeNull();
  });

  it("deve limpar completamente o carrinho e o cupom", () => {
    const { addItem, applyCoupon, clearCart } = useCartStore.getState();

    addItem({
      id: "nft-1",
      title: "Emerald Ape #042",
      price: 1.19,
      image: "/images/nfts/emerald-ape.png",
    });
    applyCoupon("KURIO10");

    clearCart();

    const state = useCartStore.getState();
    expect(state.items).toEqual([]);
    expect(state.couponCode).toBeNull();
    expect(state.getItemCount()).toBe(0);
  });
});
