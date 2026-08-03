import {
  createContext,
  useCallback,
  useContext,
  useRef,
  type ReactNode,
} from "react";
import type { TextInputRef } from "@expo/ui";

type AuthKeyboardContextValue = {
  dismiss: () => void;
  setFocusedInput: (ref: TextInputRef | null) => void;
};

const AuthKeyboardContext = createContext<AuthKeyboardContextValue | null>(
  null,
);

export function AuthKeyboardProvider({ children }: { children: ReactNode }) {
  const focusedRef = useRef<TextInputRef | null>(null);

  const setFocusedInput = useCallback((ref: TextInputRef | null) => {
    focusedRef.current = ref;
  }, []);

  const dismiss = useCallback(() => {
    focusedRef.current?.blur();
    focusedRef.current = null;
  }, []);

  return (
    <AuthKeyboardContext.Provider value={{ dismiss, setFocusedInput }}>
      {children}
    </AuthKeyboardContext.Provider>
  );
}

export function useAuthKeyboard() {
  return useContext(AuthKeyboardContext);
}
