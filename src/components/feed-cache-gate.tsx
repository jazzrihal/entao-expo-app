import { useEffect, useState, type ReactNode } from "react";
import { queryClient } from "@/lib/query-client";
import { bindFeedCachePersistence, hydrateFeedCache } from "@/lib/feed-cache";

/**
 * Loads the last friends feed, own profile, and profile photos list before
 * those screens mount, then writes successful updates back to SQLite.
 */
export function FeedCacheGate({
  userId,
  children,
}: {
  userId: string;
  children: ReactNode;
}) {
  const [readyUserId, setReadyUserId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const unsubscribe = bindFeedCachePersistence(queryClient, userId);
    void hydrateFeedCache(queryClient, userId)
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setReadyUserId(userId);
      });
    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, [userId]);

  if (readyUserId !== userId) return null;
  return children;
}
