import { supabase } from "@/lib/supabase";
import type { Database } from "@/lib/database.types";

export type UserProfile = Database["public"]["Tables"]["user_profiles"]["Row"];
export type AccountDeletionRequest =
  Database["public"]["Tables"]["account_deletion_requests"]["Row"];

function rpcErrorMessage(error: { message: string } | null): string | null {
  return error?.message ?? null;
}

export type PublicUserProfile = Pick<
  UserProfile,
  "id" | "display_name" | "username" | "date_of_birth"
>;

const PROFILE_COLUMNS = "id, display_name, username, date_of_birth";

export type UpdateUserProfileInput = {
  username?: string | null;
  display_name?: string | null;
  date_of_birth?: string | null;
};

/** Formats a local calendar date as `YYYY-MM-DD` for `user_profiles.date_of_birth`. */
export function formatDateOnly(date: Date | undefined): string | null {
  if (!date) return null;
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/** Parses a `YYYY-MM-DD` (or ISO) date-of-birth string as a local calendar date. */
export function parseDateOnly(
  value: string | null | undefined,
): Date | undefined {
  if (!value) return undefined;
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
  if (!match) return undefined;
  return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
}

const PROFILE_USER_ID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isProfileUserId(value: string): boolean {
  return PROFILE_USER_ID_PATTERN.test(value);
}

export async function getUserProfile(userId: string): Promise<{
  data: PublicUserProfile | null;
  error: string | null;
}> {
  const { data, error } = await supabase
    .from("user_profiles")
    .select(PROFILE_COLUMNS)
    .eq("id", userId)
    .maybeSingle();

  return { data, error: rpcErrorMessage(error) };
}

export async function getUserProfileByUsername(username: string): Promise<{
  data: PublicUserProfile | null;
  error: string | null;
}> {
  const { data, error } = await supabase
    .from("user_profiles")
    .select(PROFILE_COLUMNS)
    .eq("username", username)
    .maybeSingle();

  return { data, error: rpcErrorMessage(error) };
}

export async function updateUserProfile(
  userId: string,
  updates: UpdateUserProfileInput,
): Promise<{
  data: PublicUserProfile | null;
  error: string | null;
}> {
  const { data, error } = await supabase
    .from("user_profiles")
    .update(updates)
    .eq("id", userId)
    .select(PROFILE_COLUMNS)
    .maybeSingle();

  return { data, error: rpcErrorMessage(error) };
}

export async function getAccountDeletionRequest(userId: string): Promise<{
  data: AccountDeletionRequest | null;
  error: string | null;
}> {
  const { data, error } = await supabase
    .from("account_deletion_requests")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  return { data, error: rpcErrorMessage(error) };
}

export async function requestAccountDeletion(): Promise<{
  data: AccountDeletionRequest | null;
  error: string | null;
}> {
  const { data, error } = await supabase.rpc("request_account_deletion");
  return { data, error: rpcErrorMessage(error) };
}

export async function cancelAccountDeletion(): Promise<{
  error: string | null;
}> {
  const { error } = await supabase.rpc("cancel_account_deletion");
  return { error: rpcErrorMessage(error) };
}
