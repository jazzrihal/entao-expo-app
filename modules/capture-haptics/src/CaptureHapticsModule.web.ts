import { NativeModule, registerWebModule } from "expo";

class CaptureHapticsModule extends NativeModule<Record<string, never>> {
  playShutterBlip(): void {}

  playDevelopRamp(_durationMs: number): void {}

  stopDevelopRamp(): void {}
}

export default registerWebModule(CaptureHapticsModule, "CaptureHaptics");
