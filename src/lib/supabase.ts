import {
  createTimeoutSignal,
  mergeAbortSignals,
  SUPABASE_FETCH_TIMEOUT_MS,
} from "@/lib/abort";
import type { Database } from "@/lib/database.types";
import {
  PREVIEW_STORAGE_KEY,
  PREVIEW_STORAGE_VALUE,
  resolveSupabaseTarget,
  type SupabaseTarget,
} from "@/lib/supabase-target";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import * as Device from "expo-device";
import "expo-sqlite/localStorage/install";
import { useSyncExternalStore } from "react";
import { Platform } from "react-native";

export type EntaoSupabaseClient = SupabaseClient<Database>;
const useLocal = __DEV__ || process.env.EXPO_PUBLIC_SUPABASE_ENV === "local";

/** Physical device cannot reach 127.0.0.1 on the host Mac — use a tunnel URL. */
const useTunnel =
  __DEV__ &&
  Device.isDevice &&
  (Platform.OS === "ios" || Platform.OS === "android");

export const isLocalSupabase = useLocal;

export function hasPreviewCredentials(): boolean {
  return Boolean(
    process.env.EXPO_PUBLIC_SUPABASE_PREVIEW_URL &&
    process.env.EXPO_PUBLIC_SUPABASE_PREVIEW_PUBLISHABLE_KEY,
  );
}

function resolveLocalSupabaseUrl(): string {
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

function credentialsFor(target: SupabaseTarget): { url: string; key: string } {
  if (target === "local") {
    return {
      url: resolveLocalSupabaseUrl(),
      key: process.env.EXPO_PUBLIC_SUPABASE_LOCAL_PUBLISHABLE_KEY!,
    };
  }
  if (target === "preview") {
    return {
      url: process.env.EXPO_PUBLIC_SUPABASE_PREVIEW_URL!,
      key: process.env.EXPO_PUBLIC_SUPABASE_PREVIEW_PUBLISHABLE_KEY!,
    };
  }
  return {
    url: process.env.EXPO_PUBLIC_SUPABASE_URL!,
    key: process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
  };
}

function persistedPreview(): boolean {
  try {
    return localStorage.getItem(PREVIEW_STORAGE_KEY) === PREVIEW_STORAGE_VALUE;
  } catch {
    return false;
  }
}

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

function createSupabaseClient(target: SupabaseTarget): EntaoSupabaseClient {
  const { url, key } = credentialsFor(target);
  return createClient<Database>(url, key, {
    auth: {
      storage: localStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
    global: { fetch: loggedFetch },
  });
}

let currentTarget: SupabaseTarget = resolveSupabaseTarget({
  useLocal,
  persistedPreview: persistedPreview(),
  previewConfigured: hasPreviewCredentials(),
});

export let supabase: EntaoSupabaseClient = createSupabaseClient(currentTarget);

const targetListeners = new Set<() => void>();

function emitSupabaseTarget() {
  for (const listener of targetListeners) {
    listener();
  }
}

export function subscribeSupabaseTarget(onStoreChange: () => void): () => void {
  targetListeners.add(onStoreChange);
  return () => {
    targetListeners.delete(onStoreChange);
  };
}

export function getSupabaseTarget(): SupabaseTarget {
  return currentTarget;
}

export function useSupabaseTarget(): SupabaseTarget {
  return useSyncExternalStore(
    subscribeSupabaseTarget,
    getSupabaseTarget,
    getSupabaseTarget,
  );
}

export async function attemptPreviewSignIn(
  email: string,
  password: string,
): Promise<{ error: string | null; client: EntaoSupabaseClient }> {
  const client = createSupabaseClient("preview");
  const { error } = await client.auth.signInWithPassword({ email, password });
  return { error: error?.message ?? null, client };
}

export async function commitSupabaseTarget(
  target: "preview" | "production",
  client?: EntaoSupabaseClient,
): Promise<void> {
  if (useLocal) {
    return;
  }

  if (target === "preview") {
    localStorage.setItem(PREVIEW_STORAGE_KEY, PREVIEW_STORAGE_VALUE);
  } else {
    localStorage.removeItem(PREVIEW_STORAGE_KEY);
  }

  const previous = supabase;
  void previous.auth.signOut().catch(() => {});
  supabase = client ?? createSupabaseClient(target);
  currentTarget = target;
  emitSupabaseTarget();
}
