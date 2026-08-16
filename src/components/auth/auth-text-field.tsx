import { useRef, useState } from "react";
import { Pressable, StyleSheet, useColorScheme, View } from "react-native";
import {
  Column,
  Host,
  Text,
  TextInput,
  type TextInputProps,
  type TextInputRef,
} from "@expo/ui";
import { useTheme } from "expo-router";
import { SymbolView } from "expo-symbols";
import { useAuthKeyboard } from "@/components/auth/auth-keyboard";
import {
  ELEVATED_BACKGROUND,
  META_TEXT_COLOR,
  SECONDARY_LABEL,
  SEPARATOR_COLOR,
  resolveColorScheme,
} from "@/lib/theme-colors";

const LABEL_FONT_SIZE = 15;
const COLUMN_SPACING = 8;
const INPUT_MIN_HEIGHT = 48;
const INPUT_RADIUS = 12;
const TOGGLE_BUTTON_SIZE = 44;
const SYMBOL_SIZE = 22;

type AuthTextFieldProps = TextInputProps & {
  label: string;
};

export function AuthTextField({
  label,
  onFocus,
  onBlur,
  secureTextEntry,
  testID,
  style,
  textStyle,
  ...textInputProps
}: AuthTextFieldProps) {
  const inputRef = useRef<TextInputRef>(null);
  const keyboard = useAuthKeyboard();
  const { colors } = useTheme();
  const theme = resolveColorScheme(useColorScheme());
  const [focused, setFocused] = useState(false);
  const [visible, setVisible] = useState(false);

  const showToggle = Boolean(secureTextEntry);

  return (
    <View style={styles.wrap}>
      <Host
        ignoreSafeArea="all"
        matchContents={{ vertical: true }}
        style={{ width: "100%" }}
      >
        <Column spacing={COLUMN_SPACING} style={{ width: "100%" }}>
          <Text
            textStyle={{
              color: SECONDARY_LABEL[theme],
              fontSize: LABEL_FONT_SIZE,
              fontWeight: "500",
            }}
          >
            {label}
          </Text>
          <TextInput
            ref={inputRef}
            {...textInputProps}
            testID={testID}
            secureTextEntry={secureTextEntry && !visible}
            placeholderTextColor={META_TEXT_COLOR[theme]}
            style={{
              height: INPUT_MIN_HEIGHT,
              paddingHorizontal: 16,
              paddingVertical: 12,
              paddingRight: showToggle ? 44 : 16,
              backgroundColor: ELEVATED_BACKGROUND[theme],
              borderRadius: INPUT_RADIUS,
              ...style,
            }}
            textStyle={{
              color: theme === "dark" ? "#FFFFFF" : "#000000",
              ...textStyle,
            }}
            onFocus={() => {
              setFocused(true);
              keyboard?.setFocusedInput(inputRef.current);
              onFocus?.();
            }}
            onBlur={() => {
              setFocused(false);
              keyboard?.setFocusedInput(null);
              onBlur?.();
            }}
          />
        </Column>
      </Host>
      <View
        pointerEvents="none"
        style={[
          styles.outline,
          {
            borderWidth: focused ? 2 : 1,
            borderColor: focused ? colors.primary : SEPARATOR_COLOR[theme],
          },
        ]}
      />
      {showToggle ? (
        <Pressable
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel={visible ? "Hide password" : "Show password"}
          testID={testID ? `${testID}-toggle-visibility` : undefined}
          onPress={() => setVisible((current) => !current)}
          style={styles.toggle}
        >
          <SymbolView
            name={{
              ios: visible ? "eye.slash" : "eye",
              android: visible ? "visibility_off" : "visibility",
            }}
            tintColor={SECONDARY_LABEL[theme]}
            size={SYMBOL_SIZE}
            accessible={false}
          />
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: "relative",
    width: "100%",
    overflow: "visible",
  },
  outline: {
    position: "absolute",
    left: 0,
    right: 0,
    top: LABEL_FONT_SIZE + COLUMN_SPACING,
    height: INPUT_MIN_HEIGHT,
    borderRadius: INPUT_RADIUS,
  },
  toggle: {
    position: "absolute",
    right: 4,
    top:
      LABEL_FONT_SIZE +
      COLUMN_SPACING +
      (INPUT_MIN_HEIGHT - TOGGLE_BUTTON_SIZE) / 2,
    width: TOGGLE_BUTTON_SIZE,
    height: TOGGLE_BUTTON_SIZE,
    alignItems: "center",
    justifyContent: "center",
  },
});
