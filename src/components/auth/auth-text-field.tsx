import { Column, Text, TextInput, type TextInputProps } from "@expo/ui";

const MUTED = "#8E8E93";

type AuthTextFieldProps = TextInputProps & {
  label: string;
};

export function AuthTextField({
  label,
  ...textInputProps
}: AuthTextFieldProps) {
  return (
    <Column spacing={6}>
      <Text textStyle={{ color: MUTED }}>{label}</Text>
      <TextInput {...textInputProps} />
    </Column>
  );
}
