import { useSyncExternalStore } from "react";
import { FORCE_UPLOAD_INDICATORS } from "@/lib/debug-upload-indicators";
import { addSyncListener, isSyncRunning } from "@/lib/sync-manager";

/**
 * Whether the background post-upload loop currently has due outbox work.
 * Empty no-op sync checks do not count as activity.
 */
export function useNetworkActivity(): boolean {
  const active = useSyncExternalStore(
    addSyncListener,
    isSyncRunning,
    isSyncRunning,
  );
  return FORCE_UPLOAD_INDICATORS || active;
}
