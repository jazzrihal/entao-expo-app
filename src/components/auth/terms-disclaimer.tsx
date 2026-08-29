import { StyleSheet, View } from "react-native";
import { Button, Host, Row, Text } from "@expo/ui";
import * as WebBrowser from "expo-web-browser";
import { TERMS_URL } from "@/lib/terms";

async function openTerms() {
  await WebBrowser.openBrowserAsync(TERMS_URL);
}

/** Static disclaimer for sign-in — no checkbox, no submit gating. */
export function TermsDisclaimer() {
  return (
    <View style={styles.root} testID="auth-terms-disclaimer">
      <Host matchContents ignoreSafeArea="all">
        <Row spacing={4} alignment="center">
          <Text textStyle={{ color: MUTED }}>
            By continuing you agree to our
          </Text>
          <Button
            testID="auth-terms-link"
            variant="text"
            label="Terms of Service"
            onPress={() => {
              void openTerms();
            }}
          />
        </Row>
      </Host>
    </View>
  );
}

const MUTED = "#8E8E93";

const styles = StyleSheet.create({
  root: {
    width: "100%",
    alignItems: "center",
  },
});
