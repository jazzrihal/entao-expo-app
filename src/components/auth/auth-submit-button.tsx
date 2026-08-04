import { StyleSheet, View } from "react-native";
import { Button, Host } from "@expo/ui";

type AuthSubmitButtonProps = {
  label: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  testID?: string;
};

const BUTTON_SLOT_HEIGHT = 50;

export function AuthSubmitButton({
  label,
  onPress,
  loading = false,
  disabled = false,
  testID,
}: AuthSubmitButtonProps) {
  return (
    <View style={styles.wrap}>
      <Host matchContents ignoreSafeArea="all">
        <Button
          testID={testID}
          variant="filled"
          label={label}
          onPress={onPress}
          disabled={disabled || loading}
        />
      </Host>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    height: BUTTON_SLOT_HEIGHT,
    width: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
});
