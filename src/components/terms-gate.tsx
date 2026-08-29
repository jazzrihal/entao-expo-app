import { useState } from "react";
import { Text, useColorScheme, View } from "react-native";
import { Button, Host } from "@expo/ui";
import * as WebBrowser from "expo-web-browser";
import { AuthScreen } from "@/components/auth/auth-screen";
import { AuthSubmitButton } from "@/components/auth/auth-submit-button";
import {
  ERROR_BACKGROUND,
  ERROR_TEXT,
  resolveColorScheme,
} from "@/lib/theme-colors";
import { TERMS_URL } from "@/lib/terms";
import {
  useAcceptTermsMutation,
  useCurrentTermsQuery,
  useHasAcceptedCurrentTermsQuery,
} from "@/queries/terms";

type TermsGateProps = {
  children: React.ReactNode;
};

/**
 * Blocks authenticated app access until the current Terms of Service are
 * accepted. This is the only code path that calls `accept_terms`.
 */
export function TermsGate({ children }: TermsGateProps) {
  const theme = resolveColorScheme(useColorScheme());
  const acceptedQuery = useHasAcceptedCurrentTermsQuery();
  const currentTermsQuery = useCurrentTermsQuery({
    enabled: acceptedQuery.isSuccess && acceptedQuery.data === false,
  });
  const acceptMutation = useAcceptTermsMutation();
  const [error, setError] = useState<string | null>(null);

  if (acceptedQuery.isPending) return null;

  if (acceptedQuery.isError) {
    return (
      <AuthScreen
        testID="terms-gate"
        title="We couldn't verify your Terms acceptance. Check your connection and try again."
        action={
          <AuthSubmitButton
            testID="terms-gate-retry-button"
            label="Retry"
            loading={acceptedQuery.isFetching}
            onPress={() => {
              void acceptedQuery.refetch();
            }}
          />
        }
      />
    );
  }

  if (acceptedQuery.data === true) {
    return children;
  }

  async function handleAccept() {
    setError(null);
    let terms = currentTermsQuery.data;
    if (!terms) {
      const result = await currentTermsQuery.refetch();
      if (result.error || !result.data) {
        setError(
          result.error?.message ??
            "Couldn't load the current Terms. Try again.",
        );
        return;
      }
      terms = result.data;
    }
    try {
      await acceptMutation.mutateAsync({
        slug: terms.slug,
        hash: terms.content_hash,
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't record acceptance.");
    }
  }

  return (
    <AuthScreen
      testID="terms-gate"
      title="One more thing"
      action={
        <AuthSubmitButton
          testID="terms-gate-accept-button"
          label="Accept Terms of Service"
          loading={acceptMutation.isPending || currentTermsQuery.isFetching}
          onPress={() => {
            void handleAccept();
          }}
        />
      }
    >
      <View style={{ width: "100%", gap: 16, alignItems: "center" }}>
        <Text
          style={{
            color: theme === "dark" ? "#EBEBF5" : "#3C3C43",
            textAlign: "center",
            fontSize: 16,
            lineHeight: 22,
          }}
        >
          Please review and accept the Terms of Service to continue using Então.
          We have a zero-tolerance policy for objectionable content and abusive
          users.
        </Text>

        <Host matchContents ignoreSafeArea="all">
          <Button
            testID="terms-gate-link"
            variant="text"
            label="Read Terms of Service"
            onPress={() => {
              void WebBrowser.openBrowserAsync(
                currentTermsQuery.data?.url ?? TERMS_URL,
              );
            }}
          />
        </Host>

        {error ? (
          <Text
            testID="terms-gate-error"
            style={{
              backgroundColor: ERROR_BACKGROUND[theme],
              color: ERROR_TEXT[theme],
              borderRadius: 10,
              padding: 12,
              width: "100%",
            }}
          >
            {error}
          </Text>
        ) : null}
      </View>
    </AuthScreen>
  );
}
