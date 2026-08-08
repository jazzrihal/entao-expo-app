import { useState } from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  useColorScheme,
  View,
} from "react-native";
import type { PostBadge } from "@/lib/posts";

const RIBBON_BACKGROUNDS = {
  light: "#F2F2F7",
  dark: "#1C1C1E",
} as const;

const CHIP_BACKGROUNDS = {
  light: "#E5E5EA",
  dark: "#3A3A3C",
} as const;

const TEXT_COLORS = {
  light: "#1C1C1E",
  dark: "#F2F2F7",
} as const;

const SECONDARY_TEXT_COLORS = {
  light: "#6C6C70",
  dark: "#8E8E93",
} as const;

const SEPARATOR_COLORS = {
  light: "#C6C6C8",
  dark: "#38383A",
} as const;

type PostBadgesRibbonProps = {
  badges: PostBadge[];
  testIDPrefix: string;
};

export function PostBadgesRibbon({
  badges,
  testIDPrefix,
}: PostBadgesRibbonProps) {
  const colorScheme = useColorScheme();
  const theme = colorScheme === "dark" ? "dark" : "light";
  const [tooltipDescription, setTooltipDescription] = useState<string | null>(
    null,
  );

  if (badges.length === 0) {
    return null;
  }

  return (
    <View
      style={[
        styles.ribbon,
        {
          backgroundColor: RIBBON_BACKGROUNDS[theme],
          borderBottomColor: SEPARATOR_COLORS[theme],
        },
      ]}
      testID={`${testIDPrefix}-badges-ribbon`}
    >
      <View style={styles.chipRow}>
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
            onPressOut={() => {
              setTooltipDescription(null);
            }}
            style={[
              styles.chip,
              { backgroundColor: CHIP_BACKGROUNDS[theme] },
            ]}
          >
            <Text
              style={[styles.chipText, { color: TEXT_COLORS[theme] }]}
              numberOfLines={1}
            >
              {badge.badge_name}
            </Text>
          </Pressable>
        ))}
      </View>
      {tooltipDescription ? (
        <Text
          testID={`${testIDPrefix}-badge-tooltip`}
          style={[styles.tooltipText, { color: SECONDARY_TEXT_COLORS[theme] }]}
        >
          {tooltipDescription}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  ribbon: {
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 8,
    gap: 6,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  chip: {
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    maxWidth: "100%",
  },
  chipText: {
    fontSize: 12,
    fontWeight: "600",
  },
  tooltipText: {
    fontSize: 12,
    lineHeight: 16,
  },
});
