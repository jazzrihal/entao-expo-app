import { useCallback, useEffect, useRef, useState } from "react";
import {
  Alert,
  FlatList,
  Platform,
  Share,
  StyleSheet,
  View,
  type ListRenderItemInfo,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from "react-native";
import { Stack, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { PostFeedPage } from "@/components/post-feed-page";
import { ReportSheet } from "@/components/report-sheet";
import { useAuth } from "@/context/auth";
import { getLocalSyncStatus } from "@/lib/local-post-adapter";
import type { PostDetailTestIDPrefix } from "@/lib/navigation";
import { deleteLocalPost, queuePostForUpload } from "@/lib/post-manager";
import { buildPostLink, buildPostShareMessage } from "@/lib/post-sharing";
import { resolveDisplayName } from "@/lib/profile-display";
import type { ReportReason } from "@/lib/reports";
import { runSync } from "@/lib/sync-manager";
import { useBlockUserMutation } from "@/queries/blocks";
import {
  useDeletePostMutation,
  type PostDetailWithImage,
} from "@/queries/posts";
import { useReportPostMutation } from "@/queries/reports";

type PostFeedPagerProps = {
  posts: PostDetailWithImage[];
  testIDPrefix: PostDetailTestIDPrefix | "post";
  testID?: string;
  initialIndex?: number;
  includeTabBarInset?: boolean;
  refreshing?: boolean;
  onRefresh?: () => void;
  isLocalOnly?: boolean;
  localPostIds?: Set<string>;
};

const NATIVE_TAB_BAR_HEIGHT = Platform.select({
  ios: 49,
  android: 56,
  default: 49,
}) as number;

export function PostFeedPager({
  posts,
  testIDPrefix,
  testID,
  initialIndex,
  includeTabBarInset = false,
  refreshing,
  onRefresh,
  isLocalOnly = false,
  localPostIds,
}: PostFeedPagerProps) {
  const [pageHeight, setPageHeight] = useState(0);
  const [activeIndex, setActiveIndex] = useState(() =>
    initialIndex != null && initialIndex >= 0 ? initialIndex : 0,
  );
  const [uploadStarted, setUploadStarted] = useState(false);
  const [reportPostId, setReportPostId] = useState<string | null>(null);
  const insets = useSafeAreaInsets();
  const listRef = useRef<FlatList<PostDetailWithImage>>(null);
  const didScrollToInitial = useRef(false);
  const { session } = useAuth();
  const router = useRouter();
  const deleteMutation = useDeletePostMutation();
  const reportMutation = useReportPostMutation();
  const blockMutation = useBlockUserMutation();

  const bottomInset =
    insets.bottom + (includeTabBarInset ? NATIVE_TAB_BAR_HEIGHT : 0);
  const pagerTestID = testID ?? `${testIDPrefix}-feed-pager`;
  const scrollIndex =
    initialIndex != null && initialIndex >= 0 ? initialIndex : undefined;

  const safeActiveIndex =
    posts.length === 0
      ? 0
      : Math.min(Math.max(activeIndex, 0), posts.length - 1);
  const activePost = posts[safeActiveIndex];
  const activeIsLocalOnly =
    !!activePost &&
    (isLocalOnly || (localPostIds?.has(activePost.id) ?? false));
  const isOwner =
    !!session?.user.id &&
    !!activePost &&
    activePost.author_id === session.user.id;
  const showDelete = !!activePost && isOwner;
  const showShare = !!activePost && !activeIsLocalOnly;
  const showReport = !!activePost && !isOwner && !activeIsLocalOnly;
  const showBlock = !!activePost && !isOwner && !activeIsLocalOnly;
  const reportSheetOpen = !!activePost && reportPostId === activePost.id;
  const activeSyncStatus = activePost
    ? getLocalSyncStatus(activePost)
    : undefined;
  const showPost =
    !!activePost &&
    activeIsLocalOnly &&
    !uploadStarted &&
    (activeSyncStatus === "local" || activeSyncStatus === "failed");

  const handleLayout = useCallback(
    (event: { nativeEvent: { layout: { height: number } } }) => {
      const nextHeight = Math.round(event.nativeEvent.layout.height);
      if (nextHeight > 0) {
        setPageHeight(nextHeight);
      }
    },
    [],
  );

  useEffect(() => {
    if (
      didScrollToInitial.current ||
      scrollIndex == null ||
      pageHeight <= 0 ||
      posts.length <= scrollIndex
    ) {
      return;
    }

    didScrollToInitial.current = true;
    requestAnimationFrame(() => {
      listRef.current?.scrollToIndex({
        index: scrollIndex,
        animated: false,
      });
    });
  }, [pageHeight, posts.length, scrollIndex]);

  const handleMomentumScrollEnd = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      if (pageHeight <= 0 || posts.length === 0) {
        return;
      }
      const nextIndex = Math.round(
        event.nativeEvent.contentOffset.y / pageHeight,
      );
      setActiveIndex(Math.min(Math.max(nextIndex, 0), posts.length - 1));
      setReportPostId(null);
    },
    [pageHeight, posts.length],
  );

  const handleShare = useCallback(async () => {
    if (!activePost || activeIsLocalOnly) {
      return;
    }

    try {
      await Share.share({
        message: buildPostShareMessage(
          resolveDisplayName({
            display_name: activePost.display_name,
            username: activePost.username,
            id: activePost.author_id,
          }),
        ),
        url: buildPostLink(activePost.id),
      });
    } catch (error) {
      Alert.alert(
        "Unable to share",
        error instanceof Error ? error.message : "Unable to share post.",
      );
    }
  }, [activeIsLocalOnly, activePost]);

  const handleDelete = useCallback(() => {
    if (!activePost || !isOwner || deleteMutation.isPending) {
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
              if (activeIsLocalOnly) {
                const { error } = await deleteLocalPost(activePost.id);
                if (error) throw new Error(error);
              } else {
                await deleteMutation.mutateAsync({
                  postId: activePost.id,
                  storageObjectPath: activePost.storage_object_path,
                });
              }
              router.back();
            } catch (error) {
              Alert.alert(
                "Unable to delete",
                error instanceof Error
                  ? error.message
                  : "Unable to delete post.",
              );
            }
          })();
        },
      },
    ]);
  }, [activeIsLocalOnly, activePost, deleteMutation, isOwner, router]);

  const handleBlock = useCallback(() => {
    if (!activePost || isOwner || blockMutation.isPending) {
      return;
    }
    const authorId = activePost.author_id;
    Alert.alert(
      "Block this user?",
      "They won't be able to see your posts or contact you, and you won't see theirs.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Block",
          style: "destructive",
          onPress: () => {
            void (async () => {
              try {
                await blockMutation.mutateAsync(authorId);
                router.back();
              } catch (error) {
                Alert.alert(
                  "Unable to block",
                  error instanceof Error
                    ? error.message
                    : "Unable to block user.",
                );
              }
            })();
          },
        },
      ],
    );
  }, [activePost, blockMutation, isOwner, router]);

  const handleReport = useCallback(() => {
    if (!activePost) {
      return;
    }
    reportMutation.reset();
    setReportPostId(activePost.id);
  }, [activePost, reportMutation]);

  const handleReportSubmit = useCallback(
    (reason: ReportReason) => {
      if (!activePost || reportMutation.isPending) {
        return;
      }

      reportMutation.mutate(
        {
          postId: activePost.id,
          authorId: activePost.author_id,
          reason,
        },
        {
          onSuccess: () => {
            setReportPostId(null);
            Alert.alert(
              "Report submitted",
              "Thanks — our team will review it.",
            );
          },
        },
      );
    },
    [activePost, reportMutation],
  );

  const handleReportDismiss = useCallback(() => {
    setReportPostId(null);
    reportMutation.reset();
  }, [reportMutation]);

  const handlePost = useCallback(() => {
    if (!activePost || uploadStarted) {
      return;
    }

    setUploadStarted(true);
    void (async () => {
      const { error } = await queuePostForUpload(activePost.id);
      if (error) {
        setUploadStarted(false);
        Alert.alert("Unable to post", error);
        return;
      }
      void runSync();
    })();
  }, [activePost, uploadStarted]);

  const renderItem = useCallback(
    ({ item }: ListRenderItemInfo<PostDetailWithImage>) => (
      <PostFeedPage
        post={item}
        testIDPrefix={testIDPrefix}
        pageHeight={pageHeight}
        bottomInset={bottomInset}
        isLocalOnly={isLocalOnly || (localPostIds?.has(item.id) ?? false)}
      />
    ),
    [bottomInset, isLocalOnly, localPostIds, pageHeight, testIDPrefix],
  );

  const getItemLayout = useCallback(
    (
      _data: ArrayLike<PostDetailWithImage> | null | undefined,
      index: number,
    ) => ({
      length: pageHeight,
      offset: pageHeight * index,
      index,
    }),
    [pageHeight],
  );

  return (
    <>
      <Stack.Screen
        options={{
          title: "",
          headerLargeTitle: false,
        }}
      />
      {showDelete ||
      showShare ||
      showReport ||
      showBlock ||
      showPost ||
      uploadStarted ? (
        <Stack.Toolbar placement="right">
          <Stack.Toolbar.Button
            accessibilityLabel="Delete"
            icon="trash"
            hidden={!showDelete}
            disabled={deleteMutation.isPending}
            onPress={handleDelete}
          />
          <Stack.Toolbar.Button
            accessibilityLabel="Report"
            icon="flag"
            hidden={!showReport}
            onPress={handleReport}
          />
          <Stack.Toolbar.Button
            accessibilityLabel="Share"
            icon="square.and.arrow.up"
            hidden={!showShare}
            onPress={handleShare}
          />
          <Stack.Toolbar.Button
            accessibilityLabel="Block"
            icon="hand.raised"
            hidden={!showBlock}
            disabled={blockMutation.isPending}
            onPress={handleBlock}
          />
          <Stack.Toolbar.Button
            accessibilityLabel="Post"
            hidden={!showPost}
            disabled={uploadStarted}
            variant="done"
            onPress={handlePost}
          >
            Post
          </Stack.Toolbar.Button>
        </Stack.Toolbar>
      ) : null}
      <View style={styles.container} onLayout={handleLayout}>
        {pageHeight > 0 ? (
          <FlatList
            ref={listRef}
            testID={pagerTestID}
            data={posts}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            getItemLayout={getItemLayout}
            initialScrollIndex={scrollIndex}
            snapToInterval={pageHeight}
            snapToAlignment="start"
            decelerationRate="fast"
            disableIntervalMomentum
            pagingEnabled
            showsVerticalScrollIndicator={false}
            contentInsetAdjustmentBehavior="never"
            refreshing={refreshing}
            onRefresh={onRefresh}
            onMomentumScrollEnd={handleMomentumScrollEnd}
            onScrollToIndexFailed={(info) => {
              requestAnimationFrame(() => {
                listRef.current?.scrollToOffset({
                  offset: info.averageItemLength * info.index,
                  animated: false,
                });
              });
            }}
          />
        ) : null}
      </View>
      <ReportSheet
        key={reportPostId ?? "closed"}
        isPresented={reportSheetOpen}
        targetLabel="post"
        onDismiss={handleReportDismiss}
        onSubmit={handleReportSubmit}
        isSubmitting={reportMutation.isPending}
        error={reportMutation.error?.message ?? null}
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
