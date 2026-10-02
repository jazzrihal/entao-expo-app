import { NativeModule, requireNativeModule } from "expo";

declare class LocationSearchModule extends NativeModule<Record<string, never>> {
  setValueAsync(value: string): Promise<void>;
}

export default requireNativeModule<LocationSearchModule>("LocationSearch");
