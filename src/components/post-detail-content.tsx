import {
  StyleSheet,
  useColorScheme,
  useWindowDimensions,
  View,
} from "react-native";
import {
  Button,
  Column,
  Host,
  RNHostView,
  Row,
  ScrollView,
  Spacer,
  Text,
} from "@expo/ui";
import { ZoomableImage } from "@/components/zoomable-image";
import { LocalPostSyncBadge } from "@/components/local-post-sync-badge";
import { PostFeedIconButton } from "@/components/post-feed-icon-button";
import { buildLocationLine, formatCapturedAtAgo } from "@/lib/post-display";
import type { PostDetailTestIDPrefix } from "@/lib/navigation";
import type { LocalPostStatus } from "@/lib/post-db";
import { parsePostBadges } from "@/lib/posts";
import type { PostDetailWithImage } from "@/queries/posts";
import type { LocalPost } from "@/lib/post-manager";

type PostDetailTestIDPrefixValue = PostDetailTestIDPrefix | "post";

const SYNC_STATUS_LABELS: Record<string, string> = {
  local: "Saved locally",
  queued: "Waiting to upload",
  uploading: "Uploading…",
  failed: "Upload failed",
};

type PostDetailContentProps = {
  post: PostDetailWithImage;
  testIDPrefix: PostDetailTestIDPrefixValue;
  pageHeight: number;
  bottomInset?: number;
  onAuthorPress: () => void;
  onToggleLike: () => void;
  onTogglePin: () => void;
  isLiked: boolean;
  isPinned: boolean;
  actionsDisabled: boolean;
  actionError: string | null;
  localPost?: LocalPost | null;
  onUploadToCloud?: () => void;
  isLocalOnly?: boolean;
  localSyncStatus?: LocalPostStatus;
  onExploreNearby?: () => void;
  exploreNearbyDisabled?: boolean;
};

const CAPTION_LINE_HEIGHT = 22;
const FEED_CAPTION_VISIBLE = 2 * CAPTION_LINE_HEIGHT;
const FEED_HEADER_HEIGHT = 44;
/** Date + location (wrapping) opposite pin/like. */
const FEED_FOOTER_META_HEIGHT = 58;
const FOOTER_HORIZONTAL_PADDING = 12;

const BADGE_BACKGROUNDS = {
  light: "#F2F2F7",
  dark: "#3A3A3C",
} as const;

const BADGE_TEXT_COLORS = {
  light: "#3A3A3C",
  dark: "#F2F2F7",
} as const;
/**
 * Reserve for pin + like text buttons (SF Symbol hit targets are wider than
 * the glyphs). Under-reserving inflates SwiftUI ScrollView content width and
 * centers the page with a visible right gutter.
 */
const FEED_ACTIONS_WIDTH = 120;

