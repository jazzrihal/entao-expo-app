import { StyleSheet, Text, useColorScheme, View } from "react-native";
import { MAX_FRIENDS } from "@/lib/friends";
import {
  ELEVATED_BACKGROUND,
  resolveColorScheme,
  SECONDARY_LABEL,
  SEPARATOR_COLOR,
} from "@/lib/theme-colors";

const TRACK_COLORS = {
  light: "#E5E5EA",
  dark: "#3A3A3C",
} as const;

const FILL_COLORS = {
  light: "#007AFF",
  dark: "#0A84FF",
} as const;

type FriendsCountBarProps = {
  count: number;
};

export function FriendsCountBar({ count }: FriendsCountBarProps) {
  const theme = resolveColorScheme(useColorScheme());
  const clampedCount = Math.min(Math.max(count, 0), MAX_FRIENDS);
  const progress = clampedCount / MAX_FRIENDS;

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: ELEVATED_BACKGROUND[theme],
          borderBottomColor: SEPARATOR_COLOR[theme],
        },
      ]}
      testID="friends-count-bar"
    >
      <Text
        testID="friends-count-label"
        style={[styles.label, { color: SECONDARY_LABEL[theme] }]}
      >
        {`${clampedCount} of ${MAX_FRIENDS} friends`}
      </Text>
      <View
        accessibilityLabel={`${clampedCount} of ${MAX_FRIENDS} friends`}
        accessibilityRole="progressbar"
        accessibilityValue={{
          min: 0,
          max: MAX_FRIENDS,
          now: clampedCount,
        }}
        style={[styles.track, { backgroundColor: TRACK_COLORS[theme] }]}
      >
        <View
          style={[
            styles.fill,
            {
              backgroundColor: FILL_COLORS[theme],
              width: `${progress * 100}%`,
            },
          ]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
    gap: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  label: {
    fontSize: 15,
    fontWeight: "600",
  },
  track: {
    height: 6,
    borderRadius: 3,
    overflow: "hidden",
  },
  fill: {
    height: "100%",
    borderRadius: 3,
  },
});
