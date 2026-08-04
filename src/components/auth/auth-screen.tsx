import type { ReactNode } from "react";
import { Pressable, View } from "react-native";
import { Column, Host, Text } from "@expo/ui";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  AuthKeyboardProvider,
  useAuthKeyboard,
} from "@/components/auth/auth-keyboard";

const MUTED = "#8E8E93";

type AuthScreenProps = {
  title: string;
  /** Primary action (e.g. submit button). Centered horizontally. */
  action?: ReactNode;
  /** Native social buttons (outside Host — Apple SDK view). */
  social?: ReactNode;
  /** Secondary row (e.g. link to the other auth screen). Centered horizontally. */
  footer?: ReactNode;
  testID?: string;
  children?: ReactNode;
};

function CenteredHost({ children }: { children: ReactNode }) {
  return (
    <View style={{ width: "100%", alignItems: "center" }}>
      <Host matchContents ignoreSafeArea="all">
        {children}
      </Host>
    </View>
  );
}

function AuthScreenContent({
  title,
  action,
  social,
  footer,
  testID,
  children,
}: AuthScreenProps) {
  const keyboard = useAuthKeyboard();

  return (
    <SafeAreaView
      edges={["top", "bottom"]}
      style={{
        flex: 1,
        paddingBottom: 32,
        paddingHorizontal: 24,
      }}
      testID={testID}
    >
      <KeyboardAwareScrollView
        style={{ flex: 1 }}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ flexGrow: 1 }}
        onScrollBeginDrag={keyboard?.dismiss}
      >
        <Pressable
          accessible={false}
          onPress={keyboard?.dismiss}
          style={{ flex: 1 }}
        />

        <Pressable accessible={false} onPress={keyboard?.dismiss}>
          <CenteredHost>
            <Column spacing={24} alignment="center">
              <Text textStyle={{ fontSize: 32, fontWeight: "700" }}>Então</Text>

              <Column spacing={8} alignment="center">
                {title ? (
                  <Text textStyle={{ color: MUTED }}>{title}</Text>
                ) : null}
              </Column>
            </Column>
          </CenteredHost>
        </Pressable>

        <Pressable
          accessible={false}
          onPress={keyboard?.dismiss}
          style={{ flex: 2, minHeight: 24 }}
        />

        <Pressable
          accessible={false}
          onPress={keyboard?.dismiss}
          style={{ width: "100%", gap: 24 }}
        >
          {children ? (
            <Host
              ignoreSafeArea="all"
              matchContents={{ vertical: true }}
              style={{ width: "100%" }}
            >
              {children}
            </Host>
          ) : null}

          {action ? (
            <CenteredHost>
              <Column spacing={24} alignment="center">
                {action}
              </Column>
            </CenteredHost>
          ) : null}

          {social ? <View style={{ width: "100%" }}>{social}</View> : null}

          {footer ? (
            <CenteredHost>
              <Column spacing={24} alignment="center">
                {footer}
              </Column>
            </CenteredHost>
          ) : null}
        </Pressable>
      </KeyboardAwareScrollView>
    </SafeAreaView>
  );
}

export function AuthScreen(props: AuthScreenProps) {
  return (
    <AuthKeyboardProvider>
      <AuthScreenContent {...props} />
    </AuthKeyboardProvider>
  );
}
