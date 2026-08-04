import "expo-sqlite/localStorage/install";
import { Platform } from "react-native";
import * as Device from "expo-device";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";

const useLocal = __DEV__ || process.env.EXPO_PUBLIC_SUPABASE_ENV === "local";

/** Physical device cannot reach 127.0.0.1 on the host Mac — use a tunnel URL. */
const useTunnel =
  __DEV__ &&
  Device.isDevice &&
  (Platform.OS === "ios" || Platform.OS === "android");

function resolveSupabaseUrl(): string {
  if (!useLocal) {
    return process.env.EXPO_PUBLIC_SUPABASE_URL!;
  }
  if (useTunnel) {
    const tunnelUrl = process.env.EXPO_PUBLIC_SUPABASE_TUNNEL_URL;
    if (!tunnelUrl) {
      throw new Error(
        "Missing EXPO_PUBLIC_SUPABASE_TUNNEL_URL. Physical device builds cannot reach localhost — tunnel Supabase (e.g. ngrok on port 54321) and set this env var.",
      );
    }
    return tunnelUrl;
  }
  return process.env.EXPO_PUBLIC_SUPABASE_LOCAL_URL!;
}

const supabaseUrl = resolveSupabaseUrl();

const supabaseKey = useLocal
  ? process.env.EXPO_PUBLIC_SUPABASE_LOCAL_PUBLISHABLE_KEY!
  : process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;

export const supabase = createClient<Database>(supabaseUrl, supabaseKey, {
  auth: {
    storage: localStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
