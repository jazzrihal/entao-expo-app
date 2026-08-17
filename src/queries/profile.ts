import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/context/auth";
import {
  cancelAccountDeletion,
  getAccountDeletionRequest,
  getUserProfile,
  getUserProfileByUsername,
  requestAccountDeletion,
  updateUserProfile,
  type UpdateUserProfileInput,
} from "@/lib/profile";
import { assertOk } from "@/lib/result";
import { queryKeys } from "@/queries/keys";

export function useUserProfileQuery(
  userId: string | undefined,
  options?: { enabled?: boolean; staleTime?: number },
) {
  return useQuery({
    queryKey: queryKeys.userProfile(userId ?? ""),
    queryFn: async () => {
      const { data, error } = await getUserProfile(userId!);
      if (error) throw new Error(error);
      return data;
    },
    enabled: (options?.enabled ?? true) && !!userId,
    staleTime: options?.staleTime,
  });
}

export function useUserProfileByUsernameQuery(
  username: string | undefined,
  options?: { enabled?: boolean },
) {
  return useQuery({
    queryKey: queryKeys.userProfileByUsername(username ?? ""),
    queryFn: async () => {
      const { data, error } = await getUserProfileByUsername(username!);
      if (error) throw new Error(error);
      if (!data) throw new Error("Profile not found");
      return data;
    },
    enabled: (options?.enabled ?? true) && !!username,
  });
}

export function useUpdateUserProfileMutation() {
  const queryClient = useQueryClient();
  const { session } = useAuth();
  const userId = session?.user.id;

  return useMutation({
    mutationFn: async (updates: UpdateUserProfileInput) => {
      if (!userId) throw new Error("Not signed in");
      return assertOk(await updateUserProfile(userId, updates));
    },
    onSuccess: () => {
      if (!userId) return;
      void queryClient.invalidateQueries({
        queryKey: queryKeys.userProfile(userId),
      });
    },
  });
}

export function useAccountDeletionRequestQuery(userId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.accountDeletionRequest(userId ?? ""),
    queryFn: async () => {
      const { data, error } = await getAccountDeletionRequest(userId!);
      if (error) throw new Error(error);
      return data;
    },
    enabled: !!userId,
  });
}

export function useRequestAccountDeletionMutation() {
  const queryClient = useQueryClient();
  const { session } = useAuth();
  const userId = session?.user.id;

  return useMutation({
    mutationFn: async () => {
      if (!userId) throw new Error("Not signed in");
      return assertOk(await requestAccountDeletion());
    },
    onSuccess: () => {
      if (!userId) return;
      void queryClient.invalidateQueries({
        queryKey: queryKeys.accountDeletionRequest(userId),
      });
    },
  });
}

export function useCancelAccountDeletionMutation() {
  const queryClient = useQueryClient();
  const { session } = useAuth();
  const userId = session?.user.id;

  return useMutation({
    mutationFn: async () => {
      if (!userId) throw new Error("Not signed in");
      const { error } = await cancelAccountDeletion();
      if (error) throw new Error(error);
    },
    onSuccess: () => {
      if (!userId) return;
      void queryClient.invalidateQueries({
        queryKey: queryKeys.accountDeletionRequest(userId),
      });
    },
  });
}
