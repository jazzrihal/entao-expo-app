import "@/lib/query-native";
import { useEffect } from "react";
import * as Linking from "expo-linking";
import { DarkTheme, DefaultTheme, Slot, ThemeProvider } from "expo-router";
import { QueryClientProvider } from "@tanstack/react-query";
import { useColorScheme } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { AuthProvider } from "@/context/auth";
import { queryClient } from "@/lib/query-client";
import {
  markInitialPostLinkResolved,
  rememberPostReturnPath,
} from "@/lib/post-sharing";

export default function RootLayout() {
  const colorScheme = useColorScheme();

  // Capture cold-start / openURL post deep links before auth redirects clear
  // the route (returnTo for signed-out open of entao://post/{id}).
  useEffect(() => {
    void Linking.getInitialURL()
      .then((url) => {
        rememberPostReturnPath(url);
      })
      .finally(() => {
        markInitialPostLinkResolved();
      });
    const subscription = Linking.addEventListener("url", ({ url }) => {
      rememberPostReturnPath(url);
    });
    return () => subscription.remove();
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <KeyboardProvider>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <ThemeProvider
              value={colorScheme === "dark" ? DarkTheme : DefaultTheme}
            >
              <Slot />
            </ThemeProvider>
          </AuthProvider>
        </QueryClientProvider>
      </KeyboardProvider>
    </GestureHandlerRootView>
  );
}
