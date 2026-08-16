import { useEffect } from "react";
import { type StyleProp, type ViewStyle } from "react-native";
import { SymbolView, type SFSymbol } from "expo-symbols";
import Animated, {
  Easing,
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";

type SpinningIconProps = {
  name: SFSymbol;
  size?: number;
  tintColor?: string;
  spinning?: boolean;
  bouncing?: boolean;
  style?: StyleProp<ViewStyle>;
};

export function SpinningIcon({
  name,
  size = 18,
  tintColor = "#FFFFFF",
  spinning = false,
  bouncing = false,
  style,
}: SpinningIconProps) {
  const rotation = useSharedValue(0);
  const bounce = useSharedValue(0);

  useEffect(() => {
    if (bouncing) {
      cancelAnimation(rotation);
      rotation.value = 0;
      bounce.value = 0;
      bounce.value = withRepeat(
        withSequence(
          withTiming(-4, { duration: 280, easing: Easing.out(Easing.quad) }),
          withTiming(0, { duration: 280, easing: Easing.in(Easing.quad) }),
        ),
        -1,
      );
    } else if (spinning) {
      cancelAnimation(bounce);
      bounce.value = 0;
      rotation.value = 0;
      rotation.value = withRepeat(
        withTiming(360, { duration: 1000, easing: Easing.linear }),
        -1,
      );
    } else {
      cancelAnimation(rotation);
      cancelAnimation(bounce);
      rotation.value = 0;
      bounce.value = 0;
    }

    return () => {
      cancelAnimation(rotation);
      cancelAnimation(bounce);
    };
  }, [bouncing, spinning, rotation, bounce]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: bounce.value },
      { rotate: `${rotation.value}deg` },
    ],
  }));

  return (
    <Animated.View
      style={[{ width: size, height: size }, animatedStyle, style]}
    >
      <SymbolView
        name={name}
        tintColor={tintColor}
        resizeMode="scaleAspectFit"
        style={{ width: size, height: size }}
        accessible={false}
      />
    </Animated.View>
  );
}
