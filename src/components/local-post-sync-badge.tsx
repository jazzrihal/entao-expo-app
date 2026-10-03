import { StyleSheet, View } from "react-native";
import { SymbolView } from "expo-symbols";
import { PostGridOverlayBadge } from "@/components/post-grid-overlay-badge";
import { SpinningIcon } from "@/components/spinning-icon";
import { FORCE_UPLOAD_INDICATORS } from "@/lib/debug-upload-indicators";
import type { LocalPostStatus } from "@/lib/post-db";

const INLINE_SYMBOL_SIZE = 16;

type LocalPostSyncBadgeProps = {
  syncStatus: LocalPostStatus;
  testID?: string;
  /** Sits in a row. The default draws the photo-corner chip. */
  inline?: boolean;
  tintColor?: string;
};

export function LocalPostSyncBadge({
  syncStatus,
  testID,
  inline = false,
  tintColor = "#FFFFFF",
}: LocalPostSyncBadgeProps) {
  const uploading = FORCE_UPLOAD_INDICATORS || syncStatus === "uploading";
  const symbolName = uploading ? "icloud.and.arrow.up" : "icloud.slash";
  const accessibilityLabel = uploading ? "Uploading" : "Not uploaded";

  if (inline) {
    return (
      <View
        testID={testID}
        accessible
        accessibilityLabel={accessibilityLabel}
        pointerEvents="none"
        style={styles.inline}
      >
        {uploading ? (
          <SpinningIcon
            name={symbolName}
            size={INLINE_SYMBOL_SIZE}
            tintColor={tintColor}
            bouncing
          />
        ) : (
          <SymbolView
            name={symbolName}
            tintColor={tintColor}
            resizeMode="scaleAspectFit"
            style={styles.inlineSymbol}
            accessible={false}
          />
        )}
      </View>
    );
  }

  return (
    <PostGridOverlayBadge
      testID={testID}
      symbolName={symbolName}
      accessibilityLabel={accessibilityLabel}
      bouncing={uploading}
    />
  );
}

const styles = StyleSheet.create({
  inline: {
    width: INLINE_SYMBOL_SIZE,
    height: INLINE_SYMBOL_SIZE,
  },
  inlineSymbol: {
    width: INLINE_SYMBOL_SIZE,
    height: INLINE_SYMBOL_SIZE,
  },
});
