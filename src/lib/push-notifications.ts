import { Platform } from "react-native";
import Constants from "expo-constants";
import { randomUUID } from "expo-crypto";
import * as Notifications from "expo-notifications";
import { supabase } from "@/lib/supabase";

const DEVICE_ID_KEY = "entao.device_id";

let warnedMissingProjectId = false;
/** Coalesce concurrent register calls; skip upsert when Expo token is unchanged. */
let registerInFlight: Promise<void> | null = null;
let lastRegisteredExpoToken: string | null = null;

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

export function getOrCreateDeviceId(): string {
  const existing = localStorage.getItem(DEVICE_ID_KEY);
  if (existing) return existing;
  const id = randomUUID();
  localStorage.setItem(DEVICE_ID_KEY, id);
  return id;
}

async function upsertExpoPushToken(
  userId: string,
  expoPushToken: string,
): Promise<void> {
  const deviceId = getOrCreateDeviceId();
  const now = new Date().toISOString();
  const { error } = await supabase.from("push_tokens").upsert(
    {
      user_id: userId,
      device_id: deviceId,
      expo_push_token: expoPushToken,
      platform: "ios",
      last_seen_at: now,
    },
    { onConflict: "user_id,device_id" },
  );
  if (error) {
    warnDev("Failed to upsert push token", error);
  }
}

/**
 * Registers this iOS device's Expo push token for the signed-in user.
 * No-ops on non-iOS platforms and when permission / projectId is unavailable.
 */
export async function registerPushToken(userId: string): Promise<void> {
  if (Platform.OS !== "ios") return;
  if (registerInFlight) return registerInFlight;

  registerInFlight = (async () => {
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
      if (token.data === lastRegisteredExpoToken) return;
      await upsertExpoPushToken(userId, token.data);
      lastRegisteredExpoToken = token.data;
    } catch (error) {
      warnDev("registerPushToken failed", error);
    }
  })().finally(() => {
    registerInFlight = null;
  });

  return registerInFlight;
}

/**
 * Removes this device's push token while the session is still valid.
 */
export async function unregisterPushToken(): Promise<void> {
  if (Platform.OS !== "ios") return;

  try {
    const deviceId = getOrCreateDeviceId();
    const { error } = await supabase
      .from("push_tokens")
      .delete()
      .eq("device_id", deviceId);
    if (error) {
      warnDev("Failed to delete push token", error);
    }
    lastRegisteredExpoToken = null;
  } catch (error) {
    warnDev("unregisterPushToken failed", error);
  }
}
