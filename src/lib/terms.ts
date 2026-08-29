import { POST_LINK_ORIGIN } from "@/lib/post-sharing";
import { supabase } from "@/lib/supabase";
import type { Database } from "@/lib/database.types";

/** Stable Terms URL — always resolves to the current published version. */
export const TERMS_URL = `${POST_LINK_ORIGIN}/terms`;

export type TermsVersion =
  Database["public"]["Functions"]["get_current_terms"]["Returns"];

export type TermsAcceptance =
  Database["public"]["Functions"]["accept_terms"]["Returns"];

function rpcErrorMessage(error: { message: string } | null): string | null {
  return error?.message ?? null;
}

export async function getCurrentTerms(): Promise<{
  data: TermsVersion | null;
  error: string | null;
}> {
  const { data, error } = await supabase.rpc("get_current_terms");
  return { data, error: rpcErrorMessage(error) };
}

export async function acceptTerms(
  slug: string,
  hash: string,
): Promise<{ data: TermsAcceptance | null; error: string | null }> {
  const { data, error } = await supabase.rpc("accept_terms", {
    p_slug: slug,
    p_hash: hash,
  });
  return { data, error: rpcErrorMessage(error) };
}

export async function hasAcceptedCurrentTerms(): Promise<{
  data: boolean | null;
  error: string | null;
}> {
  const { data, error } = await supabase.rpc("has_accepted_current_terms");
  return { data, error: rpcErrorMessage(error) };
}
