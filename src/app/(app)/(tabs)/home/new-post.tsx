import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text as RNText,
  TouchableOpacity,
  View,
} from "react-native";
import { Button, Host, Icon, Text } from "@expo/ui";
import { CameraView, useCameraPermissions, type CameraType } from "expo-camera";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import { playShutterBlip } from "../../../../../modules/capture-haptics/src";
import { CameraCaptureCurtain } from "@/components/camera-capture-curtain";
import { CameraViewfinder } from "@/components/camera-viewfinder";
import { Empty } from "@/components/empty";
import { PostComposeForm } from "@/components/post-compose-form";
import * as Location from "expo-location";
import { Stack, useRouter, useTheme } from "expo-router";
import { useAuth } from "@/context/auth";
import { resolvePostLocationParts } from "@/lib/location-label";
import { buildLocationLine, type PostLocationParts } from "@/lib/post-display";
import { DEFAULT_POST_PRIVACY_SCOPE, type PostPrivacyScope } from "@/lib/posts";
import { resolveDisplayName } from "@/lib/profile-display";
import { saveLocalPost, queuePostForUpload } from "@/lib/post-manager";
import { runSync } from "@/lib/sync-manager";
import { useCreatePostMutation } from "@/queries/posts";
import { useUserProfileQuery } from "@/queries/profile";

function formatZoomLabel(zoom: number): string {
  return `${(1 + zoom * 9).toFixed(1)}x`;
}

