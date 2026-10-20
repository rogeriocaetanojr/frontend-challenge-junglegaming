import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import BigNumber from "bignumber.js";

import { calculateTotalEth, formatUsd } from "@/lib/formatters";

export const DEFAULT_ETH_USD_RATE = 3200;

export interface CartItem {
  id: string;
  title: string;
  price: number;
  image: string;
  quantity: number;
  maxSupply?: number;
  // Campos de compatibilidade com versões anteriores
  name?: string;
  collection?: string;
  priceEth?: string | number;
  creator?: string;
}

export interface CartStoreState {
  items: CartItem[];
  couponCode: string | null;
  addItem: (
    item:
      | CartItem
      | {
          id: string;
          name?: string;
          title?: string;
          collection?: string;
          price?: number;
          priceEth?: string | number;
          image: string;
          creator?: string;
          quantity?: number;
          maxSupply?: number;
        },
    quantity?: number,
  ) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  applyCoupon: (code: string) => void;
  removeCoupon: () => void;
  isInCart: (id: string) => boolean;
  getItemCount: () => number;
  getTotalEth: () => string;
  getTotalUsd: (ethRate?: number) => string;
}

export const INITIAL_CART_ITEMS: CartItem[] = [
  {
    id: "nft-1",
    title: "Emerald Ape #042",
    name: "Emerald Ape #042",
    price: 1.19,
    priceEth: "1.19",
    image: "/images/nfts/emerald-ape.png",
    quantity: 2,
    collection: "Genesis Apes",
  },
  {
    id: "nft-5",
    title: "Violet Nomad #314",
    name: "Violet Nomad #314",
    price: 1.39,
    priceEth: "1.39",
    image: "/images/nfts/sage-nomad.png",
    quantity: 6,
    collection: "Genesis Apes",
  },
  {
    id: "nft-6",
    title: "Ivory Baron #088",
    name: "Ivory Baron #088",
    price: 1.79,
    priceEth: "1.79",
    image: "/images/nfts/noct-vessel.png",
    quantity: 9,
    collection: "Genesis Apes",
  },
];

export const useCartStore = create<CartStoreState>()(
  persist(
    (set, get) => ({
      items: INITIAL_CART_ITEMS,
      couponCode: null,

      addItem: (itemInput, quantity = 1) => {
        const { items } = get();
        const rawPrice =
          itemInput.price !== undefined
            ? itemInput.price
            : itemInput.priceEth !== undefined
              ? Number(itemInput.priceEth)
              : 0;

        const effectiveTitle = itemInput.title || itemInput.name || "Item sem título";
        const requestedQuantity =
          quantity > 0
            ? quantity
            : itemInput.quantity && itemInput.quantity > 0
              ? itemInput.quantity
              : 1;

        const existingIndex = items.findIndex((i) => i.id === itemInput.id);

        if (existingIndex > -1 && items[existingIndex]) {
          const currentItem = items[existingIndex]!;
          const newQty = currentItem.quantity + requestedQuantity;
          const cappedQty =
            currentItem.maxSupply !== undefined
              ? Math.min(newQty, currentItem.maxSupply)
              : newQty;

          const updatedItems = [...items];
          updatedItems[existingIndex] = {
            ...currentItem,
            quantity: cappedQty,
          };
          set({ items: updatedItems });
          return;
        }

        const newItem: CartItem = {
          id: itemInput.id,
          title: effectiveTitle,
          price: rawPrice,
          image: itemInput.image,
          quantity:
            itemInput.maxSupply !== undefined
              ? Math.min(requestedQuantity, itemInput.maxSupply)
              : requestedQuantity,
          maxSupply: itemInput.maxSupply,
          name: effectiveTitle,
          collection: itemInput.collection || "Genesis Apes",
          priceEth: String(rawPrice),
          creator: itemInput.creator || "Kurio Studios",
        };

        set({ items: [...items, newItem] });
      },

      removeItem: (id: string) => {
        set((state) => ({
          items: state.items.filter((item) => item.id !== id),
        }));
      },

      updateQuantity: (id: string, quantity: number) => {
        if (quantity <= 0) {
          get().removeItem(id);
          return;
        }

        set((state) => ({
          items: state.items.map((item) => {
            if (item.id !== id) return item;
            const cappedQuantity =
              item.maxSupply !== undefined
                ? Math.min(quantity, item.maxSupply)
                : quantity;
            return {
              ...item,
              quantity: cappedQuantity,
            };
          }),
        }));
      },

      clearCart: () => {
        set({ items: [], couponCode: null });
      },

      applyCoupon: (code: string) => {
        const normalized = code.trim().toUpperCase();
        set({ couponCode: normalized || null });
      },

      removeCoupon: () => {
        set({ couponCode: null });
      },

      isInCart: (id: string) => {
        return get().items.some((item) => item.id === id);
      },

      getItemCount: () => {
        return get().items.reduce((total, item) => total + item.quantity, 0);
      },

      getTotalEth: () => {
        const { items } = get();
        return calculateTotalEth(
          items.map((item) => ({
            price: (item.price * item.quantity).toString(),
          })),
        );
      },

      getTotalUsd: (ethRate = DEFAULT_ETH_USD_RATE) => {
        const totalEthStr = get().getTotalEth();
        const totalUsdValue = new BigNumber(totalEthStr).multipliedBy(ethRate);
        return formatUsd(totalUsdValue.toString(10));
      },
    }),
    {
      name: "kurio-cart",
      storage: createJSONStorage(() => localStorage),
    },
  ),
);

// Alias para importações diretas solicitadas no escopo
export default useCartStore;
