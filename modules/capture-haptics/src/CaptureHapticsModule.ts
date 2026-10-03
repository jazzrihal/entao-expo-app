import { NativeModule, requireOptionalNativeModule } from "expo";

declare class CaptureHapticsModule extends NativeModule<Record<string, never>> {
  playShutterBlip(): void;
  playDevelopRamp(durationMs: number): void;
  stopDevelopRamp(): void;
}

export default requireOptionalNativeModule<CaptureHapticsModule>(
  "CaptureHaptics",
);