export default function NewPostScreen() {
  const router = useRouter();
  const { session } = useAuth();
  const { colors, dark } = useTheme();
  const cameraRef = useRef<CameraView>(null);
  const shutterRingColor = dark
    ? "rgba(255, 255, 255, 0.3)"
    : "rgba(0, 0, 0, 0.12)";
  const [permission, requestPermission] = useCameraPermissions();

  const [imageUri, setImageUri] = useState<string | null>(null);
  const [capturedAt, setCapturedAt] = useState<Date | null>(null);
  const [latitude, setLatitude] = useState<number | undefined>();
  const [longitude, setLongitude] = useState<number | undefined>();
  const [locationLine, setLocationLine] = useState<string | null>(null);
  const [locationParts, setLocationParts] = useState<PostLocationParts>({});
  const [resolvingLocation, setResolvingLocation] = useState(false);
  const [caption, setCaption] = useState("");
  const [privacyScope, setPrivacyScope] = useState<PostPrivacyScope>(
    DEFAULT_POST_PRIVACY_SCOPE,
  );
  const [capturing, setCapturing] = useState(false);
  const [curtainOpen, setCurtainOpen] = useState(false);
  const [curtainUri, setCurtainUri] = useState<string | null>(null);
  const [savedLocally, setSavedLocally] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [zoom, setZoom] = useState(0);
  const [facing, setFacing] = useState<CameraType>("back");
  const [gpsEnabled, setGpsEnabled] = useState(true);
  const [showZoomIndicator, setShowZoomIndicator] = useState(false);

  const zoomRef = useRef(zoom);
  const pinchStartZoom = useRef(0);
  const zoomIndicatorTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  const didRequestCameraPermission = useRef(false);

  useEffect(() => {
    zoomRef.current = zoom;
  }, [zoom]);

  useEffect(() => {
    if (!permission || permission.granted || imageUri) {
      return;
    }
    if (didRequestCameraPermission.current) {
      return;
    }
    didRequestCameraPermission.current = true;
    void requestPermission();
  }, [permission, requestPermission, imageUri]);

  const profileQuery = useUserProfileQuery(session?.user.id, {
    enabled: !!session?.user.id && !!imageUri,
  });

  const createPostMutation = useCreatePostMutation();

  const displayName = resolveDisplayName({
    display_name: profileQuery.data?.display_name,
    username: profileQuery.data?.username,
    id: session?.user.id,
  });

  useEffect(() => {
    return () => {
      if (zoomIndicatorTimeoutRef.current) {
        clearTimeout(zoomIndicatorTimeoutRef.current);
      }
    };
  }, []);

  const handlePinchBegin = useCallback(() => {
    pinchStartZoom.current = zoomRef.current;
    setShowZoomIndicator(true);
    if (zoomIndicatorTimeoutRef.current) {
      clearTimeout(zoomIndicatorTimeoutRef.current);
    }
  }, []);

  const handlePinchUpdate = useCallback((scale: number) => {
    const logScale = Math.log2(scale);
    const next = Math.min(
      1,
      Math.max(0, pinchStartZoom.current + logScale * 0.35),
    );
    setZoom(next);
  }, []);

  const handlePinchEnd = useCallback(() => {
    zoomIndicatorTimeoutRef.current = setTimeout(() => {
      setShowZoomIndicator(false);
    }, 1000);
  }, []);

  /* eslint-disable react-hooks/refs -- RNGH handlers read refs only when gestures fire */
  const cameraGesture = useMemo(
    () =>
      Gesture.Pinch()
        .onBegin(handlePinchBegin)
        .onUpdate((event) => {
          handlePinchUpdate(event.scale);
        })
        .onEnd(handlePinchEnd)
        .runOnJS(true),
    [handlePinchBegin, handlePinchEnd, handlePinchUpdate],
  );
  /* eslint-enable react-hooks/refs */

  useEffect(() => {
    if (!imageUri || !gpsEnabled) {
      return;
    }

    let cancelled = false;

    async function resolveLocation() {
      setResolvingLocation(true);
      setLocationLine(null);
      setLatitude(undefined);
      setLongitude(undefined);
      setLocationParts({});

      try {
        const locationPermission =
          await Location.requestForegroundPermissionsAsync();
        if (!locationPermission.granted) {
          return;
        }

        const position = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        if (cancelled) {
          return;
        }

        const coords = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        };
        setLatitude(coords.latitude);
        setLongitude(coords.longitude);

        const parts = await resolvePostLocationParts(coords);
        if (!cancelled) {
          const line = buildLocationLine(parts);
          setLocationLine(line || null);
          setLocationParts(parts);
        }
      } catch {
        // Location is optional; continue without coordinates.
      } finally {
        if (!cancelled) {
          setResolvingLocation(false);
        }
      }
    }

    void resolveLocation();

    return () => {
      cancelled = true;
    };
  }, [imageUri, gpsEnabled]);

  function handleFlipCamera() {
    if (capturing) {
      return;
    }

    setFacing((current) => (current === "back" ? "front" : "back"));
    setZoom(0);
  }

  function failCapture() {
    setCurtainOpen(false);
    setCurtainUri(null);
    setCapturing(false);
    setError("Failed to capture photo. Please try again.");
  }

  function handleCurtainComplete() {
    if (!curtainUri) {
      failCapture();
      return;
    }

    setImageUri(curtainUri);
    setCurtainOpen(false);
    setCapturing(false);
  }

  async function handleShutter() {
    if (capturing || !cameraRef.current) {
      return;
    }

    setCapturing(true);
    setError(null);
    setCurtainUri(null);
    setCurtainOpen(true);
    playShutterBlip();

    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.85,
      });

      if (!photo?.uri) {
        failCapture();
        return;
      }

      setCapturedAt(new Date());
      setCurtainUri(photo.uri);
    } catch {
      failCapture();
    }
  }

  async function handleSaveForLater() {
    if (!imageUri || !session?.user.id || !capturedAt) return;
    setError(null);
    const result = await saveLocalPost({
      userId: session.user.id,
      localImageUri: imageUri,
      capturedAt: capturedAt.toISOString(),
      caption,
      privacyScope,
      latitude,
      longitude,
      displayName,
      ...locationParts,
    });
    if (result.error) {
      setError(result.error);
    } else {
      setSavedLocally(true);
      router.back();
    }
  }

  function handleSubmit() {
    if (
      !imageUri ||
      !session?.user.id ||
      !capturedAt ||
      createPostMutation.isPending
    ) {
      return;
    }

    setError(null);

    createPostMutation.mutate(
      {
        localImageUri: imageUri,
        userId: session.user.id,
        capturedAt: capturedAt.toISOString(),
        caption,
        privacyScope,
        latitude,
        longitude,
        ...locationParts,
      },
      {
        onSuccess: () => router.back(),
        onError: async () => {
          // Network/upload failed — save locally and queue for later sync
          const saveResult = await saveLocalPost({
            userId: session!.user.id,
            localImageUri: imageUri!,
            capturedAt: capturedAt!.toISOString(),
            caption,
            privacyScope,
            latitude,
            longitude,
            displayName,
            ...locationParts,
          });
          if (!saveResult.error && saveResult.localPost) {
            await queuePostForUpload(saveResult.localPost.id);
            void runSync();
            setSavedLocally(true);
            router.back();
          } else {
            setError("Failed to post. Please try again.");
          }
        },
      },
    );
  }

  const submitting = createPostMutation.isPending;
  const submitError = savedLocally
    ? null
    : (error ??
      profileQuery.error?.message ??
      createPostMutation.error?.message ??
      null);

  function handleDeleteLocation() {
    setLatitude(undefined);
    setLongitude(undefined);
    setLocationLine(null);
    setLocationParts({});
  }

  if (!imageUri) {
    if (!permission) {
      return (
        <Host
          style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
        >
          <ActivityIndicator size="large" />
        </Host>
      );
    }

    if (!permission.granted) {
      return (
        <>
          <Empty
            testID="new-post-camera-permission-required"
            title="Camera access required"
            description="Allow camera access to take a photo for your post."
            contentAlign="top"
          />
          <Stack.Toolbar placement="left">
            <Stack.Toolbar.Button
              accessibilityLabel="Back"
              onPress={() => router.back()}
            >
              Back
            </Stack.Toolbar.Button>
          </Stack.Toolbar>
        </>
      );
    }

    return (
      <>
        <View style={styles.cameraScreen}>
          <GestureDetector gesture={cameraGesture}>
            <View style={styles.cameraPreview}>
              <CameraView
                ref={cameraRef}
                style={styles.camera}
                facing={facing}
                zoom={zoom}
                animateShutter={false}
                responsiveOrientationWhenOrientationLocked={
                  process.env.EXPO_OS === "ios"
                }
              />
              <CameraViewfinder />
              {showZoomIndicator ? (
                <View pointerEvents="none" style={styles.zoomIndicator}>
                  <RNText style={styles.zoomIndicatorText}>
                    {formatZoomLabel(zoom)}
                  </RNText>
                </View>
              ) : null}
            </View>
          </GestureDetector>
          <View
            style={[styles.controls, { backgroundColor: colors.background }]}
          >
            {submitError ? (
              <Host matchContents>
                <Text
                  testID="new-post-error"
                  textStyle={{
                    color: colors.text as string,
                    textAlign: "center",
                  }}
                >
                  {submitError}
                </Text>
              </Host>
            ) : null}
            <View style={styles.controlsRow}>
              <Host matchContents>
                <Button
                  testID="camera-gps-toggle"
                  variant="text"
                  disabled={capturing}
                  onPress={() => {
                    setGpsEnabled((current) => !current);
                  }}
                >
                  <Icon
                    name={gpsEnabled ? "location.fill" : "location.slash"}
                    size={22}
                    accessibilityLabel={
                      gpsEnabled
                        ? "Disable location for post"
                        : "Enable location for post"
                    }
                  />
                </Button>
              </Host>
              <TouchableOpacity
                testID="camera-shutter-button"
                accessibilityLabel="Take photo"
                style={[
                  styles.shutterButton,
                  {
                    borderColor: colors.text,
                    backgroundColor: shutterRingColor,
                  },
                ]}
                disabled={capturing}
                onPress={() => {
                  void handleShutter();
                }}
              >
                <View
                  style={[
                    styles.shutterInner,
                    { backgroundColor: colors.text },
                  ]}
                />
              </TouchableOpacity>
              <Host matchContents>
                <Button
                  testID="camera-flip-button"
                  variant="text"
                  disabled={capturing}
                  onPress={handleFlipCamera}
                >
                  <Icon
                    name="camera.rotate"
                    size={22}
                    accessibilityLabel="Flip camera"
                  />
                </Button>
              </Host>
            </View>
          </View>
        </View>
        <Stack.Screen options={{ title: "" }} />
        <Stack.Toolbar placement="left">
          <Stack.Toolbar.Button
            accessibilityLabel="Cancel"
            disabled={capturing}
            onPress={() => router.back()}
          >
            Cancel
          </Stack.Toolbar.Button>
        </Stack.Toolbar>
        {curtainOpen ? (
          <CameraCaptureCurtain
            uri={curtainUri}
            onComplete={handleCurtainComplete}
          />
        ) : null}
      </>
    );
  }

  return (
    <>
      <PostComposeForm
        captionInputKey="new-post"
        initialCaption=""
        imageUri={imageUri}
        capturedAt={capturedAt}
        resolvingLocation={resolvingLocation}
        locationLine={locationLine}
        latitude={latitude}
        longitude={longitude}
        onRemoveLocation={handleDeleteLocation}
        caption={caption}
        onCaptionChange={setCaption}
        privacyScope={privacyScope}
        onPrivacyScopeChange={setPrivacyScope}
        error={submitError}
      />
      <Stack.Toolbar placement="left">
        <Stack.Toolbar.Button
          accessibilityLabel="Cancel"
          disabled={submitting}
          onPress={() => router.back()}
        >
          Cancel
        </Stack.Toolbar.Button>
      </Stack.Toolbar>
      <Stack.Toolbar placement="right">
        <Stack.Toolbar.Button
          accessibilityLabel="Save for later"
          disabled={submitting}
          onPress={() => {
            void handleSaveForLater();
          }}
        >
          Save for Later
        </Stack.Toolbar.Button>
        <Stack.Toolbar.Button
          accessibilityLabel="Post"
          disabled={submitting}
          variant="done"
          onPress={handleSubmit}
        >
          Post
        </Stack.Toolbar.Button>
      </Stack.Toolbar>
    </>
  );
}

const styles = StyleSheet.create({
  cameraScreen: {
    flex: 1,
    backgroundColor: "#000",
  },
  cameraPreview: {
    flex: 1,
    overflow: "hidden",
  },
  camera: {
    flex: 1,
  },
  controls: {
    height: 160,
    justifyContent: "center",
    gap: 12,
    paddingBottom: 16,
    paddingHorizontal: 16,
  },
  controlsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
  },
  zoomIndicator: {
    position: "absolute",
    bottom: 24,
    alignSelf: "center",
    backgroundColor: "rgba(0, 0, 0, 0.55)",
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  zoomIndicatorText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },
  shutterButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 4,
    justifyContent: "center",
    alignItems: "center",
  },
  shutterInner: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
});
