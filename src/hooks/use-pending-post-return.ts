import { useEffect, useState } from "react";
import {
  isInitialPostLinkResolved,
  peekPostReturnPath,
  subscribeInitialPostLinkResolved,
} from "@/lib/post-sharing";

/** True after cold-start Linking.getInitialURL has been inspected. */
export function useInitialPostLinkReady(): boolean {
  const [ready, setReady] = useState(isInitialPostLinkResolved);

  useEffect(() => {
    return subscribeInitialPostLinkResolved(() => {
      setReady(true);
    });
  }, []);

  return ready;
}

export function usePendingPostReturnPath(): string | null {
  useInitialPostLinkReady();
  return peekPostReturnPath();
}
