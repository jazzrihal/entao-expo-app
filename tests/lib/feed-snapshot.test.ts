import type { SQLiteDatabase } from "expo-sqlite";
import {
  deleteAllFeedSnapshots,
  deleteUserFeedSnapshots,
  readFeedSnapshot,
  writeFeedSnapshot,
} from "@/lib/feed-snapshot";

type SnapshotRow = { payload: string; updated_at: number };

function createSnapshotDb() {
  const rows = new Map<string, SnapshotRow>();
  const key = (userId: string, cacheKey: string) => `${userId}\0${cacheKey}`;

  const db = {
    execAsync: async () => {},
    runAsync: async (sql: string, ...params: unknown[]) => {
      const normalized = sql.replace(/\s+/g, " ").trim();
      if (normalized.startsWith("INSERT INTO feed_snapshots")) {
        const [userId, cacheKey, payload, updatedAt] = params;
        rows.set(key(String(userId), String(cacheKey)), {
          payload: String(payload),
          updated_at: Number(updatedAt),
        });
        return { changes: 1, lastInsertRowId: 0 };
      }
      if (normalized.startsWith("DELETE FROM feed_snapshots WHERE")) {
        const userId = String(params[0]);
        for (const rowKey of [...rows.keys()]) {
          if (rowKey.startsWith(`${userId}\0`)) rows.delete(rowKey);
        }
        return { changes: 1, lastInsertRowId: 0 };
      }
      if (normalized === "DELETE FROM feed_snapshots") {
        rows.clear();
        return { changes: 1, lastInsertRowId: 0 };
      }
      throw new Error(`Unsupported SQL: ${sql}`);
    },
    getFirstAsync: async <T>(sql: string, ...params: unknown[]) => {
      const normalized = sql.replace(/\s+/g, " ").trim();
      if (
        normalized.startsWith("SELECT payload, updated_at FROM feed_snapshots")
      ) {
        return (rows.get(key(String(params[0]), String(params[1]))) ??
          null) as T | null;
      }
      throw new Error(`Unsupported SQL: ${sql}`);
    },
  };

  return db as unknown as SQLiteDatabase;
}

describe("feed snapshots", () => {
  it("stores and replaces a snapshot per user and key", async () => {
    const db = createSnapshotDb();
    await writeFeedSnapshot(db, "alice", "friends-posts", '{"groups":[]}', 10);
    await writeFeedSnapshot(
      db,
      "alice",
      "friends-posts",
      '{"groups":[{"author_id":"bob"}]}',
      20,
    );
    await writeFeedSnapshot(db, "bob", "friends-posts", '{"groups":[]}', 30);

    await expect(
      readFeedSnapshot(db, "alice", "friends-posts"),
    ).resolves.toEqual({
      payload: '{"groups":[{"author_id":"bob"}]}',
      updatedAt: 20,
    });
    await expect(readFeedSnapshot(db, "bob", "friends-posts")).resolves.toEqual(
      {
        payload: '{"groups":[]}',
        updatedAt: 30,
      },
    );
    await expect(
      readFeedSnapshot(db, "alice", "profile-feed"),
    ).resolves.toBeNull();
  });

  it("deletes one user's snapshots and can wipe every snapshot", async () => {
    const db = createSnapshotDb();
    await writeFeedSnapshot(db, "alice", "profile-feed", "[]", 1);
    await writeFeedSnapshot(db, "bob", "profile-feed", "[]", 2);

    await deleteUserFeedSnapshots(db, "alice");
    await expect(
      readFeedSnapshot(db, "alice", "profile-feed"),
    ).resolves.toBeNull();
    await expect(readFeedSnapshot(db, "bob", "profile-feed")).resolves.toEqual({
      payload: "[]",
      updatedAt: 2,
    });

    await deleteAllFeedSnapshots(db);
    await expect(
      readFeedSnapshot(db, "bob", "profile-feed"),
    ).resolves.toBeNull();
  });
});
