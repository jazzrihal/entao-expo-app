import { memo, useCallback, useMemo, useRef, useState } from "react";
import { Share } from "react-native";
import { useRouter } from "expo-router";
import { PostDetailContent } from "@/components/post-detail-content";
import { useAuth } from "@/context/auth";
import { getLocalSyncStatus } from "@/lib/local-post-adapter";
import { openUserProfile, type PostDetailTestIDPrefix } from "@/lib/navigation";
import { momentPicker$ } from "@/lib/moment-picker-store";
import {
  getPostViewerEngagement,
  usePostQuery,
  useToggleLikeMutation,
  useTogglePinMutation,
  type PostDetailWithImage,
} from "@/queries/posts";
import { buildPostLink, buildPostShareMessage } from "@/lib/post-sharing";

type PostFeedPageProps = {
  post: PostDetailWithImage;
  testIDPrefix: PostDetailTestIDPrefix | "post";
  pageHeight: number;
  bottomInset: number;
  isLocalOnly?: boolean;
};

export const PostFeedPage = memo(function PostFeedPage({
  post,
  testIDPrefix,
  pageHeight,
  bottomInset,
  isLocalOnly = false,
}: PostFeedPageProps) {
  const router = useRouter();
  const { session } = useAuth();
  const [shareError, setShareError] = useState<string | null>(null);
  // Once like/pin is toggled on this screen, the detail-cache optimistic patch
  // is authoritative — the `post` prop may be a frozen navigation snapshot
  // (e.g. profile `localFeed`) that won't update until we leave the screen.
  const hasLocalEngagementMutation = useRef(false);

  const likeMutation = useToggleLikeMutation(isLocalOnly ? null : post.id);
  const pinMutation = useTogglePinMutation(isLocalOnly ? null : post.id);

  const { data: cachedPost } = usePostQuery(isLocalOnly ? null : post.id, {
    enabled: false,
    placeholderData: post,
  });

  const postEngagement = useMemo(() => {
    const fromPost = getPostViewerEngagement(post);
    const ownProfilePinned =
      "is_pinned_to_current_profile" in post &&
      "profile_user_id" in post &&
      post.profile_user_id === session?.user.id &&
      post.is_pinned_to_current_profile;

    if (!cachedPost) {
      return {
        isLiked: fromPost.isLiked,
        isPinned: fromPost.isPinned || ownProfilePinned,
      };
    }
    const fromCache = getPostViewerEngagement(cachedPost);
    if (hasLocalEngagementMutation.current) {
      return fromCache;
    }
    // Prefer the navigation/list snapshot over a stale detail-cache entry left
    // from an earlier screen (e.g. home detail wrote is_pinned=false before pin
    // settled, then profile opened with a fresher pinned feed row). Still take
    // cache when it is the only source that says pinned/liked so in-flight
    // patches from the previous screen remain visible.
    return {
      isLiked: fromPost.isLiked || fromCache.isLiked,
      isPinned:
        fromPost.isPinned || fromCache.isPinned || ownProfilePinned,
    };
  }, [cachedPost, post, session?.user.id]);

  const actionPending = likeMutation.isPending || pinMutation.isPending;
  const actionError =
    likeMutation.error?.message ?? pinMutation.error?.message ?? shareError;
  // Keep an in-flight guard in handlers, but do not gray both icons for the
  // full network round-trip — that reads as a flash on optimistic updates.
  const actionsDisabled = !session?.user.id;

  const handleToggleLike = useCallback(() => {
    if (actionPending) {
      return;
    }
    hasLocalEngagementMutation.current = true;
    likeMutation.mutate(!postEngagement.isLiked);
  }, [actionPending, likeMutation, postEngagement.isLiked]);

  const handleTogglePin = useCallback(() => {
    if (actionPending) {
      return;
    }
    hasLocalEngagementMutation.current = true;
    pinMutation.mutate(!postEngagement.isPinned);
  }, [actionPending, pinMutation, postEngagement.isPinned]);

  const handleShare = useCallback(async () => {
    if (isLocalOnly) {
      return;
    }

    setShareError(null);
    try {
      await Share.share({
        message: buildPostShareMessage(post.display_name),
        url: buildPostLink(post.id),
      });
    } catch (error) {
      setShareError(
        error instanceof Error ? error.message : "Unable to share post.",
      );
    }
  }, [isLocalOnly, post.display_name, post.id]);

  const openAuthorProfile = useCallback(() => {
    if (isLocalOnly) return;
    openUserProfile(router, session?.user.id, {
      id: post.author_id,
      displayName: post.display_name,
      username: post.username,
    });
  }, [
    isLocalOnly,
    post.author_id,
    post.display_name,
    post.username,
    router,
    session?.user.id,
  ]);

  const localSyncStatus = isLocalOnly ? getLocalSyncStatus(post) : undefined;

  const canExploreNearby = useMemo(
    () =>
      Number.isFinite(post.latitude) &&
      Number.isFinite(post.longitude) &&
      typeof post.captured_at === "string" &&
      post.captured_at.length > 0,
    [post.captured_at, post.latitude, post.longitude],
  );

  const handleExploreNearby = useCallback(() => {
    if (!canExploreNearby) {
      return;
    }
    momentPicker$.applied.set({
      occurredAt: post.captured_at,
      latitude: post.latitude,
      longitude: post.longitude,
      address: post.address ?? "",
      city: post.city ?? "",
      region: post.region ?? "",
      country: post.country ?? "",
    });
    router.dismissTo("/(app)/(tabs)/home");
  }, [canExploreNearby, post, router]);

  return (
    <PostDetailContent
      post={post}
      testIDPrefix={testIDPrefix}
      pageHeight={pageHeight}
      bottomInset={bottomInset}
      onAuthorPress={openAuthorProfile}
      onToggleLike={handleToggleLike}
      onTogglePin={handleTogglePin}
      onShare={isLocalOnly ? undefined : handleShare}
      isLiked={postEngagement.isLiked}
      isPinned={postEngagement.isPinned}
      actionsDisabled={actionsDisabled}
      actionError={actionError}
      isLocalOnly={isLocalOnly}
      localSyncStatus={localSyncStatus}
      onExploreNearby={handleExploreNearby}
      exploreNearbyDisabled={!canExploreNearby}
    />
  );
});
