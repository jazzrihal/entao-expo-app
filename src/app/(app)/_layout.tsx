import type { ReactNode } from "react";
import { Redirect, usePathname } from "expo-router";
import { Stack } from "expo-router/stack";
import { useAuth } from "@/context/auth";
import { PostManagerProvider } from "@/context/post-manager";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { validatePostReturnPath } from "@/lib/post-sharing";

export const unstable_settings = {
  anchor: "(tabs)",
};

/** Mounts push registration outside PostManagerProvider (not post-sync). */
function AuthenticatedShell({ children }: { children: ReactNode }) {
  usePushNotifications();
  return children;
}

export default function AppLayout() {
  const { session, loading } = useAuth();
  const returnTo = validatePostReturnPath(usePathname());

  if (loading) return null;

  if (!session) {
    return (
      <Redirect
        href={
          returnTo
            ? { pathname: "/(auth)/sign-in", params: { returnTo } }
            : "/(auth)/sign-in"
        }
      />
    );
  }

  return (
    <AuthenticatedShell>
      <PostManagerProvider>
        <Stack>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen
            name="user/[id]"
            options={{
              headerBackButtonDisplayMode: "minimal",
              headerLargeTitle: false,
            }}
          />
          <Stack.Screen
            name="post/[id]"
            options={{
              title: "",
              headerBackButtonDisplayMode: "minimal",
              headerLargeTitle: false,
            }}
          />
        </Stack>
      </PostManagerProvider>
    </AuthenticatedShell>
  );
}
