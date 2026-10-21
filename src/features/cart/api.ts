/**
 * Camada de dados do carrinho (API /api/cart + cotação /api/quotes) com TanStack Query.
 *
 * - Visitante: identificado por X-Guest-Id (injetado pelo cliente HTTP); usuário: Bearer.
 * - Valores em ETH trafegam como strings decimais; cálculos usam @/lib/money.
 * - Chaves de cache isoladas por usuário (["user", id, "cart"]) ou por visitante.
 */
import {
  keepPreviousData,
  queryOptions,
  useMutation,
  useQueries,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import type { Cart, CartLine, Quote } from "@/contracts/commerce";
import type { EthString } from "@/contracts/common";
import { nftDetailQueryOptions } from "@/features/nft-details/queries";
import { getGuestId } from "@/lib/auth/guest-id";
import { getSession } from "@/lib/auth/session-store";
import { http } from "@/lib/http";
import { addEth, asEthString, mulEthByInt } from "@/lib/money";
import { queryKeys } from "@/lib/query/keys";
import { useAuthStore } from "@/store/auth-store";
import { useCouponStore } from "./couponStore";

/** Linha do carrinho enriquecida com os dados do NFT/edição para exibição. */
export interface CartItem {
  /** Identificador do NFT (nftId). */
  id: string;
  editionId: string;
  title: string;
  image: string;
  collection: string;
  /** Preço unitário da edição, como string decimal de ETH. */
  price: EthString;
  quantity: number;
  /** Disponibilidade atual da edição (limite de quantidade). */
  maxSupply: number;
}

export function cartQueryKey(userId?: string | null) {
  return userId
    ? queryKeys.user(userId).cart()
    : (["public", "cart", getGuestId()] as const);
}

export function cartQueryOptions(userId?: string | null) {
  return queryOptions({
    queryKey: cartQueryKey(userId),
    queryFn: () => http.get<Cart>("/cart"),
    staleTime: 15_000,
  });
}

/** Usuário dono do carrinho atual (store reativa com fallback na sessão persistida). */
function useCartUserId(): string | null {
  const storeUserId = useAuthStore((state) => state.user?.id);
  return storeUserId ?? getSession()?.userId ?? null;
}

/** Soma de valores em ETH sem ponto flutuante. */
export function sumEth(values: EthString[]): EthString {
  return values.reduce((acc, value) => addEth(acc, value), asEthString("0"));
}

export function lineTotal(item: Pick<CartItem, "price" | "quantity">): EthString {
  return mulEthByInt(item.price, item.quantity);
}

/** Quantidade de linhas do carrinho (usado no badge do cabeçalho). */
export function useCartCount(): number {
  const userId = useCartUserId();
  const { data } = useQuery({
    ...cartQueryOptions(userId),
    select: (cart) => cart.lines.length,
  });
  return data ?? 0;
}

interface LineInput {
  nftId: string;
  editionId: string;
  quantity: number;
}

function errorMessage(error: unknown): string | null {
  return error instanceof Error ? error.message : null;
}

/** Carrinho do requisitante (visitante ou autenticado) com mutações da API. */
export function useCart() {
  const queryClient = useQueryClient();
  const userId = useCartUserId();
  const options = cartQueryOptions(userId);
  const key = options.queryKey;
  const cartQuery = useQuery(options);

  const lines: CartLine[] = cartQuery.data?.lines ?? [];
  const details = useQueries({
    queries: lines.map((line) => nftDetailQueryOptions(line.nftId)),
  });

  const items: CartItem[] = lines.flatMap((line, index) => {
    const nft = details[index]?.data;
    const edition = nft?.editions.find((e) => e.id === line.editionId);
    if (!nft || !edition) return [];
    return [
      {
        id: line.nftId,
        editionId: line.editionId,
        title: nft.title,
        image: nft.images[0]?.url ?? "/images/nfts/emerald-ape.png",
        collection: nft.collection.name,
        price: edition.price,
        quantity: line.quantity,
        maxSupply: edition.available,
      },
    ];
  });

  const isLoading =
    cartQuery.isLoading || (lines.length > 0 && details.some((d) => d.isLoading));

  const setCart = (cart: Cart) => queryClient.setQueryData(key, cart);

  const addMutation = useMutation({
    mutationFn: (input: LineInput) => http.post<Cart>("/cart/items", input),
    onSuccess: setCart,
  });

  // Atualização otimista de quantidade/remoção com rollback em caso de falha
  const quantityMutation = useMutation({
    mutationFn: (input: LineInput) =>
      input.quantity <= 0
        ? http.delete<Cart>("/cart/items", {
            params: { nftId: input.nftId, editionId: input.editionId },
          })
        : http.patch<Cart>("/cart/items", input),
    onMutate: async (input) => {
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<Cart>(key);
      if (previous) {
        const nextLines = previous.lines.flatMap((line) => {
          if (line.nftId !== input.nftId || line.editionId !== input.editionId) {
            return [line];
          }
          return input.quantity <= 0 ? [] : [{ ...line, quantity: input.quantity }];
        });
        queryClient.setQueryData<Cart>(key, { ...previous, lines: nextLines });
      }
      return { previous };
    },
    onError: (_error, _input, context) => {
      if (context?.previous) {
        queryClient.setQueryData(key, context.previous);
      }
    },
    onSuccess: setCart,
  });

  const clearMutation = useMutation({
    mutationFn: () => http.delete<Cart>("/cart/clear"),
    onSuccess: (cart) => {
      setCart(cart);
      useCouponStore.getState().clearCoupon();
    },
  });

  return {
    items,
    count: lines.length,
    version: cartQuery.data?.version ?? 0,
    isLoading,
    isError: cartQuery.isError,
    /** Última mensagem de erro de mutação (ex.: conflito de disponibilidade). */
    error: errorMessage(addMutation.error) ?? errorMessage(quantityMutation.error),
    addItem: (input: LineInput) => addMutation.mutateAsync(input),
    setQuantity: (item: Pick<CartItem, "id" | "editionId">, quantity: number) =>
      quantityMutation.mutateAsync({
        nftId: item.id,
        editionId: item.editionId,
        quantity,
      }),
    removeItem: (item: Pick<CartItem, "id" | "editionId">) =>
      quantityMutation.mutateAsync({
        nftId: item.id,
        editionId: item.editionId,
        quantity: 0,
      }),
    clearCart: () => clearMutation.mutateAsync(),
  };
}

/** Cotação do carrinho atual (preço, cupom, taxa de rede e total) emitida pela API. */
export function useCartQuote() {
  const userId = useCartUserId();
  const couponCode = useCouponStore((state) => state.couponCode);
  const { data: cart } = useQuery(cartQueryOptions(userId));

  return useQuery({
    queryKey: [...cartQueryKey(userId), "quote", cart?.version ?? 0, couponCode],
    queryFn: () => http.post<Quote>("/quotes", { couponCode: couponCode ?? undefined }),
    enabled: (cart?.lines.length ?? 0) > 0,
    staleTime: 10_000,
    placeholderData: keepPreviousData,
  });
}

/** Valida o cupom exclusivamente pela API antes de aplicá-lo. */
export function useApplyCoupon() {
  const setCoupon = useCouponStore((state) => state.setCoupon);

  return useMutation({
    mutationFn: async (code: string): Promise<string> => {
      const normalized = code.trim().toUpperCase();
      const quote = await http.post<Quote>("/quotes", { couponCode: normalized });
      const issue = quote.issues.find(
        (item) => item.type === "coupon_invalid" || item.type === "coupon_expired",
      );
      if (issue) {
        throw new Error(
          issue.type === "coupon_expired"
            ? `Cupom '${normalized}' expirado.`
            : `Cupom '${normalized}' inválido.`,
        );
      }
      return normalized;
    },
    onSuccess: setCoupon,
  });
}
