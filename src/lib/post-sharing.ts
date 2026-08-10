export const POST_LINK_ORIGIN = "https://entao.link";
const POST_ID_PATTERN = /^[A-Za-z0-9_-]+$/;

export function buildPostLink(postId: string): string {
  const encodedId = encodePostId(postId);
  return `${POST_LINK_ORIGIN}/post/${encodedId}`;
}

export function buildPostShareMessage(authorName: string): string {
  return `See ${authorName}’s post on Então.`;
}

/**
 * Accept only the app's public post path. Absolute URLs, query strings,
 * fragments, and additional path segments are intentionally rejected.
 */
export function validatePostReturnPath(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const match = /^(?:\/\(app\))?\/post\/([^/?#\\]+)$/.exec(value);
  if (!match) {
    return null;
  }

  try {
    const postId = decodeURIComponent(match[1]);
    if (!POST_ID_PATTERN.test(postId)) {
      return null;
    }
    return `/post/${encodeURIComponent(postId)}`;
  } catch {
    return null;
  }
}

export function getPostIdFromReturnPath(value: unknown): string | null {
  const validatedPath = validatePostReturnPath(value);
  if (!validatedPath) {
    return null;
  }

  return decodeURIComponent(validatedPath.slice("/post/".length));
}

/**
 * Map a cold-start / openURL linking URL to an internal post return path.
 * Custom schemes parse as `entao://post/{id}` (hostname `post`).
 */
export function postPathFromLinkingUrl(url: unknown): string | null {
  if (typeof url !== "string" || url.length === 0) {
    return null;
  }

  try {
    const parsed = new URL(url);
    if (parsed.hostname === "post") {
      const postId = parsed.pathname.replace(/^\//, "");
      return validatePostReturnPath(`/post/${postId}`);
    }
    return validatePostReturnPath(parsed.pathname);
  } catch {
    return null;
  }
}

/** Survives auth loading / redirects that clear the deep-link pathname. */
let pendingPostReturnPath: string | null = null;
let initialLinkResolved = false;
const initialLinkListeners = new Set<() => void>();

export function rememberPostReturnPath(value: unknown): string | null {
  const validatedPath =
    validatePostReturnPath(value) ?? postPathFromLinkingUrl(value);
  if (validatedPath) {
    pendingPostReturnPath = validatedPath;
  }
  return pendingPostReturnPath;
}

export function peekPostReturnPath(): string | null {
  return pendingPostReturnPath;
}

export function consumePostReturnPath(): string | null {
  const validatedPath = pendingPostReturnPath;
  pendingPostReturnPath = null;
  return validatedPath;
}

export function markInitialPostLinkResolved(): void {
  if (initialLinkResolved) {
    return;
  }
  initialLinkResolved = true;
  for (const listener of initialLinkListeners) {
    listener();
  }
}

export function isInitialPostLinkResolved(): boolean {
  return initialLinkResolved;
}

export function subscribeInitialPostLinkResolved(listener: () => void): () => void {
  if (initialLinkResolved) {
    listener();
    return () => {};
  }
  initialLinkListeners.add(listener);
  return () => {
    initialLinkListeners.delete(listener);
  };
}

function encodePostId(postId: string): string {
  if (typeof postId !== "string" || postId.length === 0) {
    throw new Error("Invalid post ID");
  }
  return encodeURIComponent(postId);
}
