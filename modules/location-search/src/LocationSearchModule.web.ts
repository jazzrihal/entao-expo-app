import { registerWebModule, NativeModule } from "expo";

// LocationSearchModule is not available on the web platform.
class LocationSearchModule extends NativeModule<Record<string, never>> {}

export default registerWebModule(LocationSearchModule, "LocationSearchModule");
