/**
 * Sincronização do carrinho com o ciclo de autenticação:
 * - login/cadastro: mescla o carrinho do visitante (guest_id) no carrinho do usuário;
 * - inicialização com sessão: repete a mesclagem (idempotente no servidor), recuperando
 *   itens de um merge interrompido por refresh/navegação logo após o login;
 * - logout: descarta o cupom aplicado (o cache privado é limpo pela store de auth).
 */
import { getGuestId } from "@/lib/auth/guest-id";
import { authEventBus } from "@/lib/auth/events";
import { http } from "@/lib/http";
import { queryClient } from "@/lib/query-client";
import { useCouponStore } from "./couponStore";

export async function mergeGuestCart(): Promise<void> {
  try {
    await http.post("/cart/merge", { guestCartId: getGuestId() });
  } catch {
    // Falha de merge não deve bloquear o login; o carrinho do usuário segue válido
  } finally {
    await queryClient.invalidateQueries({ queryKey: ["user"] });
    await queryClient.invalidateQueries({ queryKey: ["public", "cart"] });
  }
}

let pendingMerge: Promise<void> | null = null;

/** Permite que guardas de rota aguardem a mesclagem do carrinho após o login. */
export function waitForCartMerge(): Promise<void> {
  return pendingMerge ?? Promise.resolve();
}

function startMerge(): void {
  pendingMerge = mergeGuestCart().finally(() => {
    pendingMerge = null;
  });
}

/**
 * Chamado na inicialização quando há sessão válida. O servidor esvazia o carrinho do
 * visitante ao mesclar, então repetir a chamada nunca duplica itens.
 */
export function resumeGuestCartMerge(): void {
  startMerge();
}

authEventBus.on("auth:login", startMerge);

authEventBus.on("auth:logout", () => {
  useCouponStore.getState().clearCoupon();
});
