import {
  StyleSheet,
  useColorScheme,
  useWindowDimensions,
  View,
} from "react-native";
import {
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
import { FORCE_UPLOAD_INDICATORS } from "@/lib/debug-upload-indicators";
import { buildLocationLine, formatCapturedAtAgo } from "@/lib/post-display";
import type { PostDetailTestIDPrefix } from "@/lib/navigation";
import type { LocalPostStatus } from "@/lib/post-db";
import { parsePostBadges } from "@/lib/posts";
import {
  displayNameFontSize,
  resolveDisplayName,
  truncateDisplayName,
} from "@/lib/profile-display";
import {
  BADGE_BACKGROUND,
  BADGE_TEXT_COLOR,
  ELEVATED_BACKGROUND,
  META_TEXT_COLOR,
  resolveColorScheme,
} from "@/lib/theme-colors";
import type { PostDetailWithImage } from "@/queries/posts";

type PostDetailTestIDPrefixValue = PostDetailTestIDPrefix | "post";

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
  isLocalOnly = false,
  localSyncStatus,
  onExploreNearby,
  exploreNearbyDisabled = false,
}: PostDetailContentProps) {
  const { width } = useWindowDimensions();
  const theme = resolveColorScheme(useColorScheme());

  const authorName = resolveDisplayName({
    display_name: post.display_name,
    username: post.username,
    id: post.author_id,
  });
  const authorLabel = truncateDisplayName(authorName, 28);
  const badges = parsePostBadges(post.badges);
  const locationLine = buildLocationLine({
    address: post.address,
    city: post.city,
    region: post.region,
  });

  const exploreNearbyPress =
    onExploreNearby && !exploreNearbyDisabled ? onExploreNearby : undefined;
  const footerInnerWidth = width - FOOTER_HORIZONTAL_PADDING * 2;
  // Spacer (not Row spacing) separates meta and actions so trailing icons stay
  // pinned to the right when the reserved action width is larger than reality.
  const metaTextWidth = isLocalOnly
    ? footerInnerWidth
    : footerInnerWidth - FEED_ACTIONS_WIDTH;

  // Always reserve caption chrome so image and footer heights are stable.
  const imageHeight = Math.max(
    pageHeight -
      FEED_HEADER_HEIGHT -
      FEED_FOOTER_META_HEIGHT -
      FEED_CAPTION_VISIBLE -
      bottomInset,
    120,
  );
  const footerHeight = Math.max(
    pageHeight - FEED_HEADER_HEIGHT - imageHeight,
    0,
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
        <Column spacing={0} style={{ width }}>
          <Row
            alignment="center"
            style={{
              ...styles.header,
              width,
              backgroundColor: ELEVATED_BACKGROUND[theme],
            }}
          >
            <Text
              testID={`${testIDPrefix}-detail-author`}
              numberOfLines={1}
              textStyle={{
                fontSize: displayNameFontSize(authorName.length, 17),
                fontWeight: "600",
              }}
              onPress={onAuthorPress}
            >
              {authorLabel}
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
                        backgroundColor: BADGE_BACKGROUND[theme],
                      }}
                      textStyle={{
                        fontSize: 13,
                        fontWeight: "600",
                        color: BADGE_TEXT_COLOR[theme],
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
              {FORCE_UPLOAD_INDICATORS || (isLocalOnly && localSyncStatus) ? (
                <LocalPostSyncBadge
                  testID={`${testIDPrefix}-detail-local-badge`}
                  syncStatus={
                    FORCE_UPLOAD_INDICATORS
                      ? "uploading"
                      : (localSyncStatus ?? "queued")
                  }
                />
              ) : null}
            </View>
          </RNHostView>

          <Column
            spacing={4}
            alignment="start"
            style={{
              ...styles.footer,
              width,
              height: footerHeight,
              paddingBottom: 8 + bottomInset,
              backgroundColor: ELEVATED_BACKGROUND[theme],
            }}
          >
            <Row alignment="start" style={{ width: footerInnerWidth }}>
              <Column
                spacing={2}
                alignment="start"
                style={{ width: metaTextWidth }}
              >
                <Text
                  testID={`${testIDPrefix}-detail-date`}
                  textStyle={{ fontSize: 14, color: META_TEXT_COLOR[theme] }}
                  onPress={exploreNearbyPress}
                >
                  {formatCapturedAtAgo(post.captured_at)}
                </Text>
                {locationLine ? (
                  <Text
                    testID={`${testIDPrefix}-detail-location`}
                    textStyle={{ fontSize: 14, color: META_TEXT_COLOR[theme] }}
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
          </Column>
        </Column>
      </ScrollView>
    </Host>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 12,
    // UniversalStyle supports height (not minHeight/justifyContent).
    height: FEED_HEADER_HEIGHT,
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
