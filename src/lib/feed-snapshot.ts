import type { SQLiteDatabase } from "expo-sqlite";
import { getDb } from "@/lib/post-db";

export const FEED_SNAPSHOT_KEYS = [
  "friends-posts",
  "profile-feed",
  "user-profile",
] as const;

export type FeedSnapshotKey = (typeof FEED_SNAPSHOT_KEYS)[number];

export type FeedSnapshotRow = {
  payload: string;
  updatedAt: number;
};

const CREATE_FEED_SNAPSHOTS = `
  CREATE TABLE IF NOT EXISTS feed_snapshots (
    user_id TEXT NOT NULL,
    cache_key TEXT NOT NULL,
    payload TEXT NOT NULL,
    updated_at INTEGER NOT NULL,
    PRIMARY KEY (user_id, cache_key)
  );
`;

export async function ensureFeedSnapshotSchema(
  db: SQLiteDatabase,
): Promise<void> {
  await db.execAsync(CREATE_FEED_SNAPSHOTS);
}

async function openFeedSnapshotDb(): Promise<SQLiteDatabase> {
  const db = await getDb();
  await ensureFeedSnapshotSchema(db);
  return db;
}

export async function readFeedSnapshot(
  db: SQLiteDatabase,
  userId: string,
  cacheKey: FeedSnapshotKey,
): Promise<FeedSnapshotRow | null> {
  const row = await db.getFirstAsync<{
    payload: string;
    updated_at: number;
  }>(
    `SELECT payload, updated_at FROM feed_snapshots
     WHERE user_id = ? AND cache_key = ?`,
    userId,
    cacheKey,
  );
  if (!row) return null;
  return { payload: row.payload, updatedAt: row.updated_at };
}

export async function writeFeedSnapshot(
  db: SQLiteDatabase,
  userId: string,
  cacheKey: FeedSnapshotKey,
  payload: string,
  updatedAt: number,
): Promise<void> {
  await db.runAsync(
    `INSERT INTO feed_snapshots (user_id, cache_key, payload, updated_at)
     VALUES (?, ?, ?, ?)
     ON CONFLICT(user_id, cache_key) DO UPDATE SET
       payload = excluded.payload,
       updated_at = excluded.updated_at`,
    userId,
    cacheKey,
    payload,
    updatedAt,
  );
}

export async function deleteUserFeedSnapshots(
  db: SQLiteDatabase,
  userId: string,
): Promise<void> {
  await db.runAsync(`DELETE FROM feed_snapshots WHERE user_id = ?`, userId);
}

export async function deleteAllFeedSnapshots(
  db: SQLiteDatabase,
): Promise<void> {
  await db.runAsync(`DELETE FROM feed_snapshots`);
}

export async function readPersistedFeedSnapshot(
  userId: string,
  cacheKey: FeedSnapshotKey,
): Promise<FeedSnapshotRow | null> {
  const db = await openFeedSnapshotDb();
  return readFeedSnapshot(db, userId, cacheKey);
}

export async function writePersistedFeedSnapshot(
  userId: string,
  cacheKey: FeedSnapshotKey,
  payload: string,
  updatedAt: number,
): Promise<void> {
  const db = await openFeedSnapshotDb();
  await writeFeedSnapshot(db, userId, cacheKey, payload, updatedAt);
}

export async function clearUserFeedSnapshots(userId: string): Promise<void> {
  const db = await openFeedSnapshotDb();
  await deleteUserFeedSnapshots(db, userId);
}

export async function clearAllFeedSnapshots(): Promise<void> {
  const db = await openFeedSnapshotDb();
  await deleteAllFeedSnapshots(db);
}
