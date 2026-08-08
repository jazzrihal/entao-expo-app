import { useState } from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  View,
  type GestureResponderEvent,
} from "react-native";
import type { PostBadge } from "@/lib/posts";

type PostBadgesOverlayProps = {
  badges: PostBadge[];
  testIDPrefix: string;
};

export function PostBadgesOverlay({
  badges,
  testIDPrefix,
}: PostBadgesOverlayProps) {
  const [tooltipDescription, setTooltipDescription] = useState<string | null>(
    null,
  );

  if (badges.length === 0) {
    return null;
  }

  const dismissTooltip = () => {
    setTooltipDescription(null);
  };

  return (
    <View style={styles.strip} pointerEvents="box-none">
      {tooltipDescription ? (
        <View
          testID={`${testIDPrefix}-badge-tooltip`}
          style={styles.tooltip}
          pointerEvents="none"
        >
          <Text style={styles.tooltipText}>{tooltipDescription}</Text>
        </View>
      ) : null}
      <View style={styles.chipRow} pointerEvents="box-none">
        {badges.map((badge) => (
          <Pressable
            key={badge.badge_id}
            testID={`${testIDPrefix}-badge-${badge.badge_id}`}
            accessibilityRole="button"
            accessibilityLabel={badge.badge_name}
            accessibilityHint={badge.description}
            onLongPress={() => {
              setTooltipDescription(badge.description);
            }}
            onPressOut={(_event: GestureResponderEvent) => {
              dismissTooltip();
            }}
            style={styles.chip}
          >
            <Text style={styles.chipText} numberOfLines={1}>
              {badge.badge_name}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  strip: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingLeft: 8,
    paddingRight: 44,
    paddingBottom: 8,
    gap: 6,
  },
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  chip: {
    backgroundColor: "rgba(0,0,0,0.55)",
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    maxWidth: "100%",
  },
  chipText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "600",
  },
  tooltip: {
    alignSelf: "flex-start",
    maxWidth: "90%",
    backgroundColor: "rgba(0,0,0,0.55)",
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  tooltipText: {
    color: "#FFFFFF",
    fontSize: 12,
  },
});
