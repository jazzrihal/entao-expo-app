import { useState } from "react";
import { ActivityIndicator } from "react-native";
import { Button, Column, Row, Text as UiText } from "@expo/ui";
import { router, useTheme } from "expo-router";
import { AuthScreen } from "@/components/auth/auth-screen";
import { AuthTextField } from "@/components/auth/auth-text-field";
import { useAuth } from "@/context/auth";

export default function SignIn() {
  const { colors } = useTheme();
  const { signIn } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSignIn() {
    if (!email || !password) {
      setError("Please enter your email and password.");
      return;
    }
    setError(null);
    setLoading(true);
    const { error } = await signIn(email.trim(), password);
    setLoading(false);
    if (error) setError(error);
  }

  return (
    <AuthScreen
      title="Welcome back"
      action={
        <Button
          testID="sign-in-button"
          variant="filled"
          label={loading ? undefined : "Sign in"}
          onPress={handleSignIn}
          disabled={loading}
        >
          {loading ? <ActivityIndicator color={colors.text} /> : null}
        </Button>
      }
      footer={
        <Row spacing={4} alignment="center">
          <UiText>{"Don't have an account?"}</UiText>
          <Button
            testID="sign-in-link-to-sign-up"
            variant="text"
            label="Sign up"
            onPress={() => router.replace("/(auth)/sign-up")}
          />
        </Row>
      }
    >
      <Column spacing={12} style={{ width: "100%" }}>
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

        {error ? (
          <UiText
            testID="sign-in-error"
            textStyle={{ color: colors.notification as string }}
          >
            {error}
          </UiText>
        ) : null}
      </Column>
    </AuthScreen>
  );
}
