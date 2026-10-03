import type { QueryClient, QueryKey } from "@tanstack/react-query";
import {
  FEED_SNAPSHOT_KEYS,
  readPersistedFeedSnapshot,
  writePersistedFeedSnapshot,
  type FeedSnapshotKey,
  type FeedSnapshotRow,
} from "@/lib/feed-snapshot";
import { queryKeys } from "@/queries/keys";
import type { PublicUserProfile } from "@/lib/profile";
import type {
  FriendsPostsGroupedWithImages,
  ProfileFeedPostWithImage,
} from "@/queries/posts";

export type FeedSnapshotIo = {
  read: (
    userId: string,
    cacheKey: FeedSnapshotKey,
  ) => Promise<FeedSnapshotRow | null>;
  write: (
    userId: string,
    cacheKey: FeedSnapshotKey,
    payload: string,
    updatedAt: number,
  ) => Promise<void>;
};

const sqliteFeedSnapshotIo: FeedSnapshotIo = {
  read: readPersistedFeedSnapshot,
  write: writePersistedFeedSnapshot,
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function sameQueryKey(a: QueryKey, b: QueryKey): boolean {
  return a.length === b.length && a.every((part, index) => part === b[index]);
}

export function snapshotCacheKey(
  userId: string,
  queryKey: QueryKey,
): FeedSnapshotKey | null {
  if (sameQueryKey(queryKey, queryKeys.friendsPosts())) {
    return "friends-posts";
  }
  if (sameQueryKey(queryKey, queryKeys.profileFeed(userId))) {
    return "profile-feed";
  }
  if (sameQueryKey(queryKey, queryKeys.userProfile(userId))) {
    return "user-profile";
  }
  return null;
}

function queryKeyForSnapshot(
  userId: string,
  cacheKey: FeedSnapshotKey,
): QueryKey {
  switch (cacheKey) {
    case "friends-posts":
      return queryKeys.friendsPosts();
    case "profile-feed":
      return queryKeys.profileFeed(userId);
    case "user-profile":
      return queryKeys.userProfile(userId);
  }
}

export function parseFriendsPostsSnapshot(
  value: unknown,
): FriendsPostsGroupedWithImages | null {
  if (!isRecord(value) || !Array.isArray(value.groups)) return null;
  for (const group of value.groups) {
    if (
      !isRecord(group) ||
      typeof group.author_id !== "string" ||
      typeof group.username !== "string" ||
      typeof group.display_name !== "string" ||
      !Array.isArray(group.posts)
    ) {
      return null;
    }
    for (const post of group.posts) {
      if (
        !isRecord(post) ||
        typeof post.id !== "string" ||
        typeof post.storage_object_path !== "string"
      ) {
        return null;
      }
    }
  }
  return value as FriendsPostsGroupedWithImages;
}

export function parseProfileFeedSnapshot(
  value: unknown,
): ProfileFeedPostWithImage[] | null {
  if (!Array.isArray(value)) return null;
  for (const post of value) {
    if (
      !isRecord(post) ||
      typeof post.id !== "string" ||
      typeof post.storage_object_path !== "string"
    ) {
      return null;
    }
  }
  return value as ProfileFeedPostWithImage[];
}

export function parseUserProfileSnapshot(
  value: unknown,
  userId: string,
): PublicUserProfile | null {
  if (
    !isRecord(value) ||
    value.id !== userId ||
    (value.display_name !== null && typeof value.display_name !== "string") ||
    (value.username !== null && typeof value.username !== "string") ||
    (value.date_of_birth !== null && typeof value.date_of_birth !== "string")
  ) {
    return null;
  }
  return value as PublicUserProfile;
}

function parseSnapshot(
  cacheKey: FeedSnapshotKey,
  value: unknown,
  userId: string,
): unknown | null {
  switch (cacheKey) {
    case "friends-posts":
      return parseFriendsPostsSnapshot(value);
    case "profile-feed":
      return parseProfileFeedSnapshot(value);
    case "user-profile":
      return parseUserProfileSnapshot(value, userId);
  }
}

export async function hydrateFeedCache(
  client: QueryClient,
  userId: string,
  io: FeedSnapshotIo = sqliteFeedSnapshotIo,
): Promise<void> {
  await Promise.all(
    FEED_SNAPSHOT_KEYS.map(async (cacheKey) => {
      const row = await io.read(userId, cacheKey);
      if (!row) return;
      let parsed: unknown;
      try {
        parsed = JSON.parse(row.payload);
      } catch {
        return;
      }
      const data = parseSnapshot(cacheKey, parsed, userId);
      if (data == null) return;
      client.setQueryData(queryKeyForSnapshot(userId, cacheKey), data, {
        updatedAt: row.updatedAt,
      });
    }),
  );
}

export function bindFeedCachePersistence(
  client: QueryClient,
  userId: string,
  io: FeedSnapshotIo = sqliteFeedSnapshotIo,
): () => void {
  return client.getQueryCache().subscribe((event) => {
    if (event.type !== "updated") return;
    const cacheKey = snapshotCacheKey(userId, event.query.queryKey);
    if (!cacheKey) return;
    const data = event.query.state.data;
    if (data === undefined) return;
    const payload = JSON.stringify(data);
    const updatedAt = event.query.state.dataUpdatedAt;
    void io.write(userId, cacheKey, payload, updatedAt).catch(() => {});
  });
}
