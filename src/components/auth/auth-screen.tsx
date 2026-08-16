import type { ReactNode } from "react";
import { Pressable, useColorScheme, View } from "react-native";
import { Column, Host, Text } from "@expo/ui";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  AuthKeyboardProvider,
  useAuthKeyboard,
} from "@/components/auth/auth-keyboard";
import { Image } from "@/components/image";

const MUTED = "#8E8E93";
const LOGO_LIGHT = require("../../../assets/images/logo-light.png");
const LOGO_DARK = require("../../../assets/images/logo-dark.png");

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
  const colorScheme = useColorScheme();

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
          style={{
            flex: 1,
            justifyContent: "space-between",
            width: "100%",
          }}
        >
          <View style={{ width: "100%", alignItems: "center" }}>
            <Image
              source={colorScheme === "dark" ? LOGO_DARK : LOGO_LIGHT}
              style={{ width: 176, height: 176, backgroundColor: "transparent" }}
              contentFit="contain"
              accessibilityLabel="Então"
            />
          </View>

          <View style={{ width: "100%", gap: 24 }}>
            {title ? (
              <CenteredHost>
                <Column spacing={8} alignment="center">
                  <Text textStyle={{ color: MUTED }}>{title}</Text>
                </Column>
              </CenteredHost>
            ) : null}

            {children ? (
              <View style={{ width: "100%", gap: 24 }}>{children}</View>
            ) : null}

            {action ? (
              <View style={{ width: "100%", alignItems: "center" }}>
                {action}
              </View>
            ) : null}

            {social ? <View style={{ width: "100%" }}>{social}</View> : null}

            {footer ? (
              <CenteredHost>
                <Column spacing={24} alignment="center">
                  {footer}
                </Column>
              </CenteredHost>
            ) : null}
          </View>
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
