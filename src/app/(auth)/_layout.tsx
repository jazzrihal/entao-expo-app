import { useEffect } from "react";
import { Redirect, useLocalSearchParams } from "expo-router";
import { Stack } from "expo-router/stack";
import { useAuth } from "@/context/auth";
import { useInitialPostLinkReady } from "@/hooks/use-pending-post-return";
import {
  consumePostReturnPath,
  getPostIdFromReturnPath,
  getUsernameFromReturnPath,
  peekPostReturnPath,
} from "@/lib/post-sharing";

export default function AuthLayout() {
  const { session, loading } = useAuth();
  const initialLinkReady = useInitialPostLinkReady();
  const { returnTo } = useLocalSearchParams<{ returnTo?: string | string[] }>();
  const returnToParam = Array.isArray(returnTo) ? returnTo[0] : returnTo;
  const peekedReturnTo = peekPostReturnPath();
  const postId =
    getPostIdFromReturnPath(returnToParam) ??
    getPostIdFromReturnPath(peekedReturnTo);
  const username =
    getUsernameFromReturnPath(returnToParam) ??
    getUsernameFromReturnPath(peekedReturnTo);

  useEffect(() => {
    if (session && (postId || username)) {
      consumePostReturnPath();
    }
  }, [session, postId, username]);

  if (loading) return null;
  // Avoid racing Home redirect before cold-start getInitialURL is applied.
  if (session && !postId && !username && !initialLinkReady) return null;

  if (session) {
    if (postId) {
      return (
        <Redirect
          href={{ pathname: "/(app)/post/[id]", params: { id: postId } }}
          withAnchor
        />
      );
    }
    if (username) {
      return (
        <Redirect
          href={{ pathname: "/(app)/user/[id]", params: { id: username } }}
          withAnchor
        />
      );
    }
    return <Redirect href="/(app)/(tabs)/home" />;
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}
