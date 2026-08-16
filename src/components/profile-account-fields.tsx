import { useCallback, useRef, useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import {
  Host,
  FieldGroup,
  RNHostView,
  Text,
  TextInput,
  type TextInputRef,
} from "@expo/ui";
import CommunityDateTimePicker from "@expo/ui/community/datetime-picker";

const DOB_PICKER_FALLBACK = new Date(2000, 0, 1);

export type ProfileAccountFieldsProps = {
  username: string;
  displayName: string;
  dateOfBirth: Date | undefined;
  email: string | undefined;
  onUsernameChange: (value: string) => void;
  onDisplayNameChange: (value: string) => void;
  onDateOfBirthChange: (value: Date) => void;
  errorMessage: string | null;
};

export function ProfileAccountFields({
  username,
  displayName,
  dateOfBirth,
  email,
  onUsernameChange,
  onDisplayNameChange,
  onDateOfBirthChange,
  errorMessage,
}: ProfileAccountFieldsProps) {
  const usernameRef = useRef<TextInputRef>(null);
  const displayNameRef = useRef<TextInputRef>(null);
  const focusedRef = useRef<TextInputRef | null>(null);
  const [focused, setFocused] = useState(false);

  const dismiss = useCallback(() => {
    focusedRef.current?.blur();
  }, []);

  return (
    <View style={{ flex: 1 }}>
      <KeyboardAwareScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
        onScrollBeginDrag={dismiss}
      >
        <Host style={{ flex: 1 }}>
          <FieldGroup testID="profile-account-fields">
            <FieldGroup.Section title="Username">
              <TextInput
                ref={usernameRef}
                testID="profile-account-username"
                defaultValue={username}
                onChangeText={onUsernameChange}
                onFocus={() => {
                  focusedRef.current = usernameRef.current;
                  setFocused(true);
                }}
                onBlur={() => {
                  focusedRef.current = null;
                  setFocused(false);
                }}
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="username"
                placeholder="Username"
              />
            </FieldGroup.Section>
            <FieldGroup.Section title="Display Name">
              <TextInput
                ref={displayNameRef}
                testID="profile-account-display-name"
                defaultValue={displayName}
                onChangeText={onDisplayNameChange}
                onFocus={() => {
                  focusedRef.current = displayNameRef.current;
                  setFocused(true);
                }}
                onBlur={() => {
                  focusedRef.current = null;
                  setFocused(false);
                }}
                autoCapitalize="words"
                placeholder="Display name"
              />
            </FieldGroup.Section>
            <FieldGroup.Section title="Date of birth">
              <RNHostView matchContents>
                <CommunityDateTimePicker
                  testID="profile-account-dob"
                  value={dateOfBirth ?? DOB_PICKER_FALLBACK}
                  mode="date"
                  onValueChange={(_, date) => {
                    onDateOfBirthChange(date);
                  }}
                />
              </RNHostView>
            </FieldGroup.Section>
            <FieldGroup.Section title="Email">
              <Text testID="profile-account-email">{email ?? ""}</Text>
            </FieldGroup.Section>
            {errorMessage ? (
              <FieldGroup.Section>
                <Text testID="profile-account-error">{errorMessage}</Text>
              </FieldGroup.Section>
            ) : null}
          </FieldGroup>
        </Host>
      </KeyboardAwareScrollView>
      {focused ? (
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={dismiss}
          accessible={false}
        />
      ) : null}
    </View>
  );
}
