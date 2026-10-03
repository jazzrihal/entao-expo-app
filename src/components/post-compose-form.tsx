import { useCallback, useRef, useState, type ReactNode } from "react";
import {
  Pressable,
  StyleSheet,
  useColorScheme,
  useWindowDimensions,
} from "react-native";
import {
  KeyboardAwareScrollView,
  useKeyboardHandler,
  type KeyboardAwareScrollViewRef,
} from "react-native-keyboard-controller";
import { runOnJS } from "react-native-reanimated";
import {
  Button,
  FieldGroup,
  Host,
  Icon,
  Picker,
  Row,
  Spacer,
  Text,
  TextInput,
  type TextInputRef,
} from "@expo/ui";
import { ZoomableImage } from "@/components/zoomable-image";
import { formatCapturedAt } from "@/lib/post-display";
import type { PostPrivacyScope } from "@/lib/posts";
import { META_TEXT_COLOR, resolveColorScheme } from "@/lib/theme-colors";

export const CAPTION_MAX_LENGTH = 500;

type PostComposeFormProps = {
  testIDPrefix?: string;
  /** Remounts the uncontrolled caption field once per post. */
  captionInputKey: string;
  initialCaption: string;
  imageUri: string;
  capturedAt: string | Date | null;
  resolvingLocation?: boolean;
  locationLine: string | null;
  latitude?: number | null;
  longitude?: number | null;
  onRemoveLocation: () => void;
  caption: string;
  onCaptionChange: (value: string) => void;
  privacyScope: PostPrivacyScope;
  onPrivacyScopeChange: (value: PostPrivacyScope) => void;
  error?: string | null;
  footer?: ReactNode;
};

function coordinatesOf(
  latitude: number | null | undefined,
  longitude: number | null | undefined,
): { latitude: number; longitude: number } | null {
  if (
    latitude == null ||
    longitude == null ||
    !Number.isFinite(latitude) ||
    !Number.isFinite(longitude)
  ) {
    return null;
  }
  return { latitude, longitude };
}

function formatCoordinates(latitude: number, longitude: number): string {
  return `${Math.abs(latitude).toFixed(5)}° ${latitude >= 0 ? "N" : "S"},  ${Math.abs(longitude).toFixed(5)}° ${longitude >= 0 ? "E" : "W"}`;
}

export function PostComposeForm({
  testIDPrefix = "new-post",
  captionInputKey,
  initialCaption,
  imageUri,
  capturedAt,
  resolvingLocation = false,
  locationLine,
  latitude,
  longitude,
  onRemoveLocation,
  caption,
  onCaptionChange,
  privacyScope,
  onPrivacyScopeChange,
  error,
  footer,
}: PostComposeFormProps) {
  const { width, height } = useWindowDimensions();
  const theme = resolveColorScheme(useColorScheme());
  const scrollRef = useRef<KeyboardAwareScrollViewRef>(null);
  const captionRef = useRef<TextInputRef>(null);
  const [captionFocused, setCaptionFocused] = useState(false);
  const previewHeight = Math.round(height / 3);
  const coordinates = coordinatesOf(latitude, longitude);
  const showRemoveLocation =
    !resolvingLocation && (Boolean(locationLine) || coordinates != null);

  const scrollToCaption = useCallback(() => {
    scrollRef.current?.scrollToEnd({ animated: true });
  }, []);

  const blurCaption = useCallback(() => {
    captionRef.current?.blur();
  }, []);

  useKeyboardHandler(
    {
      onEnd: (e) => {
        "worklet";
        if (e.height > 0) {
          runOnJS(scrollToCaption)();
        }
      },
    },
    [scrollToCaption],
  );

  return (
    <>
      <KeyboardAwareScrollView
        ref={scrollRef}
        style={{ flex: 1 }}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ flexGrow: 1 }}
        onScrollBeginDrag={blurCaption}
      >
        {imageUri ? (
          <ZoomableImage
            testID={`${testIDPrefix}-preview`}
            source={{ uri: imageUri }}
            width={width}
            height={previewHeight}
            style={{ width, height: previewHeight }}
          />
        ) : null}

        <Host style={{ flex: 1 }}>
          <FieldGroup>
            <FieldGroup.Section>
              <Row spacing={8}>
                <Icon name="calendar.badge.clock" size={16} />
                <Text testID={`${testIDPrefix}-captured-at`}>
                  {capturedAt ? formatCapturedAt(capturedAt) : ""}
                </Text>
              </Row>
              <Row spacing={8}>
                <Icon
                  name={
                    resolvingLocation
                      ? "location"
                      : locationLine
                        ? "location.fill"
                        : "location.slash"
                  }
                  size={16}
                />
                <Text
                  testID={`${testIDPrefix}-location`}
                  textStyle={
                    locationLine
                      ? undefined
                      : { fontSize: 14, color: META_TEXT_COLOR[theme] }
                  }
                >
                  {resolvingLocation
                    ? "Getting user location…"
                    : (locationLine ?? "Location disabled for this post")}
                </Text>
                {showRemoveLocation ? (
                  <>
                    <Spacer flexible />
                    <Button variant="text" onPress={onRemoveLocation}>
                      <Icon
                        name="trash"
                        size={14}
                        accessibilityLabel="Remove location"
                      />
                    </Button>
                  </>
                ) : null}
              </Row>
              <Row spacing={8}>
                <Icon name="mappin.and.ellipse" size={16} />
                <Text
                  textStyle={{ fontSize: 14, color: META_TEXT_COLOR[theme] }}
                >
                  {resolvingLocation
                    ? "Getting user location…"
                    : coordinates
                      ? formatCoordinates(
                          coordinates.latitude,
                          coordinates.longitude,
                        )
                      : "Location disabled for this post"}
                </Text>
              </Row>
            </FieldGroup.Section>

            <FieldGroup.Section title="Caption">
              <TextInput
                key={captionInputKey}
                ref={captionRef}
                testID={`${testIDPrefix}-caption`}
                defaultValue={initialCaption}
                onChangeText={onCaptionChange}
                onFocus={() => setCaptionFocused(true)}
                onBlur={() => setCaptionFocused(false)}
                placeholder="Write a caption…"
                maxLength={CAPTION_MAX_LENGTH}
                multiline
              />
              <FieldGroup.SectionFooter>
                <Text
                  textStyle={{ fontSize: 14, color: META_TEXT_COLOR[theme] }}
                >
                  {`${caption.length} / ${CAPTION_MAX_LENGTH}`}
                </Text>
              </FieldGroup.SectionFooter>
            </FieldGroup.Section>

            <FieldGroup.Section title="Visibility">
              <Picker
                testID={`${testIDPrefix}-privacy-picker`}
                selectedValue={privacyScope}
                onValueChange={(value) =>
                  onPrivacyScopeChange(value as PostPrivacyScope)
                }
                appearance="menu"
              >
                <Picker.Item label="Friends" value="friends_only" />
                <Picker.Item label="Public" value="public" />
                <Picker.Item label="Private" value="private" />
              </Picker>
            </FieldGroup.Section>

            {error ? (
              <FieldGroup.Section>
                <Text
                  testID={`${testIDPrefix}-error`}
                  textStyle={{ color: "#DC2626" }}
                >
                  {error}
                </Text>
              </FieldGroup.Section>
            ) : null}
            {footer}
          </FieldGroup>
        </Host>
      </KeyboardAwareScrollView>
      {captionFocused ? (
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={blurCaption}
          accessible={false}
        />
      ) : null}
    </>
  );
}
