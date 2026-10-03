/* eslint-disable no-restricted-imports -- develop fade must stay transparent; the shared Image paints a solid background */
import { Image as ExpoImage } from "expo-image";
import { useCallback, useEffect, useRef, useState } from "react";
import { Modal, StyleSheet, useWindowDimensions, View } from "react-native";
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

const BLADE_MS = 280;
const BLACK_HOLD_MS = 150;
const LOAD_FALLBACK_MS = 300;
const DEVELOP_MS = 1000;

type CameraCaptureCurtainProps = {
  uri: string | null;
  onComplete: () => void;
};

export function CameraCaptureCurtain({
  uri,
  onComplete,
}: CameraCaptureCurtainProps) {
  const { height } = useWindowDimensions();
  const panelHeight = Math.ceil(height / 2);
  const topY = useSharedValue(-panelHeight);
  const bottomY = useSharedValue(panelHeight);
  const photoOpacity = useSharedValue(0);
  const [developing, setDeveloping] = useState(false);

  const aliveRef = useRef(true);
  const bladesStartedRef = useRef(false);
  const bladesMetCountRef = useRef(0);
  const blackHoldDoneRef = useRef(false);
  const imageLoadedRef = useRef(false);
  const loadFallbackRef = useRef(false);
  const fadeStartedRef = useRef(false);
  const completedRef = useRef(false);
  const holdTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onCompleteRef = useRef(onComplete);
  const startFadeIfReadyRef = useRef<() => void>(() => {});

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  const finishFade = useCallback(() => {
    if (!aliveRef.current || completedRef.current) {
      return;
    }
    completedRef.current = true;
    onCompleteRef.current();
  }, []);

  const startFadeIfReady = useCallback(() => {
    if (!aliveRef.current || fadeStartedRef.current) {
      return;
    }
    if (!blackHoldDoneRef.current) {
      return;
    }
    if (!imageLoadedRef.current && !loadFallbackRef.current) {
      return;
    }

    fadeStartedRef.current = true;
    setDeveloping(true);
  }, []);

  useEffect(() => {
    if (!developing) {
      return;
    }

    photoOpacity.value = withTiming(
      1,
      { duration: DEVELOP_MS, easing: Easing.linear },
      (finished) => {
        if (finished) {
          runOnJS(finishFade)();
        }
      },
    );
  }, [developing, finishFade, photoOpacity]);

  useEffect(() => {
    startFadeIfReadyRef.current = startFadeIfReady;
  }, [startFadeIfReady]);

  const markBladeMet = useCallback(() => {
    if (!aliveRef.current) {
      return;
    }
    bladesMetCountRef.current += 1;
    if (bladesMetCountRef.current < 2) {
      return;
    }
    holdTimerRef.current = setTimeout(() => {
      if (!aliveRef.current) {
        return;
      }
      blackHoldDoneRef.current = true;
      startFadeIfReadyRef.current();
    }, BLACK_HOLD_MS);
  }, []);

  useEffect(() => {
    aliveRef.current = true;
    return () => {
      aliveRef.current = false;
      if (holdTimerRef.current) {
        clearTimeout(holdTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (bladesStartedRef.current || panelHeight <= 0) {
      return;
    }
    bladesStartedRef.current = true;

    const config = {
      duration: BLADE_MS,
      easing: Easing.in(Easing.cubic),
    };

    topY.value = -panelHeight;
    bottomY.value = panelHeight;
    topY.value = withTiming(0, config, (finished) => {
      if (finished) {
        runOnJS(markBladeMet)();
      }
    });
    bottomY.value = withTiming(0, config, (finished) => {
      if (finished) {
        runOnJS(markBladeMet)();
      }
    });
  }, [bottomY, markBladeMet, panelHeight, topY]);

  useEffect(() => {
    if (!uri) {
      return;
    }

    imageLoadedRef.current = false;
    loadFallbackRef.current = false;
    const loadTimer = setTimeout(() => {
      if (!aliveRef.current) {
        return;
      }
      loadFallbackRef.current = true;
      startFadeIfReadyRef.current();
    }, LOAD_FALLBACK_MS);

    return () => {
      clearTimeout(loadTimer);
    };
  }, [uri]);

  const topStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: topY.value }],
  }));
  const bottomStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: bottomY.value }],
  }));
  const photoStyle = useAnimatedStyle(() => ({
    opacity: photoOpacity.value,
  }));

  function handleImageLoad() {
    imageLoadedRef.current = true;
    startFadeIfReadyRef.current();
  }

  return (
    <Modal
      animationType="none"
      transparent
      presentationStyle="overFullScreen"
      statusBarTranslucent
      visible
      onRequestClose={() => {}}
    >
      <View pointerEvents="none" style={styles.fill}>
        <Animated.View
          style={[styles.panel, { height: panelHeight, top: 0 }, topStyle]}
        />
        <Animated.View
          style={[
            styles.panel,
            { height: panelHeight, bottom: 0 },
            bottomStyle,
          ]}
        />
        <Animated.View style={[StyleSheet.absoluteFill, photoStyle]}>
          {uri ? (
            <ExpoImage
              source={{ uri }}
              style={StyleSheet.absoluteFill}
              contentFit="cover"
              onLoad={handleImageLoad}
            />
          ) : null}
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  fill: {
    flex: 1,
    overflow: "hidden",
    backgroundColor: "transparent",
  },
  panel: {
    position: "absolute",
    left: 0,
    right: 0,
    backgroundColor: "#000",
  },
});
