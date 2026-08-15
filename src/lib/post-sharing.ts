export const POST_LINK_ORIGIN = "https://entao.link";
const POST_ID_PATTERN = /^[A-Za-z0-9_-]+$/;
const USERNAME_PATTERN = /^[A-Za-z0-9._-]+$/;

export function buildPostLink(postId: string): string {
  const encodedId = encodeLinkId(postId);
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
  return validateResourceReturnPath("post", value);
}

export function validateUserReturnPath(value: unknown): string | null {
  return validateResourceReturnPath("user", value);
}

export function getPostIdFromReturnPath(value: unknown): string | null {
  return getResourceIdFromReturnPath("post", value);
}

export function getUsernameFromReturnPath(value: unknown): string | null {
  return getResourceIdFromReturnPath("user", value);
}

/**
 * Map a cold-start / openURL linking URL to an internal post return path.
 * Custom schemes parse as `entao://post/{id}` (hostname `post`).
 */
export function postPathFromLinkingUrl(url: unknown): string | null {
  return resourcePathFromLinkingUrl("post", url);
}

/**
 * Map a cold-start / openURL linking URL to an internal user return path.
 * Custom schemes parse as `entao://user/{username}` (hostname `user`).
 */
export function userPathFromLinkingUrl(url: unknown): string | null {
  return resourcePathFromLinkingUrl("user", url);
}

/** Survives auth loading / redirects that clear the deep-link pathname. */
let pendingPostReturnPath: string | null = null;
let initialLinkResolved = false;
const initialLinkListeners = new Set<() => void>();

export function rememberPostReturnPath(value: unknown): string | null {
  const validatedPath =
    validatePostReturnPath(value) ??
    validateUserReturnPath(value) ??
    postPathFromLinkingUrl(value) ??
    userPathFromLinkingUrl(value);
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

export function subscribeInitialPostLinkResolved(
  listener: () => void,
): () => void {
  if (initialLinkResolved) {
    listener();
    return () => {};
  }
  initialLinkListeners.add(listener);
  return () => {
    initialLinkListeners.delete(listener);
  };
}

function encodeLinkId(id: string): string {
  if (typeof id !== "string" || id.length === 0) {
    throw new Error("Invalid link ID");
  }
  return encodeURIComponent(id);
}

function validateResourceReturnPath(
  kind: "post" | "user",
  value: unknown,
): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const match = new RegExp(
    `^(?:\\/\\(app\\))?\\/${kind}\\/([^/?#\\\\]+)$`,
  ).exec(value);
  if (!match) {
    return null;
  }

  try {
    const id = decodeURIComponent(match[1]);
    if (id === "." || id === "..") {
      return null;
    }
    const pattern = kind === "user" ? USERNAME_PATTERN : POST_ID_PATTERN;
    if (!pattern.test(id)) {
      return null;
    }
    return `/${kind}/${encodeURIComponent(id)}`;
  } catch {
    return null;
  }
}

function getResourceIdFromReturnPath(
  kind: "post" | "user",
  value: unknown,
): string | null {
  const validatedPath = validateResourceReturnPath(kind, value);
  if (!validatedPath) {
    return null;
  }

  return decodeURIComponent(validatedPath.slice(`/${kind}/`.length));
}

function resourcePathFromLinkingUrl(
  kind: "post" | "user",
  url: unknown,
): string | null {
  if (typeof url !== "string" || url.length === 0) {
    return null;
  }

  try {
    const parsed = new URL(url);
    if (parsed.hostname === kind) {
      const id = parsed.pathname.replace(/^\//, "");
      return validateResourceReturnPath(kind, `/${kind}/${id}`);
    }
    return validateResourceReturnPath(kind, parsed.pathname);
  } catch {
    return null;
  }
}
