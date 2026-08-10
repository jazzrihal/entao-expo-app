/**
 * Resolves an in-app href from Expo push notification `data`.
 *
 * Expo envelope (Edge Function merge):
 * `{ type, actor_id?, post_id?, friendship_request_id?, ... }`
 *
 * Resolution order:
 * 1. `url` — relative path starting with `/` (not `//`)
 * 2. `post_id` → `/post/{id}`
 * 3. `type === "friend_request"` → `/friends/list`
 * 4. `actor_id` → own profile or `/user/{id}`
 * 5. `friendship_request_id` → `/friends/list`
 */
export function getNotificationHref(
  data: unknown,
  options?: { sessionUserId?: string | null },
): string | null {
  if (data == null || typeof data !== "object") return null;

  const payload = data as {
    url?: unknown;
    type?: unknown;
    post_id?: unknown;
    actor_id?: unknown;
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

  if (payload.type === "friend_request") {
    return "/friends/list";
  }

  if (typeof payload.actor_id === "string") {
    const actorId = payload.actor_id.trim();
    if (actorId.length > 0) {
      if (
        options?.sessionUserId != null &&
        actorId === options.sessionUserId
      ) {
        return "/(app)/(tabs)/profile";
      }
      return `/user/${actorId}`;
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
