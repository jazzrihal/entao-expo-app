import { supabase } from "@/lib/supabase";
import type { Database } from "@/lib/database.types";

export type BlockedUser =
  Database["public"]["Functions"]["list_blocked_users"]["Returns"][number];

function rpcErrorMessage(error: { message: string } | null): string | null {
  return error?.message ?? null;
}

export async function blockUser(
  blockedId: string,
): Promise<{ error: string | null }> {
  const { error } = await supabase.rpc("block_user", {
    p_blocked_id: blockedId,
  });
  return { error: rpcErrorMessage(error) };
}

export async function unblockUser(
  blockedId: string,
): Promise<{ error: string | null }> {
  const { error } = await supabase.rpc("unblock_user", {
    p_blocked_id: blockedId,
  });
  return { error: rpcErrorMessage(error) };
}

export async function listBlockedUsers(): Promise<{
  data: BlockedUser[] | null;
  error: string | null;
}> {
  const { data, error } = await supabase.rpc("list_blocked_users");
  return { data, error: rpcErrorMessage(error) };
}
