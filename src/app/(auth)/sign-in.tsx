import { useState } from "react";
import { Alert, Text, useColorScheme, View } from "react-native";
import { Button, Row, Text as UiText } from "@expo/ui";
import { router } from "expo-router";
import { AuthScreen } from "@/components/auth/auth-screen";
import { AuthSocialButtons } from "@/components/auth/auth-social-buttons";
import { AuthSubmitButton } from "@/components/auth/auth-submit-button";
import { AuthTextField } from "@/components/auth/auth-text-field";
import { TermsDisclaimer } from "@/components/auth/terms-disclaimer";
import { useAuth } from "@/context/auth";
import {
  ERROR_BACKGROUND,
  ERROR_TEXT,
  resolveColorScheme,
} from "@/lib/theme-colors";
import {
  attemptPreviewSignIn,
  commitSupabaseTarget,
  hasPreviewCredentials,
  isLocalSupabase,
  useSupabaseTarget,
} from "@/lib/supabase";
import { canOfferPreview, isPreviewTriggerEmail } from "@/lib/supabase-target";

function confirmPreviewSwitch(): Promise<"switch" | "keep"> {
  return new Promise((resolve) => {
    Alert.alert(
      "Switch to preview?",
      "This signs you in against the preview project instead of production.",
      [
        {
          text: "Not now",
          style: "cancel",
          onPress: () => resolve("keep"),
        },
        { text: "Switch", onPress: () => resolve("switch") },
      ],
      { cancelable: false },
    );
  });
}

export default function SignIn() {
  const theme = resolveColorScheme(useColorScheme());
  const { signIn, signInWithApple } = useAuth();
  const supabaseTarget = useSupabaseTarget();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSignIn() {
    const trimmedEmail = email.trim();
    if (!trimmedEmail || !password) {
      setError("Please enter your email and password.");
      return;
    }
    setLoading(true);
    setError(null);

    const offerPreview =
      canOfferPreview({
        useLocal: isLocalSupabase,
        currentTarget: supabaseTarget,
        previewConfigured: hasPreviewCredentials(),
      }) && isPreviewTriggerEmail(trimmedEmail);

    if (offerPreview) {
      const choice = await confirmPreviewSwitch();
      if (choice === "switch") {
        const { error: previewError, client } = await attemptPreviewSignIn(
          trimmedEmail,
          password,
        );
        if (previewError) {
          setLoading(false);
          setError(previewError);
          return;
        }
        await commitSupabaseTarget("preview", client);
        return;
      }
    }

    const { error } = await signIn(trimmedEmail, password);
    setLoading(false);
    setError(error);
  }

  return (
    <AuthScreen
      title="Welcome back"
      action={
        <AuthSubmitButton
          testID="sign-in-button"
          label="Sign in"
          onPress={handleSignIn}
          loading={loading}
        />
      }
      social={
        <AuthSocialButtons
          disabled={loading}
          onApplePress={async (opts) => {
            const result = await signInWithApple(opts);
            if (!result.error) setError(null);
            return result;
          }}
          onError={(message) => setError(message)}
        />
      }
      footer={
        <>
          {supabaseTarget === "preview" ? (
            <Button
              variant="text"
              label="Preview mode"
              disabled={loading}
              onPress={() => {
                void commitSupabaseTarget("production");
              }}
            />
          ) : null}
          <Row spacing={4} alignment="center">
            <UiText>{"Don't have an account?"}</UiText>
            <Button
              testID="sign-in-link-to-sign-up"
              variant="text"
              label="Sign up"
              onPress={() => router.replace("/(auth)/sign-up")}
            />
          </Row>
        </>
      }
    >
      <View style={{ width: "100%", gap: 16 }}>
        {error ? (
          <Text
            testID="sign-in-error"
            style={{
              backgroundColor: ERROR_BACKGROUND[theme],
              color: ERROR_TEXT[theme],
              borderRadius: 10,
              padding: 12,
            }}
          >
            {error}
          </Text>
        ) : null}

        <AuthTextField
          label="Email"
          testID="sign-in-email"
          onChangeText={setEmail}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="email-address"
          autoComplete="email"
          returnKeyType="next"
          placeholder="you@example.com"
        />

        <AuthTextField
          label="Password"
          testID="sign-in-password"
          onChangeText={setPassword}
          secureTextEntry
          autoComplete="password"
          returnKeyType="done"
          onSubmitEditing={handleSignIn}
          placeholder="••••••••"
        />

        <TermsDisclaimer />
      </View>
    </AuthScreen>
  );
}
