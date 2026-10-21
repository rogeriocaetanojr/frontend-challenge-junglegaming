/**
 * Camada de dados de carteiras (API /api/wallets) com TanStack Query.
 */
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import type { Network } from "@/contracts/catalog";
import type { Wallet, WalletRole } from "@/contracts/identity";
import { http } from "@/lib/http";
import { ApiError } from "@/lib/http/types";
import { queryKeys } from "@/lib/query/keys";
import { useAuthStore } from "@/store/auth-store";

export interface CreateWalletInput {
  address: string;
  network?: Network;
  role?: WalletRole;
  label?: string;
}

function errorMessage(error: unknown): string | null {
  if (error instanceof ApiError) return error.message;
  return error instanceof Error ? error.message : null;
}

export function useWallets() {
  const userId = useAuthStore((state) => state.user?.id);
  const queryClient = useQueryClient();
  const key = userId
    ? queryKeys.user(userId).wallets.list()
    : (["wallets", "anonymous"] as const);

  const walletsQuery = useQuery({
    queryKey: key,
    queryFn: () => http.get<Wallet[]>("/wallets"),
    enabled: Boolean(userId),
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: key });

  const addMutation = useMutation({
    mutationFn: (input: CreateWalletInput) => http.post<Wallet>("/wallets", input),
    onSuccess: invalidate,
  });

  const removeMutation = useMutation({
    mutationFn: (id: string) => http.delete<{ success: boolean }>(`/wallets/${id}`),
    onSuccess: invalidate,
  });

  return {
    wallets: walletsQuery.data ?? [],
    isLoading: walletsQuery.isLoading,
    addWallet: (input: CreateWalletInput) => addMutation.mutateAsync(input),
    isAdding: addMutation.isPending,
    addError: errorMessage(addMutation.error),
    removeWallet: (id: string) => removeMutation.mutateAsync(id),
    isRemoving: removeMutation.isPending,
  };
}
