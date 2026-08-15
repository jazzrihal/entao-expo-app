import { supabase } from "@/lib/supabase";
import type { Database } from "@/lib/database.types";

export type UserProfile = Database["public"]["Tables"]["user_profiles"]["Row"];

function rpcErrorMessage(error: { message: string } | null): string | null {
  return error?.message ?? null;
}

export type PublicUserProfile = Pick<
  UserProfile,
  "id" | "display_name" | "username"
>;

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
    .select("id, display_name, username")
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
    .select("id, display_name, username")
    .eq("username", username)
    .maybeSingle();

  return { data, error: rpcErrorMessage(error) };
}
