import { Alert, Share } from "react-native";
import { POST_LINK_ORIGIN } from "@/lib/post-sharing";

export function buildProfileLink(username: string): string {
  if (typeof username !== "string" || username.length === 0) {
    throw new Error("Invalid username");
  }
  return `${POST_LINK_ORIGIN}/user/${encodeURIComponent(username)}`;
}

export function buildProfileShareMessage(name: string): string {
  return `See ${name}’s profile on Então.`;
}

export function profileShareName(
  displayName: string | null | undefined,
  username: string | null | undefined,
): string {
  return displayName || username || "Profile";
}

export async function shareProfile(
  username: string | null | undefined,
  name: string,
): Promise<void> {
  if (!username) {
    Alert.alert("Unable to share", "This profile doesn’t have a username yet.");
    return;
  }

  try {
    await Share.share({
      message: buildProfileShareMessage(name),
      url: buildProfileLink(username),
    });
  } catch (error) {
    Alert.alert(
      "Unable to share",
      error instanceof Error ? error.message : "Unable to share profile.",
    );
  }
}
