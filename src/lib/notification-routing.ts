/**
 * Resolves an in-app href from notification payload data.
 * Backend should put the Expo Router path in `data.url`.
 */
export function getNotificationHref(data: unknown): string | null {
  if (data == null || typeof data !== "object") return null;
  const url = (data as { url?: unknown }).url;
  if (typeof url !== "string") return null;
  const trimmed = url.trim();
  return trimmed.length > 0 ? trimmed : null;
}
