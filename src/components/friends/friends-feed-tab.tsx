import { useCallback, useMemo } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  useColorScheme,
  useWindowDimensions,
  View,
} from "react-native";
import { FlashList } from "@shopify/flash-list";
import { useRouter } from "expo-router";
import { Empty } from "@/components/empty";
import { FriendsFeedThumbnailRow } from "@/components/friends/friends-feed-thumbnail-row";
import { useAuth } from "@/context/auth";
import { openPostDetail, openUserProfile } from "@/lib/navigation";
import { flattenFriendsPostsGrouped } from "@/lib/posts";
import { ELEVATED_BACKGROUND, resolveColorScheme } from "@/lib/theme-colors";
import { queryKeys } from "@/queries/keys";
import {
  useFriendsPostsQuery,
  type FriendsPostWithImage,
} from "@/queries/posts";
import { useRefreshOnFocus } from "@/queries/useRefreshOnFocus";

const HEADER_COLORS = {
  light: "#000000",
  dark: "#FFFFFF",
} as const;

type FriendsFeedHeaderItem = {
  type: "header";
  key: string;
  authorId: string;
  username: string;
  displayName: string;
};

type FriendsFeedPostItem = {
  type: "post";
  key: string;
  post: FriendsPostWithImage;
  username: string;
  rowIndex: number;
  isLastInGroup: boolean;
};

type FriendsFeedListItem = FriendsFeedHeaderItem | FriendsFeedPostItem;

export function FriendsFeedTab() {
  const router = useRouter();
  const { session } = useAuth();
  const theme = resolveColorScheme(useColorScheme());
  const { width: screenWidth } = useWindowDimensions();
  const feedQuery = useFriendsPostsQuery();

  useRefreshOnFocus(queryKeys.friendsPosts());

  const groups = feedQuery.data?.groups;
  const flattenedPosts = useMemo(
    () => flattenFriendsPostsGrouped(groups ?? []),
    [groups],
  );

  const listItems = useMemo((): FriendsFeedListItem[] => {
    const items: FriendsFeedListItem[] = [];
    for (const group of groups ?? []) {
      items.push({
        type: "header",
        key: `header-${group.author_id}`,
        authorId: group.author_id,
        username: group.username,
        displayName: group.display_name,
      });
      group.posts.forEach((post, index) => {
        items.push({
          type: "post",
          key: post.id,
          post,
          username: group.username,
          rowIndex: index,
          isLastInGroup: index === group.posts.length - 1,
        });
      });
    }
    return items;
  }, [groups]);

  const showLoading = feedQuery.isPending;
  const showError = !!feedQuery.error && !showLoading;
  const showEmpty =
    !showLoading && !feedQuery.error && flattenedPosts.length === 0;

  const handleOpenPostDetail = useCallback(
    (post: FriendsPostWithImage) => {
      openPostDetail(router, post, {
        testIDPrefix: "friends-post",
        feedSource: { type: "friends" },
      });
    },
    [router],
  );

  const handleOpenProfile = useCallback(
    (profile: { id: string; displayName: string; username: string }) => {
      openUserProfile(router, session?.user.id, {
        id: profile.id,
        displayName: profile.displayName,
        username: profile.username,
      });
    },
    [router, session?.user.id],
  );

  const renderItem = useCallback(
    ({ item }: { item: FriendsFeedListItem }) => {
      if (item.type === "header") {
        return (
          <View
            testID={`friends-feed-section-${item.username}`}
            style={[
              styles.sectionHeader,
              { backgroundColor: ELEVATED_BACKGROUND[theme] },
            ]}
          >
            <Pressable
              testID={`friends-feed-section-${item.username}-name`}
              onPress={() =>
                handleOpenProfile({
                  id: item.authorId,
                  displayName: item.displayName,
                  username: item.username,
                })
              }
            >
              <Text
                style={[styles.sectionHeaderText, { color: HEADER_COLORS[theme] }]}
              >
                {item.displayName}
              </Text>
            </Pressable>
          </View>
        );
      }

      return (
        <FriendsFeedThumbnailRow
          post={item.post}
          screenWidth={screenWidth}
          testID={`friends-feed-section-${item.username}-row-${item.rowIndex}`}
          testIDPrefix="friends-feed"
          onPostPress={handleOpenPostDetail}
          showRowGap={!item.isLastInGroup}
        />
      );
    },
    [handleOpenPostDetail, handleOpenProfile, screenWidth, theme],
  );

  if (showLoading) {
    return (
      <ActivityIndicator style={styles.loader} testID="friends-feed-loading" />
    );
  }

  if (showError) {
    return (
      <View style={styles.message}>
        <Text testID="friends-feed-error" style={{ color: HEADER_COLORS[theme] }}>
          {feedQuery.error?.message ?? "Failed to load feed"}
        </Text>
      </View>
    );
  }

  if (showEmpty) {
    return (
      <Empty
        testID="friends-feed-empty"
        title="No posts from friends"
        description="When friends share posts, they will appear here."
      />
    );
  }

  const gridSeparatorColor = theme === "dark" ? "#000" : "#fff";

  return (
    <FlashList
      testID="friends-feed"
      data={listItems}
      keyExtractor={(item) => item.key}
      renderItem={renderItem}
      getItemType={(item) => item.type}
      style={{ flex: 1, backgroundColor: gridSeparatorColor }}
      contentContainerStyle={styles.feedContent}
      contentInsetAdjustmentBehavior="automatic"
    />
  );
}

const styles = StyleSheet.create({
  feedContent: {
    paddingHorizontal: 0,
  },
  sectionHeader: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
    justifyContent: "center",
  },
  sectionHeaderText: {
    fontSize: 28,
    fontWeight: "600",
  },
  loader: {
    marginTop: 32,
  },
  message: {
    paddingHorizontal: 16,
    paddingTop: 24,
  },
});
