/* eslint-disable no-restricted-imports -- wrapper delegates to expo-image */
import {
  Image as ExpoImage,
  type ImageContentFit,
  type ImageProps,
} from "expo-image";
import { useCallback, useState, type ComponentType } from "react";
import { Pressable, StyleSheet } from "react-native";

const DEV_BACKGROUND = "grey";

type EntaoImageProps = Omit<ImageProps, "onPress"> & {
  resizeOnTap?: boolean;
  onPress?: () => void;
};

function toggleContentFit(fit: ImageContentFit): ImageContentFit {
  return fit === "cover" ? "contain" : "cover";
}

function contentFitAccessibilityLabel(fit: ImageContentFit): string {
  return `Photo, ${fit}`;
}

function ImageComponent({
  style,
  contentFit = "cover",
  resizeOnTap = false,
  onPress,
  testID,
  ...props
}: EntaoImageProps) {
  const [activeContentFit, setActiveContentFit] =
    useState<ImageContentFit>(contentFit);
  const resolvedContentFit = resizeOnTap ? activeContentFit : contentFit;

  const flattenedStyle = StyleSheet.flatten([
    __DEV__ ? { backgroundColor: DEV_BACKGROUND } : undefined,
    style,
  ]);

  const handlePress = useCallback(() => {
    setActiveContentFit((current) => toggleContentFit(current));
    onPress?.();
  }, [onPress]);

  const image = (
    <ExpoImage
      {...props}
      contentFit={resolvedContentFit}
      style={resizeOnTap ? StyleSheet.absoluteFill : flattenedStyle}
    />
  );

  if (!resizeOnTap) {
    return (
      <ExpoImage
        {...props}
        contentFit={resolvedContentFit}
        style={flattenedStyle}
      />
    );
  }

  return (
    <Pressable
      accessibilityLabel={contentFitAccessibilityLabel(resolvedContentFit)}
      accessibilityRole="button"
      onPress={handlePress}
      style={flattenedStyle}
      testID={testID}
    >
      {image}
    </Pressable>
  );
}

export const Image = Object.assign(
  ImageComponent,
  ExpoImage,
) as ComponentType<EntaoImageProps> & typeof ExpoImage;

export type {
  ImageCacheConfig,
  ImageContentFit,
  ImageContentPosition,
  ImageLoadOptions,
  ImagePrefetchOptions,
  ImageProps,
  ImageRef,
  ImageSource,
  ImageTransition,
} from "expo-image";
