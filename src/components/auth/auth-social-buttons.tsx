import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Platform,
  StyleSheet,
  Text,
  View,
  useColorScheme,
} from "react-native";
import * as AppleAuthentication from "expo-apple-authentication";
import { useTheme } from "expo-router";

type AuthSocialButtonsProps = {
  onApplePress: (opts?: {
    onAfterNativeAuth?: () => void;
  }) => Promise<{ error: string | null }>;
  onError: (message: string) => void;
  disabled?: boolean;
};

const MUTED = "#8E8E93";

export function AuthSocialButtons({
  onApplePress,
  onError,
  disabled = false,
}: AuthSocialButtonsProps) {
  const { colors } = useTheme();
  const colorScheme = useColorScheme();
  const [appleAvailable, setAppleAvailable] = useState(false);
  const [loading, setLoading] = useState(false);
  // Ref avoids re-rendering the native Apple button while its sheet is open.
  const appleInFlightRef = useRef(false);

  useEffect(() => {
    if (Platform.OS !== "ios") return;
    AppleAuthentication.isAvailableAsync().then(setAppleAvailable);
  }, []);

  async function handleApple() {
    if (disabled || loading || appleInFlightRef.current) return;
    appleInFlightRef.current = true;
    try {
      // Keep AppleAuthenticationButton mounted during the system sheet so cancel /
      // back-dismiss cannot leave a remounted native control stuck disabled.
      const { error } = await onApplePress({
        onAfterNativeAuth: () => setLoading(true),
      });
      if (error) onError(error);
    } catch (e) {
      onError(e instanceof Error ? e.message : "Apple sign-in failed.");
    } finally {
      appleInFlightRef.current = false;
      setLoading(false);
    }
  }

  if (!appleAvailable) return null;

  return (
    <View style={styles.root}>
      <View style={styles.dividerRow}>
        <View
          style={[styles.dividerLine, { backgroundColor: colors.border }]}
        />
        <Text style={styles.orLabel}>or</Text>
        <View
          style={[styles.dividerLine, { backgroundColor: colors.border }]}
        />
      </View>

      <View style={styles.buttons}>
        <View testID="auth-apple-button" style={styles.appleWrap}>
          <AppleAuthentication.AppleAuthenticationButton
            buttonType={
              AppleAuthentication.AppleAuthenticationButtonType.CONTINUE
            }
            buttonStyle={
              colorScheme === "dark"
                ? AppleAuthentication.AppleAuthenticationButtonStyle.WHITE
                : AppleAuthentication.AppleAuthenticationButtonStyle.BLACK
            }
            cornerRadius={8}
            style={[styles.appleButton, loading && styles.hiddenButton]}
            onPress={handleApple}
          />
          {loading ? (
            <View style={styles.appleLoading} pointerEvents="none">
              <ActivityIndicator color={colors.text} />
            </View>
          ) : null}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    width: "100%",
    gap: 16,
    alignItems: "center",
  },
  dividerRow: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  dividerLine: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
  },
  orLabel: {
    color: MUTED,
    fontSize: 13,
  },
  buttons: {
    width: "100%",
    gap: 12,
    alignItems: "center",
  },
  appleWrap: {
    width: "100%",
    maxWidth: 320,
    minHeight: 44,
    justifyContent: "center",
    alignItems: "center",
  },
  appleButton: {
    width: "100%",
    height: 44,
  },
  hiddenButton: {
    opacity: 0,
  },
  appleLoading: {
    ...StyleSheet.absoluteFill,
    justifyContent: "center",
    alignItems: "center",
  },
});
