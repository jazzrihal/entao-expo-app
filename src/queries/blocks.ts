import { useMutation, useQueryClient } from "@tanstack/react-query";
import { blockUser } from "@/lib/blocks";
import { queryKeys } from "@/queries/keys";

export function useBlockUserMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (blockedId: string) =>
      blockUser(blockedId).then((result) => {
        if (result.error) throw new Error(result.error);
      }),
    onSuccess: (_data, blockedId) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.friends() });
      queryClient.invalidateQueries({
        queryKey: queryKeys.friendRequests.incoming(),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.friendRequests.outgoing(),
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.friendsPosts() });
      queryClient.invalidateQueries({ queryKey: ["profile-search"] });
      queryClient.invalidateQueries({ queryKey: ["feed"] });
      queryClient.invalidateQueries({
        queryKey: queryKeys.userProfile(blockedId),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.profileFeed(blockedId),
      });
      queryClient.invalidateQueries({
        queryKey: ["relationship-status", blockedId],
      });
    },
  });
}
