import { requireOptionalNativeModule } from "expo";

type CaptureHapticsNative = {
  playShutterBlip: () => void;
  playDevelopRamp: (durationMs: number) => void;
  stopDevelopRamp: () => void;
};

const CaptureHaptics =
  requireOptionalNativeModule<CaptureHapticsNative>("CaptureHaptics");

export function playShutterBlip(): void {
  CaptureHaptics?.playShutterBlip();
}

export function playDevelopRamp(durationMs: number): void {
  CaptureHaptics?.playDevelopRamp(durationMs);
}

export function stopDevelopRamp(): void {
  CaptureHaptics?.stopDevelopRamp();
}
