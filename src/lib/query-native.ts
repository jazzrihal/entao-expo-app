import NetInfo from "@react-native-community/netinfo";
import { AppState, type AppStateStatus } from "react-native";
import { focusManager, onlineManager } from "@tanstack/react-query";

// Pause fetches while offline so a cached friends feed or profile stays
// visible instead of turning into a failed request. They resume on reconnect.
onlineManager.setEventListener((setOnline) => {
  return NetInfo.addEventListener((state) => {
    setOnline(state.isConnected ?? true);
  });
});

focusManager.setEventListener((handleFocus) => {
  const subscription = AppState.addEventListener(
    "change",
    (status: AppStateStatus) => {
      handleFocus(status === "active");
    },
  );

  return () => subscription.remove();
});
