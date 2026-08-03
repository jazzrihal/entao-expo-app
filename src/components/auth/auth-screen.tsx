import type { ReactNode } from "react";
import { Column, Host, ScrollView, Text } from "@expo/ui";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const MUTED = "#8E8E93";

type AuthScreenProps = {
  title: string;
  subtitle?: string;
  footer?: ReactNode;
  testID?: string;
  children: ReactNode;
};

export function AuthScreen({
  title,
  subtitle,
  footer,
  testID,
  children,
}: AuthScreenProps) {
  const insets = useSafeAreaInsets();

  return (
    <Host testID={testID} ignoreSafeArea="keyboard" style={{ flex: 1 }}>
      <ScrollView>
        <Column
          spacing={24}
          style={{
            paddingTop: insets.top + 24,
            paddingHorizontal: 24,
            paddingBottom: 24,
          }}
        >
          <Text textStyle={{ fontSize: 32, fontWeight: "700" }}>Então</Text>

          <Column spacing={8}>
            <Text textStyle={{ fontSize: 22, fontWeight: "600" }}>{title}</Text>
            {subtitle ? (
              <Text textStyle={{ color: MUTED }}>{subtitle}</Text>
            ) : null}
          </Column>

          {children}

          {footer}
        </Column>
      </ScrollView>
    </Host>
  );
}
