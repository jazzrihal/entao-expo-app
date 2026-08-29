import { StyleSheet, View } from "react-native";
import { Button, Checkbox, Column, Host, Row, Text } from "@expo/ui";
import * as WebBrowser from "expo-web-browser";
import { TERMS_URL } from "@/lib/terms";

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
  return (
    <View style={styles.root} testID="auth-terms-agreement">
      <Host matchContents ignoreSafeArea="all">
        <Column spacing={8}>
          <Checkbox
            testID="auth-terms-checkbox"
            value={checked}
            onValueChange={onChange}
            disabled={disabled}
            label="I agree to the Terms of Service"
          />
          <Row spacing={4} alignment="center">
            <Text textStyle={{ color: MUTED }}>Read the</Text>
            <Button
              testID="auth-terms-link"
              variant="text"
              label="Terms of Service"
              disabled={disabled}
              onPress={() => {
                void openTerms();
              }}
            />
          </Row>
        </Column>
      </Host>
    </View>
  );
}

const MUTED = "#8E8E93";

const styles = StyleSheet.create({
  root: {
    width: "100%",
    alignItems: "flex-start",
  },
});
