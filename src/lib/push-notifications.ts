import { Platform } from "react-native";
import Constants from "expo-constants";
import { randomUUID } from "expo-crypto";
import * as Notifications from "expo-notifications";
import { supabase } from "@/lib/supabase";

const DEVICE_ID_KEY = "entao.device_id";

let warnedMissingProjectId = false;
/** Coalesce concurrent register calls per user; skip upsert when user+token unchanged. */
let registerInFlight: { userId: string; promise: Promise<void> } | null = null;
let lastRegistered: { userId: string; token: string } | null = null;

function warnDev(message: string, error?: unknown) {
  if (__DEV__) {
    console.warn(`[push] ${message}`, error ?? "");
  }
}

function getProjectId(): string | null {
  return (
    Constants.expoConfig?.extra?.eas?.projectId ??
    Constants.easConfig?.projectId ??
    null
  );
}

/** Clears the in-memory skip cache (e.g. session lost without explicit sign-out). */
export function clearPushRegistrationCache(): void {
  lastRegistered = null;
}

export function getOrCreateDeviceId(): string {
  const existing = localStorage.getItem(DEVICE_ID_KEY);
  if (existing) return existing;
  const id = randomUUID();
  localStorage.setItem(DEVICE_ID_KEY, id);
  return id;
}

/**
 * Registers the Expo token for this user/device.
 * Prefer upsert on (user_id, device_id) for token rotation. If that hits
 * `push_tokens_unique_token` (same Expo token on another device_id row —
 * common after storage churn / incomplete sign-out), claim the token row.
 */
async function upsertExpoPushToken(
  userId: string,
  expoPushToken: string,
): Promise<boolean> {
  const deviceId = getOrCreateDeviceId();
  const now = new Date().toISOString();
  const row = {
    user_id: userId,
    device_id: deviceId,
    expo_push_token: expoPushToken,
    platform: "ios" as const,
    last_seen_at: now,
  };

  let { error } = await supabase
    .from("push_tokens")
    .upsert(row, { onConflict: "user_id,device_id" });

  if (error?.code === "23505") {
    // Free this device slot, then update/insert via the token unique key.
    const { error: deleteError } = await supabase
      .from("push_tokens")
      .delete()
      .eq("device_id", deviceId);
    if (deleteError) {
      warnDev("Failed to clear device push token before reclaim", deleteError);
    }

    ({ error } = await supabase
      .from("push_tokens")
      .upsert(row, { onConflict: "expo_push_token" }));
  }

  if (error) {
    warnDev("Failed to upsert push token", error);
    return false;
  }
  return true;
}

/**
 * Registers this iOS device's Expo push token for the signed-in user.
 * No-ops on non-iOS platforms and when permission / projectId is unavailable.
 */
export async function registerPushToken(userId: string): Promise<void> {
  if (Platform.OS !== "ios") return;

  if (registerInFlight) {
    if (registerInFlight.userId === userId) {
      return registerInFlight.promise;
    }
    try {
      await registerInFlight.promise;
    } catch {
      // Ignore errors from the previous user's registration.
    }
    if (registerInFlight?.userId === userId) {
      return registerInFlight.promise;
    }
  }

  const promise = (async () => {
    try {
      const projectId = getProjectId();
      if (!projectId) {
        if (!warnedMissingProjectId) {
          warnedMissingProjectId = true;
          warnDev(
            "Missing extra.eas.projectId — run `eas init` and commit projectId in app.json",
          );
        }
        return;
      }

      const permissions = await Notifications.getPermissionsAsync();
      let iosStatus = permissions.ios?.status;

      if (iosStatus === Notifications.IosAuthorizationStatus.NOT_DETERMINED) {
        const requested = await Notifications.requestPermissionsAsync();
        iosStatus = requested.ios?.status;
      }

      const allowed =
        iosStatus === Notifications.IosAuthorizationStatus.AUTHORIZED ||
        iosStatus === Notifications.IosAuthorizationStatus.PROVISIONAL;

      if (!allowed) {
        warnDev("Notification permission not granted", iosStatus);
        return;
      }

      const token = await Notifications.getExpoPushTokenAsync({ projectId });
      if (
        lastRegistered?.userId === userId &&
        lastRegistered.token === token.data
      ) {
        return;
      }
      const ok = await upsertExpoPushToken(userId, token.data);
      if (ok) {
        lastRegistered = { userId, token: token.data };
      }
    } catch (error) {
      warnDev("registerPushToken failed", error);
    }
  })().finally(() => {
    if (registerInFlight?.promise === promise) {
      registerInFlight = null;
    }
  });

  registerInFlight = { userId, promise };
  return promise;
}

/**
 * Removes this device's push token while the session is still valid.
 */
export async function unregisterPushToken(): Promise<void> {
  if (Platform.OS !== "ios") return;

  try {
    const deviceId = getOrCreateDeviceId();
    const cachedToken = lastRegistered?.token;

    const { error: deviceError } = await supabase
      .from("push_tokens")
      .delete()
      .eq("device_id", deviceId);
    if (deviceError) {
      warnDev("Failed to delete push token by device", deviceError);
    }

    // Also clear by token when the row used a different device_id (storage churn).
    if (cachedToken) {
      const { error: tokenError } = await supabase
        .from("push_tokens")
        .delete()
        .eq("expo_push_token", cachedToken);
      if (tokenError) {
        warnDev("Failed to delete push token by expo token", tokenError);
      }
    }

    clearPushRegistrationCache();
  } catch (error) {
    warnDev("unregisterPushToken failed", error);
  }
}
