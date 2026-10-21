/**
 * Camada de dados do perfil (API /api/profile) com TanStack Query.
 */
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import type { PasswordChange, ProfileUpdate, User } from "@/contracts/identity";
import { http } from "@/lib/http";
import { ApiError } from "@/lib/http/types";
import { queryKeys } from "@/lib/query/keys";
import { useAuthStore } from "@/store/auth-store";

function errorMessage(error: unknown): string | null {
  if (error instanceof ApiError) return error.message;
  return error instanceof Error ? error.message : null;
}

export function useProfile() {
  const userId = useAuthStore((state) => state.user?.id);
  const updateUser = useAuthStore((state) => state.updateUser);
  const queryClient = useQueryClient();

  const profileQuery = useQuery({
    queryKey: userId
      ? queryKeys.user(userId).profile()
      : (["profile", "anonymous"] as const),
    queryFn: () => http.get<User>("/profile"),
    enabled: Boolean(userId),
  });

  const updateMutation = useMutation({
    mutationFn: (input: Partial<ProfileUpdate>) => http.patch<User>("/profile", input),
    onSuccess: (user) => {
      updateUser(user);
      if (userId) queryClient.setQueryData(queryKeys.user(userId).profile(), user);
    },
  });

  const avatarMutation = useMutation({
    mutationFn: (avatar: string) =>
      http.post<{ avatarUrl: string; user: User }>("/profile/avatar", { avatar }),
    onSuccess: ({ user }) => {
      updateUser(user);
      if (userId) queryClient.setQueryData(queryKeys.user(userId).profile(), user);
    },
  });

  const passwordMutation = useMutation({
    mutationFn: (input: PasswordChange) =>
      http.post<{ success: boolean; message: string }>("/profile/password", input),
  });

  return {
    profile: profileQuery.data,
    isLoading: profileQuery.isLoading,
    updateProfile: (input: Partial<ProfileUpdate>) => updateMutation.mutateAsync(input),
    isUpdating: updateMutation.isPending,
    updateError: errorMessage(updateMutation.error),
    updateAvatar: (avatar: string) => avatarMutation.mutateAsync(avatar),
    isUpdatingAvatar: avatarMutation.isPending,
    avatarError: errorMessage(avatarMutation.error),
    changePassword: (input: PasswordChange) => passwordMutation.mutateAsync(input),
    isChangingPassword: passwordMutation.isPending,
    passwordError: errorMessage(passwordMutation.error),
  };
}