export function PostDetailContent({
  post,
  testIDPrefix,
  pageHeight,
  bottomInset = 0,
  onAuthorPress,
  onToggleLike,
  onTogglePin,
  isLiked,
  isPinned,
  actionsDisabled,
  actionError,
  localPost,
  onUploadToCloud,
  isLocalOnly = false,
  localSyncStatus,
  onExploreNearby,
  exploreNearbyDisabled = false,
}: PostDetailContentProps) {
  const { width } = useWindowDimensions();
  const colorScheme = useColorScheme();
  const theme = colorScheme === "dark" ? "dark" : "light";

  const badges = parsePostBadges(post.badges);
  const locationLine = buildLocationLine({
    address: post.address,
    city: post.city,
    region: post.region,
  });

  const exploreNearbyPress =
    onExploreNearby && !exploreNearbyDisabled ? onExploreNearby : undefined;
  const captionReserve = post.caption ? FEED_CAPTION_VISIBLE : 0;
  const footerInnerWidth = width - FOOTER_HORIZONTAL_PADDING * 2;
  // Spacer (not Row spacing) separates meta and actions so trailing icons stay
  // pinned to the right when the reserved action width is larger than reality.
  const metaTextWidth = isLocalOnly
    ? footerInnerWidth
    : footerInnerWidth - FEED_ACTIONS_WIDTH;

  const imageHeight = Math.max(
    pageHeight -
      FEED_HEADER_HEIGHT -
      FEED_FOOTER_META_HEIGHT -
      captionReserve -
      bottomInset,
    120,
  );

  return (
    <Host
      testID={`${testIDPrefix}-detail`}
      // Host sits below the stack header; without this, UIHostingController
      // still applies screen safe-area and draws content above the RN frame.
      ignoreSafeArea="all"
      style={{ width: "100%", height: pageHeight }}
    >
      <ScrollView
        showsIndicators={false}
        style={{ width: "100%", height: pageHeight }}
      >
        <Row alignment="center" style={{ ...styles.header, width }}>
          <Text
            testID={`${testIDPrefix}-detail-author`}
            textStyle={{ fontSize: 17, fontWeight: "600" }}
            onPress={onAuthorPress}
          >
            {post.display_name}
          </Text>
          {badges.length > 0 ? (
            <>
              <Spacer flexible />
              <Row spacing={8} alignment="center">
                {badges.map((badge) => (
                  <Text
                    key={badge.badge_id}
                    testID={`${testIDPrefix}-badge-${badge.badge_id}`}
                    style={{
                      ...styles.badge,
                      backgroundColor: BADGE_BACKGROUNDS[theme],
                    }}
                    textStyle={{
                      fontSize: 13,
                      fontWeight: "600",
                      color: BADGE_TEXT_COLORS[theme],
                    }}
                  >
                    {badge.badge_name}
                  </Text>
                ))}
              </Row>
            </>
          ) : null}
        </Row>

        <RNHostView matchContents>
          <View style={{ width, height: imageHeight }}>
            <ZoomableImage
              height={imageHeight}
              testID={`${testIDPrefix}-detail-image`}
              source={post.imageUrl ? { uri: post.imageUrl } : undefined}
              style={{ width, height: imageHeight }}
              width={width}
            />
            {isLocalOnly && localSyncStatus ? (
              <LocalPostSyncBadge
                testID={`${testIDPrefix}-detail-local-badge`}
                syncStatus={localSyncStatus}
              />
            ) : null}
          </View>
        </RNHostView>

        <Column spacing={4} style={{ ...styles.footer, width }}>
          <Row alignment="start" style={{ width: footerInnerWidth }}>
            <Column
              spacing={2}
              alignment="start"
              style={{ width: metaTextWidth }}
            >
              <Text
                testID={`${testIDPrefix}-detail-date`}
                textStyle={{ fontSize: 14 }}
                onPress={exploreNearbyPress}
              >
                {formatCapturedAtAgo(post.captured_at)}
              </Text>
              {locationLine ? (
                <Text
                  testID={`${testIDPrefix}-detail-location`}
                  textStyle={{ fontSize: 14 }}
                  onPress={exploreNearbyPress}
                >
                  {locationLine}
                </Text>
              ) : null}
            </Column>
            {!isLocalOnly ? (
              <>
                <Spacer flexible />
                <Row spacing={25} alignment="center">
                  <PostFeedIconButton
                    icon={isPinned ? "pin.fill" : "pin"}
                    accessibilityLabel={isPinned ? "Unpin" : "Pin"}
                    disabled={actionsDisabled}
                    onPress={onTogglePin}
                  />
                  <PostFeedIconButton
                    icon={isLiked ? "heart.fill" : "heart"}
                    accessibilityLabel={isLiked ? "Unlike" : "Like"}
                    disabled={actionsDisabled}
                    onPress={onToggleLike}
                  />
                </Row>
              </>
            ) : null}
          </Row>

          {post.caption ? (
            <Text
              testID={`${testIDPrefix}-detail-caption`}
              textStyle={{ fontSize: 17 }}
            >
              {post.caption}
            </Text>
          ) : null}

          {actionError ? (
            <Text
              testID={`${testIDPrefix}-detail-action-error`}
              textStyle={{ color: "#DC2626" }}
            >
              {actionError}
            </Text>
          ) : null}
          {localPost ? (
            <Row spacing={8} alignment="center">
              <Text
                testID={`${testIDPrefix}-detail-sync-status`}
                textStyle={{
                  color: localPost.status === "failed" ? "#DC2626" : "#6B7280",
                }}
              >
                {SYNC_STATUS_LABELS[localPost.status] ?? localPost.status}
              </Text>
              {(localPost.status === "local" ||
                localPost.status === "failed") &&
              onUploadToCloud ? (
                <Button
                  testID={`${testIDPrefix}-detail-upload-btn`}
                  variant="outlined"
                  label="Upload to Cloud"
                  onPress={onUploadToCloud}
                />
              ) : null}
            </Row>
          ) : null}
        </Column>
      </ScrollView>
    </Host>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 8,
    minHeight: FEED_HEADER_HEIGHT,
    justifyContent: "center",
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  footer: {
    paddingHorizontal: FOOTER_HORIZONTAL_PADDING,
    paddingTop: 8,
    paddingBottom: 8,
  },
});
