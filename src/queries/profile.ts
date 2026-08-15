import { useQuery } from "@tanstack/react-query";
import { getUserProfile, getUserProfileByUsername } from "@/lib/profile";
import { queryKeys } from "@/queries/keys";

export function useUserProfileQuery(
  userId: string | undefined,
  options?: { enabled?: boolean },
) {
  return useQuery({
    queryKey: queryKeys.userProfile(userId ?? ""),
    queryFn: async () => {
      const { data, error } = await getUserProfile(userId!);
      if (error) throw new Error(error);
      return data;
    },
    enabled: (options?.enabled ?? true) && !!userId,
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
