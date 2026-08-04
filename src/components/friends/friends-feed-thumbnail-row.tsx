import {
  Pressable,
  StyleSheet,
  useColorScheme,
  useWindowDimensions,
  View,
} from "react-native";
import { Image } from "@/components/image";
import { PinnedPostBadge } from "@/components/pinned-post-badge";
import type { FriendsPostWithImage } from "@/queries/posts";

/** Horizontal inset applied by FieldGroup.Section rows on web. */
export const FRIENDS_FEED_SECTION_ROW_INSET = 16;

/** Default SwiftUI Form row insets to counter on iOS via listRowInsets. */
export const FRIENDS_FEED_IOS_LIST_ROW_BLEED = {
  horizontal: 20,
  vertical: 12,
};

const ANDROID_LIST_ITEM_INSET = { horizontal: 16, vertical: 8 };
const ANDROID_LIST_ITEM_MIN_HEIGHT = 56;

export function getFriendsFeedAndroidListItemOffset(rowHeight: number): {
  x: number;
  y: number;
} {
  const minHeightGap =
    rowHeight < ANDROID_LIST_ITEM_MIN_HEIGHT
      ? (ANDROID_LIST_ITEM_MIN_HEIGHT - rowHeight) / 2
      : 0;

  return {
    x: -ANDROID_LIST_ITEM_INSET.horizontal,
    y: -(ANDROID_LIST_ITEM_INSET.vertical + minHeightGap),
  };
}

export const FRIENDS_FEED_ROW_GAP = 1;

/** Clears rounded FieldGroup row corners (overflow: hidden on slot). */
const FRIENDS_FEED_PIN_BADGE_INSET = { bottom: 18, right: 18 };

/** Full-width strip height (~3:1), matching former 3-column tile size. */
export function getFriendsFeedThumbnailRowHeight(screenWidth: number): number {
  return Math.floor(screenWidth / 3);
}

type FriendsFeedThumbnailRowProps = {
  post: FriendsPostWithImage;
  testID: string;
  testIDPrefix: string;
  onPostPress: (post: FriendsPostWithImage) => void;
  screenWidth?: number;
};

export function FriendsFeedThumbnailRow({
  post,
  testID,
  testIDPrefix,
  onPostPress,
  screenWidth: screenWidthProp,
}: FriendsFeedThumbnailRowProps) {
  const colorScheme = useColorScheme();
  const gridSeparatorColor = colorScheme === "dark" ? "#000" : "#fff";
  const { width: windowWidth } = useWindowDimensions();
  const screenWidth = screenWidthProp ?? windowWidth;
  const rowHeight = getFriendsFeedThumbnailRowHeight(screenWidth);

  return (
    <View
      testID={testID}
      style={[
        styles.row,
        {
          width: screenWidth,
          height: rowHeight,
          backgroundColor: gridSeparatorColor,
        },
      ]}
    >
      <Pressable
        testID={`${testIDPrefix}-post-${post.id}`}
        onPress={() => onPostPress(post)}
        style={{
          width: screenWidth,
          height: rowHeight,
        }}
      >
        <Image
          recyclingKey={post.id}
          source={post.imageUrl ? { uri: post.imageUrl } : undefined}
          style={{ width: screenWidth, height: rowHeight }}
          contentFit="cover"
        />
        {post.is_pinned_by_current_user ? (
          <PinnedPostBadge style={styles.pinnedBadge} />
        ) : null}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
  },
  pinnedBadge: FRIENDS_FEED_PIN_BADGE_INSET,
});
