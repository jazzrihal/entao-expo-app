import type { ReactNode } from "react";
import { useColorScheme } from "react-native";
import { Column, Host, Spacer, Text } from "@expo/ui";
import { resolveColorScheme, SECONDARY_LABEL } from "@/lib/theme-colors";

type EmptyProps = {
  title: string;
  description?: string;
  testID?: string;
  action?: ReactNode;
  /** Where to pin copy when a centered system sheet would cover mid-screen. */
  contentAlign?: "center" | "top" | "bottom";
};

export function Empty({
  title,
  description,
  testID,
  action,
  contentAlign = "center",
}: EmptyProps) {
  const secondaryColor = SECONDARY_LABEL[resolveColorScheme(useColorScheme())];

  return (
    <Host style={{ flex: 1 }} testID={testID}>
      <Column
        alignment="center"
        spacing={8}
        style={{
          paddingHorizontal: 24,
          ...(contentAlign === "top" ? { paddingTop: 24 } : null),
          ...(contentAlign === "bottom" ? { paddingBottom: 24 } : null),
        }}
      >
        {contentAlign !== "top" ? <Spacer flexible /> : null}
        <Text textStyle={{ fontWeight: "600", textAlign: "center" }}>
          {title}
        </Text>
        {description ? (
          <Text textStyle={{ textAlign: "center", color: secondaryColor }}>
            {description}
          </Text>
        ) : null}
        {action}
        {contentAlign !== "bottom" ? <Spacer flexible /> : null}
      </Column>
    </Host>
  );
}
