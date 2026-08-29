import { StyleSheet, Text, useColorScheme, View } from "react-native";
import { Checkbox, Host } from "@expo/ui";
import * as WebBrowser from "expo-web-browser";
import { TERMS_URL } from "@/lib/terms";
import { resolveColorScheme } from "@/lib/theme-colors";

const LINK_COLOR = {
  light: "#007AFF",
  dark: "#0A84FF",
} as const;

type TermsAgreementProps = {
  checked: boolean;
  onChange: (value: boolean) => void;
  disabled?: boolean;
};

async function openTerms() {
  await WebBrowser.openBrowserAsync(TERMS_URL);
}

export function TermsAgreement({
  checked,
  onChange,
  disabled = false,
}: TermsAgreementProps) {
  const theme = resolveColorScheme(useColorScheme());

  return (
    <View style={styles.root} testID="auth-terms-agreement">
      <Text
        style={[
          styles.text,
          { color: theme === "dark" ? "#FFFFFF" : "#000000" },
        ]}
      >
        I agree to the{" "}
        <Text
          testID="auth-terms-link"
          style={[
            styles.link,
            { color: LINK_COLOR[theme] },
            disabled && styles.linkDisabled,
          ]}
          onPress={
            disabled
              ? undefined
              : () => {
                  void openTerms();
                }
          }
        >
          Terms of Service
        </Text>
      </Text>
      <Host matchContents={{ vertical: true }} style={styles.checkboxHost}>
        <Checkbox
          testID="auth-terms-checkbox"
          value={checked}
          onValueChange={onChange}
          disabled={disabled}
        />
      </Host>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    maxWidth: "100%",
    gap: 8,
  },
  checkboxHost: {
    // matchContents can slightly under-measure the native toggle's width,
    // clipping its trailing edge — a fixed, generous width avoids that.
    width: 70,
  },
  text: {
    flexShrink: 1,
    fontSize: 15,
    lineHeight: 20,
  },
  link: {
    fontWeight: "600",
  },
  linkDisabled: {
    opacity: 0.5,
  },
});
