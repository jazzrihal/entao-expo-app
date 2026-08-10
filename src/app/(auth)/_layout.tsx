import { useEffect } from "react";
import { Redirect, useLocalSearchParams } from "expo-router";
import { Stack } from "expo-router/stack";
import { useAuth } from "@/context/auth";
import { useInitialPostLinkReady } from "@/hooks/use-pending-post-return";
import {
  consumePostReturnPath,
  getPostIdFromReturnPath,
  peekPostReturnPath,
} from "@/lib/post-sharing";

export default function AuthLayout() {
  const { session, loading } = useAuth();
  const initialLinkReady = useInitialPostLinkReady();
  const { returnTo } = useLocalSearchParams<{ returnTo?: string | string[] }>();
  const returnToParam = Array.isArray(returnTo) ? returnTo[0] : returnTo;
  const postId =
    getPostIdFromReturnPath(returnToParam) ??
    getPostIdFromReturnPath(peekPostReturnPath());

  useEffect(() => {
    if (session && postId) {
      consumePostReturnPath();
    }
  }, [session, postId]);

  if (loading) return null;
  // Avoid racing Home redirect before cold-start getInitialURL is applied.
  if (session && !postId && !initialLinkReady) return null;

  if (session) {
    return postId ? (
      <Redirect
        href={{ pathname: "/(app)/post/[id]", params: { id: postId } }}
        withAnchor
      />
    ) : (
      <Redirect href="/(app)/(tabs)/home" />
    );
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}
