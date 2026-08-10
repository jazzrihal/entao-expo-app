import { useEffect, type ReactNode } from "react";
import { Redirect, usePathname } from "expo-router";
import { Stack } from "expo-router/stack";
import { useAuth } from "@/context/auth";
import { PostManagerProvider } from "@/context/post-manager";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { useInitialPostLinkReady } from "@/hooks/use-pending-post-return";
import {
  consumePostReturnPath,
  peekPostReturnPath,
} from "@/lib/post-sharing";

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
  const initialLinkReady = useInitialPostLinkReady();
  const pathname = usePathname();
  // Only Linking (root layout) seeds pending return paths. Do not treat in-app
  // /post/[id] navigation as a launch link — that re-seeded after consume.
  const returnTo = peekPostReturnPath();

  // Once signed in, the launch link has been delivered (or is irrelevant).
  // Wipe it so a later in-app sign-out → sign-in does not replay it.
  useEffect(() => {
    if (!session) return;
    consumePostReturnPath();
  }, [session, pathname]);

  if (loading) return null;
  if (!session && !returnTo && !initialLinkReady) return null;

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
