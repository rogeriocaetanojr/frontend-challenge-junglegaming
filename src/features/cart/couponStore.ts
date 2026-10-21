import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export interface CouponState {
  /** Cupom já validado pela API (POST /quotes). Nunca é definido sem validação. */
  couponCode: string | null;
  setCoupon: (code: string) => void;
  clearCoupon: () => void;
}

/**
 * O carrinho em si vive na API (/api/cart). Aqui persiste apenas o cupom aplicado,
 * pois o contrato do carrinho não possui esse campo.
 */
export const useCouponStore = create<CouponState>()(
  persist(
    (set) => ({
      couponCode: null,
      setCoupon: (code) => set({ couponCode: code.trim().toUpperCase() || null }),
      clearCoupon: () => set({ couponCode: null }),
    }),
    {
      name: "kurio-cart-coupon",
      storage: createJSONStorage(() => localStorage),
    },
  ),
);
