/**
 * Resolves an in-app href from Expo push notification `data`.
 *
 * Resolution order:
 * 1. `url` — relative path starting with `/` (not `//`)
 * 2. `post_id` → `/post/{id}`
 * 3. `friendship_request_id` → `/friends/list`
 *
 * Backend push payloads today include entity IDs only (no `url` / `type` / `actor_id`).
 */
export function getNotificationHref(data: unknown): string | null {
  if (data == null || typeof data !== "object") return null;

  const payload = data as {
    url?: unknown;
    post_id?: unknown;
    friendship_request_id?: unknown;
  };

  if (typeof payload.url === "string") {
    const trimmed = payload.url.trim();
    if (trimmed.startsWith("/") && !trimmed.startsWith("//")) {
      return trimmed;
    }
  }

  if (typeof payload.post_id === "string") {
    const postId = payload.post_id.trim();
    if (postId.length > 0) {
      return `/post/${postId}`;
    }
  }

  if (typeof payload.friendship_request_id === "string") {
    const requestId = payload.friendship_request_id.trim();
    if (requestId.length > 0) {
      return "/friends/list";
    }
  }

  return null;
}
