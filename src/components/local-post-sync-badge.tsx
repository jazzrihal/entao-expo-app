import type { LocalPostStatus } from "@/lib/post-db";
import { PostGridOverlayBadge } from "@/components/post-grid-overlay-badge";
import { FORCE_UPLOAD_INDICATORS } from "@/lib/debug-upload-indicators";

type LocalPostSyncBadgeProps = {
  syncStatus: LocalPostStatus;
  testID?: string;
};

export function LocalPostSyncBadge({
  syncStatus,
  testID,
}: LocalPostSyncBadgeProps) {
  const uploading = FORCE_UPLOAD_INDICATORS || syncStatus === "uploading";

  return (
    <PostGridOverlayBadge
      testID={testID}
      symbolName={uploading ? "icloud.and.arrow.up" : "icloud.slash"}
      accessibilityLabel={uploading ? "Uploading" : "Not uploaded"}
      bouncing={uploading}
    />
  );
}
