import { useMutation } from "@tanstack/react-query";
import { reportPost, reportProfile, type ReportReason } from "@/lib/reports";

export function useReportPostMutation() {
  return useMutation({
    mutationFn: ({
      postId,
      authorId,
      reason,
      details,
    }: {
      postId: string;
      authorId: string;
      reason: ReportReason;
      details?: string;
    }) =>
      reportPost(postId, authorId, reason, details).then((result) => {
        if (result.error) throw new Error(result.error);
      }),
  });
}

export function useReportProfileMutation() {
  return useMutation({
    mutationFn: ({
      userId,
      reason,
      details,
    }: {
      userId: string;
      reason: ReportReason;
      details?: string;
    }) =>
      reportProfile(userId, reason, details).then((result) => {
        if (result.error) throw new Error(result.error);
      }),
  });
}
