import { QueryClient } from "@tanstack/react-query";
import {
  bindFeedCachePersistence,
  hydrateFeedCache,
  type FeedSnapshotIo,
} from "@/lib/feed-cache";
import type { FeedSnapshotKey, FeedSnapshotRow } from "@/lib/feed-snapshot";
import { queryKeys } from "@/queries/keys";

const ALICE = "11111111-1111-1111-1111-111111111111";

function memoryIo(
  initial: Partial<Record<FeedSnapshotKey, FeedSnapshotRow>> = {},
) {
  const rows = new Map<FeedSnapshotKey, FeedSnapshotRow>(
    Object.entries(initial) as [FeedSnapshotKey, FeedSnapshotRow][],
  );
  const io: FeedSnapshotIo = {
    read: async (_userId, cacheKey) => rows.get(cacheKey) ?? null,
    write: async (_userId, cacheKey, payload, updatedAt) => {
      rows.set(cacheKey, { payload, updatedAt });
    },
  };
  return { io, rows };
}

function friendsPayload() {
  return {
    groups: [
      {
        author_id: "bob",
        username: "bob",
        display_name: "Bob",
        latest_captured_at: "2026-01-01T00:00:00.000Z",
        posts: [
          {
            id: "post-1",
            storage_object_path: "bob/post-1.jpg",
            imageUrl: "https://example.test/signed?token=old",
          },
        ],
      },
    ],
  };
}

describe("hydrateFeedCache", () => {
  it("restores friends, profile posts, and the profile header", async () => {
    const updatedAt = 1_700_000_000_000;
    const { io } = memoryIo({
      "friends-posts": {
        payload: JSON.stringify(friendsPayload()),
        updatedAt,
      },
      "profile-feed": {
        payload: JSON.stringify([
          {
            id: "mine",
            storage_object_path: "alice/mine.jpg",
            imageUrl: "https://example.test/me",
          },
        ]),
        updatedAt,
      },
      "user-profile": {
        payload: JSON.stringify({
          id: ALICE,
          display_name: "Alice",
          username: "alice",
          date_of_birth: null,
        }),
        updatedAt,
      },
    });
    const client = new QueryClient();

    await hydrateFeedCache(client, ALICE, io);

    expect(client.getQueryData(queryKeys.friendsPosts())).toEqual(
      friendsPayload(),
    );
    expect(client.getQueryState(queryKeys.friendsPosts())?.dataUpdatedAt).toBe(
      updatedAt,
    );
    expect(client.getQueryData(queryKeys.profileFeed(ALICE))).toEqual([
      {
        id: "mine",
        storage_object_path: "alice/mine.jpg",
        imageUrl: "https://example.test/me",
      },
    ]);
    expect(client.getQueryData(queryKeys.userProfile(ALICE))).toMatchObject({
      display_name: "Alice",
    });
  });

  it("skips corrupt or mismatched snapshots", async () => {
    const { io } = memoryIo({
      "friends-posts": { payload: "{", updatedAt: 1 },
      "profile-feed": { payload: JSON.stringify([{ id: 1 }]), updatedAt: 1 },
      "user-profile": {
        payload: JSON.stringify({
          id: "someone-else",
          display_name: "Eve",
          username: "eve",
          date_of_birth: null,
        }),
        updatedAt: 1,
      },
    });
    const client = new QueryClient();

    await hydrateFeedCache(client, ALICE, io);

    expect(client.getQueryData(queryKeys.friendsPosts())).toBeUndefined();
    expect(client.getQueryData(queryKeys.profileFeed(ALICE))).toBeUndefined();
    expect(client.getQueryData(queryKeys.userProfile(ALICE))).toBeUndefined();
  });
});

describe("bindFeedCachePersistence", () => {
  it("persists friends and own-profile updates and ignores other caches", async () => {
    const { io, rows } = memoryIo();
    const client = new QueryClient();
    const unsubscribe = bindFeedCachePersistence(client, ALICE, io);

    client.setQueryData(queryKeys.friendsPosts(), friendsPayload());
    client.setQueryData(queryKeys.profileFeed(ALICE), [
      { id: "mine", storage_object_path: "alice/mine.jpg" },
    ]);
    client.setQueryData(queryKeys.profileFeed("other-user"), [
      { id: "theirs", storage_object_path: "other/theirs.jpg" },
    ]);
    client.setQueryData(["feed", { at: "now", latitude: 1, longitude: 2 }], []);

    await Promise.resolve();
    unsubscribe();

    expect(JSON.parse(rows.get("friends-posts")?.payload ?? "")).toEqual(
      friendsPayload(),
    );
    expect(JSON.parse(rows.get("profile-feed")?.payload ?? "")).toEqual([
      { id: "mine", storage_object_path: "alice/mine.jpg" },
    ]);
    expect(rows.has("user-profile")).toBe(false);
  });
});
