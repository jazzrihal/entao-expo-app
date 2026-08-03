import { useState } from "react";
import { ActivityIndicator } from "react-native";
import { Button, Column, Row, Text as UiText } from "@expo/ui";
import { router, useTheme } from "expo-router";
import { AuthScreen } from "@/components/auth/auth-screen";
import { AuthTextField } from "@/components/auth/auth-text-field";
import { useAuth } from "@/context/auth";

export default function SignUp() {
  const { colors } = useTheme();
  const { signUp } = useAuth();
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
    setError(null);
    setLoading(true);
    const { error, needsConfirmation } = await signUp(email.trim(), password);
    setLoading(false);
    if (error) {
      setError(error);
    } else if (needsConfirmation) {
      setNeedsConfirmation(true);
    }
  }

  if (needsConfirmation) {
    return (
      <AuthScreen
        testID="sign-up-confirmation"
        title="Check your email"
        subtitle={`We sent a confirmation link to ${email}. Click the link to activate your account.`}
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
      subtitle="Sign up to get started"
      action={
        <Button
          testID="sign-up-button"
          variant="filled"
          label={loading ? undefined : "Create account"}
          onPress={handleSignUp}
          disabled={loading}
        >
          {loading ? <ActivityIndicator color={colors.text} /> : null}
        </Button>
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
      <Column spacing={12} style={{ width: "100%" }}>
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

        {error ? (
          <UiText
            testID="sign-up-error"
            textStyle={{ color: colors.notification as string }}
          >
            {error}
          </UiText>
        ) : null}
      </Column>
    </AuthScreen>
  );
}
