import { StyleSheet, Text, useColorScheme, View } from "react-native";
import * as WebBrowser from "expo-web-browser";
import { TERMS_URL } from "@/lib/terms";
import { resolveColorScheme } from "@/lib/theme-colors";

const MUTED = "#8E8E93";
const LINK_COLOR = {
  light: "#007AFF",
  dark: "#0A84FF",
} as const;

async function openTerms() {
  await WebBrowser.openBrowserAsync(TERMS_URL);
}

/** Static disclaimer for sign-in — no checkbox, no submit gating. */
export function TermsDisclaimer() {
  const theme = resolveColorScheme(useColorScheme());

  return (
    <View style={styles.root} testID="auth-terms-disclaimer">
      <Text style={styles.text}>
        By continuing you agree to our{" "}
        <Text
          testID="auth-terms-link"
          style={[styles.link, { color: LINK_COLOR[theme] }]}
          onPress={() => {
            void openTerms();
          }}
        >
          Terms of Service
        </Text>
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    width: "100%",
    alignItems: "center",
  },
  text: {
    color: MUTED,
    fontSize: 13,
    lineHeight: 18,
    textAlign: "center",
  },
  link: {
    fontWeight: "600",
  },
});
