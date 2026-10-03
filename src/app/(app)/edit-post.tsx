import { useMemo, useState } from "react";
import { Alert } from "react-native";
import { Button, FieldGroup, Text } from "@expo/ui";
import { useQueryClient } from "@tanstack/react-query";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { Empty } from "@/components/empty";
import { PostComposeForm } from "@/components/post-compose-form";
import { useAuth } from "@/context/auth";
import { getLocalSyncStatus } from "@/lib/local-post-adapter";
import { buildLocationLine } from "@/lib/post-display";
import { deleteLocalPost, updateLocalPostContent } from "@/lib/post-manager";
import { DEFAULT_POST_PRIVACY_SCOPE, type PostPrivacyScope } from "@/lib/posts";
import {
  rememberEditedPost,
  useDeletePostMutation,
  usePostQuery,
  useUpdatePostMutation,
  type PostDetailWithImage,
} from "@/queries/posts";

function parsePostParam(
  value: string | string[] | undefined,
): PostDetailWithImage | null {
  if (!value || typeof value !== "string") {
    return null;
  }

  try {
    const parsed = JSON.parse(value) as PostDetailWithImage;
    if (!parsed || typeof parsed.id !== "string" || parsed.id.length === 0) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

function isPrivacyScope(value: unknown): value is PostPrivacyScope {
  return value === "public" || value === "private" || value === "friends_only";
}

export default function EditPostScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { session } = useAuth();
  const { post: postParam } = useLocalSearchParams<{ post?: string }>();
  const snapshot = useMemo(() => parsePostParam(postParam), [postParam]);
  const isLocal = snapshot ? getLocalSyncStatus(snapshot) != null : false;
  const { data: cachedPost } = usePostQuery(snapshot?.id ?? null, {
    placeholderData: snapshot ?? undefined,
    enabled: !!snapshot && !isLocal,
  });
  const post = useMemo(() => {
    if (!snapshot) return null;
    if (!cachedPost) return snapshot;
    return {
      ...snapshot,
      caption: cachedPost.caption,
      privacy_scope: cachedPost.privacy_scope,
      address: cachedPost.address,
      city: cachedPost.city,
      region: cachedPost.region,
      country: cachedPost.country,
      latitude: cachedPost.latitude,
      longitude: cachedPost.longitude,
    };
  }, [cachedPost, snapshot]);
  const isOwner =
    !!post && !!session?.user.id && post.author_id === session.user.id;

  const [caption, setCaption] = useState(post?.caption ?? "");
  const [privacyScope, setPrivacyScope] = useState<PostPrivacyScope>(
    post && isPrivacyScope(post.privacy_scope)
      ? post.privacy_scope
      : DEFAULT_POST_PRIVACY_SCOPE,
  );
  const [locationCleared, setLocationCleared] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savingLocal, setSavingLocal] = useState(false);

  const updateMutation = useUpdatePostMutation();
  const deleteMutation = useDeletePostMutation();
  const submitting = savingLocal || updateMutation.isPending;
  const deleting = deleteMutation.isPending;

  const locationLine =
    !post || locationCleared
      ? null
      : buildLocationLine({
          address: post.address,
          city: post.city,
          region: post.region,
          country: post.country,
        }) || null;
  const latitude =
    !post || locationCleared || !Number.isFinite(post.latitude)
      ? undefined
      : post.latitude;
  const longitude =
    !post || locationCleared || !Number.isFinite(post.longitude)
      ? undefined
      : post.longitude;

  async function handleUpdate() {
    if (!post || !isOwner || submitting || deleting) {
      return;
    }

    setError(null);
    const edit = {
      caption,
      privacyScope,
      clearLocation: locationCleared,
    };

    if (isLocal) {
      setSavingLocal(true);
      const result = await updateLocalPostContent(post.id, edit);
      setSavingLocal(false);
      if (result.error) {
        setError(result.error);
        return;
      }
      rememberEditedPost(queryClient, post, edit);
      router.back();
      return;
    }

    updateMutation.mutate(
      { postId: post.id, post, ...edit },
      {
        onSuccess: () => router.back(),
        onError: (updateError) => setError(updateError.message),
      },
    );
  }

  function handleDelete() {
    if (!post || !isOwner || submitting || deleting) {
      return;
    }

    Alert.alert("Delete post?", "This cannot be undone.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => {
          void (async () => {
            try {
              if (isLocal) {
                const result = await deleteLocalPost(post.id);
                if (result.error) throw new Error(result.error);
              } else {
                await deleteMutation.mutateAsync({
                  postId: post.id,
                  storageObjectPath: post.storage_object_path,
                });
              }
              router.dismiss(2);
            } catch (deleteError) {
              Alert.alert(
                "Unable to delete",
                deleteError instanceof Error
                  ? deleteError.message
                  : "Unable to delete post.",
              );
            }
          })();
        },
      },
    ]);
  }

  if (!post || !isOwner) {
    return (
      <>
        <Empty
          testID="edit-post-unavailable"
          title={post ? "You can only edit your own posts" : "Post not found"}
          description={post ? undefined : "Go back and open the post again."}
        />
        <Stack.Toolbar placement="left">
          <Stack.Toolbar.Button
            accessibilityLabel="Cancel"
            onPress={() => router.back()}
          >
            Cancel
          </Stack.Toolbar.Button>
        </Stack.Toolbar>
      </>
    );
  }

  return (
    <>
      <PostComposeForm
        testIDPrefix="edit-post"
        captionInputKey={post.id}
        initialCaption={post.caption ?? ""}
        imageUri={post.imageUrl ?? ""}
        capturedAt={post.captured_at}
        locationLine={locationLine}
        latitude={latitude}
        longitude={longitude}
        onRemoveLocation={() => setLocationCleared(true)}
        caption={caption}
        onCaptionChange={setCaption}
        privacyScope={privacyScope}
        onPrivacyScopeChange={setPrivacyScope}
        error={error}
        footer={
          <FieldGroup.Section>
            <Button
              testID="edit-post-delete"
              variant="text"
              disabled={submitting || deleting}
              onPress={handleDelete}
            >
              <Text textStyle={{ color: "#DC2626" }}>Delete post</Text>
            </Button>
          </FieldGroup.Section>
        }
      />
      <Stack.Toolbar placement="left">
        <Stack.Toolbar.Button
          accessibilityLabel="Cancel"
          disabled={submitting || deleting}
          onPress={() => router.back()}
        >
          Cancel
        </Stack.Toolbar.Button>
      </Stack.Toolbar>
      <Stack.Toolbar placement="right">
        <Stack.Toolbar.Button
          accessibilityLabel="Update"
          disabled={submitting || deleting}
          variant="done"
          onPress={() => {
            void handleUpdate();
          }}
        >
          Update
        </Stack.Toolbar.Button>
      </Stack.Toolbar>
    </>
  );
}
