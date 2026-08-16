import { StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";
import { SymbolView, type SFSymbol } from "expo-symbols";
import { SpinningIcon } from "@/components/spinning-icon";

const SYMBOL_SIZE = 18;

type PostGridOverlayBadgeProps = {
  symbolName: SFSymbol;
  accessibilityLabel: string;
  testID?: string;
  bouncing?: boolean;
  style?: StyleProp<ViewStyle>;
};

export function PostGridOverlayBadge({
  symbolName,
  accessibilityLabel,
  testID,
  bouncing = false,
  style,
}: PostGridOverlayBadgeProps) {
  return (
    // Keep testID + accessibilityLabel on the same accessible node so XCUITest
    // / Maestro expose `resource-id` (SymbolView as the accessible child was
    // swallowing the parent testID).
    <View
      testID={testID}
      accessible
      accessibilityLabel={accessibilityLabel}
      style={[styles.badge, style]}
      pointerEvents="none"
    >
      {bouncing ? (
        <SpinningIcon
          name={symbolName}
          size={SYMBOL_SIZE}
          tintColor="#FFFFFF"
          bouncing
        />
      ) : (
        <SymbolView
          name={symbolName}
          tintColor="#FFFFFF"
          resizeMode="scaleAspectFit"
          style={styles.symbol}
          accessible={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    position: "absolute",
    bottom: 6,
    right: 6,
    backgroundColor: "rgba(0,0,0,0.55)",
    borderRadius: 12,
    padding: 4,
    overflow: "visible",
  },
  symbol: {
    width: SYMBOL_SIZE,
    height: SYMBOL_SIZE,
  },
});
