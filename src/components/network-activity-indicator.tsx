import { SpinningIcon } from "@/components/spinning-icon";
import { useNetworkActivity } from "@/hooks/useNetworkActivity";
import { useEffect } from "react";
import { StyleSheet } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const FADE_MS = 200;
/** Lower band of the 44pt compact bar, just under the centered title. */
const BELOW_TITLE_TOP = 35;

export function NetworkActivityIndicator() {
  const active = useNetworkActivity();
  const insets = useSafeAreaInsets();
  const opacity = useSharedValue(0);

  useEffect(() => {
    opacity.value = withTiming(active ? 1 : 0, { duration: FADE_MS });
  }, [active, opacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      testID={active ? "network-activity-indicator" : undefined}
      accessible={active}
      accessibilityLabel={active ? "Uploading" : undefined}
      pointerEvents="none"
      style={[styles.pill, { top: insets.top + BELOW_TITLE_TOP }, animatedStyle]}
    >
      <SpinningIcon
        name="arrow.triangle.2.circlepath"
        size={10}
        spinning={active}
      />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  pill: {
    position: "absolute",
    alignSelf: "center",
    zIndex: 1000,
    elevation: 1000,
    backgroundColor: "rgba(0, 0, 0, 0.55)",
    borderRadius: 12,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
});
