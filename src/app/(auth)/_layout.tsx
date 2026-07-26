import { Redirect, useLocalSearchParams } from 'expo-router';
import { Stack } from 'expo-router/stack';
import { useAuth } from '@/context/auth';
import { getPostIdFromReturnPath } from '@/lib/post-sharing';

export default function AuthLayout() {
  const { session, loading } = useAuth();
  const { returnTo } = useLocalSearchParams<{ returnTo?: string }>();
  const postId = getPostIdFromReturnPath(returnTo);

  if (loading) return null;

  if (session) {
    return postId ? (
      <Redirect
        href={{ pathname: '/(app)/post/[id]', params: { id: postId } }}
      />
    ) : (
      <Redirect href="/(app)/(tabs)/home" />
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false }} />
  );
}
