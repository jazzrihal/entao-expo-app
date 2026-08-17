import { supabase } from "@/lib/supabase";
import type { Database } from "@/lib/database.types";

export type ReportReason = Database["public"]["Enums"]["report_reason"];

export const REPORT_REASON_OPTIONS: { value: ReportReason; label: string }[] = [
  { value: "spam", label: "Spam" },
  { value: "harassment", label: "Harassment" },
  { value: "hate_speech", label: "Hate speech" },
  { value: "nudity_or_sexual_content", label: "Nudity or sexual content" },
  { value: "violence", label: "Violence" },
  { value: "self_harm", label: "Self-harm" },
  { value: "misinformation", label: "Misinformation" },
  { value: "impersonation", label: "Impersonation" },
  { value: "intellectual_property", label: "Intellectual property" },
  { value: "other", label: "Other" },
];

const DETAILS_MAX_LENGTH = 1000;
const DUPLICATE_REPORT_MESSAGE = "You've already reported this.";

function normalizeDetails(details?: string): string | null {
  const trimmed = details?.trim();
  if (!trimmed) {
    return null;
  }
  return trimmed.slice(0, DETAILS_MAX_LENGTH);
}

function mapReportError(
  error: { code?: string; message: string } | null,
): string | null {
  if (!error) {
    return null;
  }
  if (error.code === "23505") {
    return DUPLICATE_REPORT_MESSAGE;
  }
  return error.message;
}

export async function reportPost(
  postId: string,
  authorId: string,
  reason: ReportReason,
  details?: string,
): Promise<{ error: string | null }> {
  const { error } = await supabase.from("content_reports").insert({
    target_type: "post",
    post_id: postId,
    reported_user_id: authorId,
    reason,
    details: normalizeDetails(details),
  });
  return { error: mapReportError(error) };
}

export async function reportProfile(
  userId: string,
  reason: ReportReason,
  details?: string,
): Promise<{ error: string | null }> {
  const { error } = await supabase.from("content_reports").insert({
    target_type: "profile",
    reported_user_id: userId,
    reason,
    details: normalizeDetails(details),
  });
  return { error: mapReportError(error) };
}
