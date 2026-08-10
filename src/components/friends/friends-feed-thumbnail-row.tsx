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

export const FRIENDS_FEED_ROW_GAP = 1;

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
  showRowGap?: boolean;
};

export function FriendsFeedThumbnailRow({
  post,
  testID,
  testIDPrefix,
  onPostPress,
  screenWidth: screenWidthProp,
  showRowGap = false,
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
          marginBottom: showRowGap ? FRIENDS_FEED_ROW_GAP : 0,
          backgroundColor: gridSeparatorColor,
        },
      ]}
    >
      <Pressable
        // When pinned, expose the shared badge testID on the Pressable — nested
        // accessible children are flattened into the Pressable on iOS, so a
        // badge View testID never appears in the XCUITest hierarchy.
        testID={
          post.is_pinned_by_current_user
            ? "pinned-post-thumbnail"
            : `${testIDPrefix}-post-${post.id}`
        }
        accessibilityLabel={
          post.is_pinned_by_current_user ? "Pinned" : undefined
        }
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
        {post.is_pinned_by_current_user ? <PinnedPostBadge /> : null}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
  },
});
