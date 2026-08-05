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

function encodePostId(postId: string): string {
  if (typeof postId !== "string" || postId.length === 0) {
    throw new Error("Invalid post ID");
  }
  return encodeURIComponent(postId);
}
