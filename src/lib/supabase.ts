import {
  createTimeoutSignal,
  mergeAbortSignals,
  SUPABASE_FETCH_TIMEOUT_MS,
} from "@/lib/abort";
import type { Database } from "@/lib/database.types";
import { createClient } from "@supabase/supabase-js";
import * as Device from "expo-device";
import "expo-sqlite/localStorage/install";
import { Platform } from "react-native";

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

function requestMeta(
  input: RequestInfo | URL,
  init?: RequestInit,
): { method: string; url: string } {
  if (input instanceof Request) {
    return { method: init?.method ?? input.method, url: input.url };
  }
  return {
    method: init?.method ?? "GET",
    url: typeof input === "string" ? input : String(input),
  };
}

async function supabaseErrorBody(response: Response): Promise<unknown> {
  try {
    const json: unknown = await response.json();
    if (!json || typeof json !== "object") {
      return json;
    }
    const record = json as Record<string, unknown>;
    const body: Record<string, unknown> = {};
    for (const key of ["message", "code", "details", "hint"] as const) {
      if (record[key] != null) {
        body[key] = record[key];
      }
    }
    return Object.keys(body).length > 0 ? body : json;
  } catch {
    return {};
  }
}

function fetchAbortSignal(
  input: RequestInfo | URL,
  init?: RequestInit,
): AbortSignal {
  const signals: AbortSignal[] = [
    createTimeoutSignal(SUPABASE_FETCH_TIMEOUT_MS),
  ];
  if (init?.signal) {
    signals.push(init.signal);
  }
  if (input instanceof Request && input.signal) {
    signals.push(input.signal);
  }
  return mergeAbortSignals(signals);
}

async function loggedFetch(
  input: RequestInfo | URL,
  init?: RequestInit,
): Promise<Response> {
  const { method, url } = requestMeta(input, init);
  let response: Response;
  try {
    response = await fetch(input, {
      ...init,
      signal: fetchAbortSignal(input, init),
    });
  } catch (error) {
    console.error("[supabase]", method, url, error);
    throw error;
  }

  if (!response.ok) {
    const body = await supabaseErrorBody(response.clone());
    console.error("[supabase]", method, url, response.status, body);
  }

  return response;
}

export const supabase = createClient<Database>(supabaseUrl, supabaseKey, {
  auth: {
    storage: localStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
  global: { fetch: loggedFetch },
});
