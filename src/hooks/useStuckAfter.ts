import { useEffect, useState } from "react";

export const FEED_STUCK_AFTER_MS = 20_000;

export function useStuckAfter(isLoading: boolean, ms: number): boolean {
  const [seenLoading, setSeenLoading] = useState(isLoading);
  const [loadKey, setLoadKey] = useState(0);
  const [stuckKey, setStuckKey] = useState<number | null>(null);

  if (isLoading !== seenLoading) {
    setSeenLoading(isLoading);
    if (isLoading) {
      setLoadKey((key) => key + 1);
    }
  }

  const currentLoadKey =
    isLoading !== seenLoading && isLoading ? loadKey + 1 : loadKey;

  useEffect(() => {
    if (!isLoading) {
      return;
    }

    const timeoutId = setTimeout(() => setStuckKey(currentLoadKey), ms);
    return () => clearTimeout(timeoutId);
  }, [isLoading, ms, currentLoadKey]);

  return isLoading && seenLoading && stuckKey === loadKey;
}
