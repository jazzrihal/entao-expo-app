import { StyleSheet, View } from "react-native";

const INSET = 20;
const STROKE = 1.5;
const STROKE_COLOR = "rgba(255, 255, 255, 0.9)";
const ARM = 14;
const GAP = 10;
const TICK = 28;
const LEG = 22;
const THIRD = "33.333333%";
const TWO_THIRDS = "66.666667%";

const stroke = {
  position: "absolute" as const,
  backgroundColor: STROKE_COLOR,
};

export function CameraViewfinder() {
  return (
    <View
      pointerEvents="none"
      accessible={false}
      importantForAccessibility="no-hide-descendants"
      style={StyleSheet.absoluteFill}
    >
      <View style={[stroke, styles.topLeftHorizontal]} />
      <View style={[stroke, styles.topLeftVertical]} />
      <View style={[stroke, styles.topRightHorizontal]} />
      <View style={[stroke, styles.topRightVertical]} />
      <View style={[stroke, styles.bottomLeftHorizontal]} />
      <View style={[stroke, styles.bottomLeftVertical]} />
      <View style={[stroke, styles.bottomRightHorizontal]} />
      <View style={[stroke, styles.bottomRightVertical]} />

      <View style={[stroke, styles.tick, styles.tickUpperLeft]} />
      <View style={[stroke, styles.tick, styles.tickUpperRight]} />
      <View style={[stroke, styles.tick, styles.tickLowerLeft]} />
      <View style={[stroke, styles.tick, styles.tickLowerRight]} />

      <View style={styles.crosshairLayer}>
        <View style={styles.horizontalArms}>
          <View style={styles.horizontalArm} />
          <View style={styles.horizontalGap} />
          <View style={styles.horizontalArm} />
        </View>
        <View style={styles.verticalArms}>
          <View style={styles.verticalArm} />
          <View style={styles.verticalGap} />
          <View style={styles.verticalArm} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  topLeftHorizontal: {
    top: INSET,
    left: INSET,
    width: LEG,
    height: STROKE,
  },
  topLeftVertical: {
    top: INSET,
    left: INSET,
    width: STROKE,
    height: LEG,
  },
  topRightHorizontal: {
    top: INSET,
    right: INSET,
    width: LEG,
    height: STROKE,
  },
  topRightVertical: {
    top: INSET,
    right: INSET,
    width: STROKE,
    height: LEG,
  },
  bottomLeftHorizontal: {
    bottom: INSET,
    left: INSET,
    width: LEG,
    height: STROKE,
  },
  bottomLeftVertical: {
    bottom: INSET,
    left: INSET,
    width: STROKE,
    height: LEG,
  },
  bottomRightHorizontal: {
    bottom: INSET,
    right: INSET,
    width: LEG,
    height: STROKE,
  },
  bottomRightVertical: {
    bottom: INSET,
    right: INSET,
    width: STROKE,
    height: LEG,
  },
  tick: {
    width: TICK,
    height: STROKE,
    marginTop: -STROKE / 2,
  },
  tickUpperLeft: {
    top: THIRD,
    left: INSET,
  },
  tickUpperRight: {
    top: THIRD,
    right: INSET,
  },
  tickLowerLeft: {
    top: TWO_THIRDS,
    left: INSET,
  },
  tickLowerRight: {
    top: TWO_THIRDS,
    right: INSET,
  },
  crosshairLayer: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    alignItems: "center",
    justifyContent: "center",
  },
  horizontalArms: {
    position: "absolute",
    flexDirection: "row",
    alignItems: "center",
  },
  verticalArms: {
    position: "absolute",
    alignItems: "center",
  },
  horizontalArm: {
    width: ARM,
    height: STROKE,
    backgroundColor: STROKE_COLOR,
  },
  horizontalGap: {
    width: GAP,
    height: STROKE,
  },
  verticalArm: {
    width: STROKE,
    height: ARM,
    backgroundColor: STROKE_COLOR,
  },
  verticalGap: {
    width: STROKE,
    height: GAP,
  },
});
