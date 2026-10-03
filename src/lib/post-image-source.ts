import type { ImageSource } from "expo-image";

const LOCAL_URI_PATTERN = /^(file|content|ph|assets-library):/i;

/**
 * Remote post photos are signed URLs that change on every fetch. Key the
 * expo-image disk cache by the stable storage path so a relaunch or a new
 * signature still serves the bytes already downloaded.
 */
export function postImageSource(
  imageUrl: string | null | undefined,
  storageObjectPath?: string | null,
): ImageSource | undefined {
  if (!imageUrl) return undefined;
  if (!storageObjectPath || LOCAL_URI_PATTERN.test(imageUrl)) {
    return { uri: imageUrl };
  }
  return { uri: imageUrl, cacheKey: storageObjectPath };
}

/** Memory plus disk when a stable cache key is set. Disk is what survives relaunch. */
export function diskCachePolicyForSource(
  source: unknown,
): "memory-disk" | undefined {
  if (!source || typeof source !== "object" || Array.isArray(source)) {
    return undefined;
  }
  if (!("cacheKey" in source)) return undefined;
  const cacheKey = source.cacheKey;
  return typeof cacheKey === "string" && cacheKey.length > 0
    ? "memory-disk"
    : undefined;
}
