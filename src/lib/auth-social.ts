import { Platform } from "react-native";
import * as AppleAuthentication from "expo-apple-authentication";
import * as Device from "expo-device";
import { supabase } from "@/lib/supabase";

function appleFullName(
  fullName: AppleAuthentication.AppleAuthenticationFullName | null,
): {
  full_name?: string;
  given_name?: string | null;
  family_name?: string | null;
} | null {
  if (!fullName) return null;
  const parts = [
    fullName.givenName,
    fullName.middleName,
    fullName.familyName,
  ].filter((part): part is string => Boolean(part));
  if (parts.length === 0) return null;
  return {
    full_name: parts.join(" "),
    given_name: fullName.givenName,
    family_name: fullName.familyName,
  };
}

function isAppleCancelError(e: unknown): boolean {
  if (!e || typeof e !== "object") return false;
  const err = e as { code?: unknown; message?: unknown };
  if (err.code === "ERR_REQUEST_CANCELED") return true;
  // expo-apple-authentication sometimes rejects with a plain Error and no `code`
  return (
    typeof err.message === "string" &&
    /cancel(l)?ed the authorization attempt/i.test(err.message)
  );
}

type SignInWithAppleOptions = {
  /** Called after the native Apple sheet resolves with a credential (before Supabase). */
  onAfterNativeAuth?: () => void;
};

export async function signInWithApple(
  options?: SignInWithAppleOptions,
): Promise<{ error: string | null }> {
  if (Platform.OS !== "ios") {
    return { error: "Sign in with Apple is only available on iOS." };
  }

  // Apple's ASAuthorizationController often never completes on Simulator
  // (spinner in the sheet, then hang). Cancel still works; success does not.
  if (!Device.isDevice) {
    return {
      error:
        "Sign in with Apple cannot complete on the iOS Simulator. Please use a physical iPhone.",
    };
  }

  try {
    const available = await AppleAuthentication.isAvailableAsync();
    if (!available) {
      return { error: "Sign in with Apple is not available on this device." };
    }

    const credential = await AppleAuthentication.signInAsync({
      requestedScopes: [
        AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
        AppleAuthentication.AppleAuthenticationScope.EMAIL,
      ],
    });

    options?.onAfterNativeAuth?.();

    if (!credential.identityToken) {
      return { error: "Apple sign-in did not return an identity token." };
    }

    const { error } = await supabase.auth.signInWithIdToken({
      provider: "apple",
      token: credential.identityToken,
    });
    if (error) return { error: error.message };

    const nameData = appleFullName(credential.fullName);
    if (nameData) {
      await supabase.auth.updateUser({ data: nameData });
    }

    return { error: null };
  } catch (e) {
    if (isAppleCancelError(e)) {
      return { error: null };
    }
    return {
      error: e instanceof Error ? e.message : "Apple sign-in failed.",
    };
  }
}
