import { useState } from "react";
import { Text, useColorScheme, View } from "react-native";
import { Button, Row, Text as UiText } from "@expo/ui";
import { router } from "expo-router";
import { AuthScreen } from "@/components/auth/auth-screen";
import { AuthSocialButtons } from "@/components/auth/auth-social-buttons";
import { AuthSubmitButton } from "@/components/auth/auth-submit-button";
import { AuthTextField } from "@/components/auth/auth-text-field";
import { useAuth } from "@/context/auth";
import {
  ERROR_BACKGROUND,
  ERROR_TEXT,
  resolveColorScheme,
} from "@/lib/theme-colors";

export default function SignUp() {
  const theme = resolveColorScheme(useColorScheme());
  const { signUp, signInWithApple } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [needsConfirmation, setNeedsConfirmation] = useState(false);

  async function handleSignUp() {
    if (!email || !password) {
      setError("Please fill in all fields.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    setLoading(true);
    const { error, needsConfirmation } = await signUp(email.trim(), password);
    setLoading(false);
    if (error) {
      setError(error);
    } else if (needsConfirmation) {
      setNeedsConfirmation(true);
    } else {
      setError(null);
    }
  }

  if (needsConfirmation) {
    return (
      <AuthScreen
        testID="sign-up-confirmation"
        title={`We sent a confirmation link to ${email}. Click the link to activate your account.`}
        footer={
          <Button
            variant="text"
            label="Back to sign in"
            onPress={() => router.replace("/(auth)/sign-in")}
          />
        }
      />
    );
  }

  return (
    <AuthScreen
      title="Create account"
      action={
        <AuthSubmitButton
          testID="sign-up-button"
          label="Create account"
          onPress={handleSignUp}
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
        <Row spacing={4} alignment="center">
          <UiText>Already have an account?</UiText>
          <Button
            testID="sign-up-link-to-sign-in"
            variant="text"
            label="Sign in"
            onPress={() => router.replace("/(auth)/sign-in")}
          />
        </Row>
      }
    >
      <View style={{ width: "100%", gap: 16 }}>
        {error ? (
          <Text
            testID="sign-up-error"
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
          testID="sign-up-email"
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
          testID="sign-up-password"
          onChangeText={setPassword}
          secureTextEntry
          autoComplete="new-password"
          returnKeyType="next"
          placeholder="••••••••"
        />

        <AuthTextField
          label="Confirm password"
          testID="sign-up-confirm-password"
          onChangeText={setConfirmPassword}
          secureTextEntry
          autoComplete="new-password"
          returnKeyType="done"
          onSubmitEditing={handleSignUp}
          placeholder="••••••••"
        />
      </View>
    </AuthScreen>
  );
}
