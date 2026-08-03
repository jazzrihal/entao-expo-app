import { useRef } from "react";
import {
  Column,
  Text,
  TextInput,
  type TextInputProps,
  type TextInputRef,
} from "@expo/ui";
import { useAuthKeyboard } from "@/components/auth/auth-keyboard";

const MUTED = "#8E8E93";

type AuthTextFieldProps = TextInputProps & {
  label: string;
};

export function AuthTextField({
  label,
  onFocus,
  onBlur,
  ...textInputProps
}: AuthTextFieldProps) {
  const inputRef = useRef<TextInputRef>(null);
  const keyboard = useAuthKeyboard();

  return (
    <Column spacing={6} style={{ width: "100%" }}>
      <Text textStyle={{ color: MUTED }}>{label}</Text>
      <TextInput
        ref={inputRef}
        {...textInputProps}
        onFocus={() => {
          keyboard?.setFocusedInput(inputRef.current);
          onFocus?.();
        }}
        onBlur={() => {
          keyboard?.setFocusedInput(null);
          onBlur?.();
        }}
      />
    </Column>
  );
}
