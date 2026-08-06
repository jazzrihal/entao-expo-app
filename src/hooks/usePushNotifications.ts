import { useEffect } from "react";
import { Platform } from "react-native";
import { type Href, router } from "expo-router";
import * as Notifications from "expo-notifications";
import { useAuth } from "@/context/auth";
import { getNotificationHref } from "@/lib/notification-routing";
import { registerPushToken } from "@/lib/push-notifications";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

/** Cold-start / remount guard so the same tap is not routed twice. */
const handledResponseIds = new Set<string>();

function routeFromNotification(notification: Notifications.Notification): void {
  const href = getNotificationHref(notification.request.content.data);
  if (!href) return;
  router.push(href as Href);
}

function handleNotificationResponse(
  response: Notifications.NotificationResponse | null | undefined,
): void {
  if (!response) return;
  const id = response.notification.request.identifier;
  if (handledResponseIds.has(id)) return;
  handledResponseIds.add(id);
  routeFromNotification(response.notification);
}

/**
 * Registers push tokens for the signed-in user and routes notification taps
 * via `data.url`. Mount once inside the authenticated app shell (iOS only).
 */
export function usePushNotifications(): void {
  const { session } = useAuth();
  const userId = session?.user?.id;

  useEffect(() => {
    if (Platform.OS !== "ios" || !userId) return;

    void registerPushToken(userId);

    // getExpoPushTokenAsync re-emits the current device token; only re-register on change.
    let lastHeardDeviceToken: string | null = null;
    const tokenSub = Notifications.addPushTokenListener((token) => {
      const tokenData =
        typeof token?.data === "string" ? token.data : String(token?.data ?? "");
      if (tokenData === lastHeardDeviceToken) return;
      lastHeardDeviceToken = tokenData;
      void registerPushToken(userId);
    });

    handleNotificationResponse(Notifications.getLastNotificationResponse());

    const responseSub = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        handleNotificationResponse(response);
      },
    );

    return () => {
      tokenSub.remove();
      responseSub.remove();
    };
  }, [userId]);
}
