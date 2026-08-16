import type { ReactNode } from "react";
import { useCallback } from "react";
import { ListItem, Text } from "@expo/ui";
import { useRouter } from "expo-router";
import { useAuth } from "@/context/auth";
import { openUserProfile } from "@/lib/navigation";
import {
  displayNameFontSize,
  resolveDisplayName,
} from "@/lib/profile-display";
import {
  relationshipLabel,
  type RelationshipKind,
} from "@/lib/relationship-status";

type ProfileListItemProps = {
  displayName: string;
  username: string;
  profileId?: string;
  subtitle?: string;
  relationship?: RelationshipKind;
  onPress?: () => void;
  testID?: string;
  trailing?: ReactNode;
};

export function ProfileListItem({
  displayName,
  username,
  profileId,
  subtitle,
  relationship,
  onPress,
  testID,
  trailing,
}: ProfileListItemProps) {
  const router = useRouter();
  const { session } = useAuth();

  const titleText = resolveDisplayName({
    display_name: displayName,
    username,
    id: profileId,
  });
  const statusLabel = relationship ? relationshipLabel(relationship) : "";
  const meta = subtitle ?? (trailing ? undefined : statusLabel || undefined);
  const handle = username.trim() ? `@${username}` : "";
  const supportingText = handle && meta ? `${handle} · ${meta}` : handle || meta;

  const openProfile = useCallback(() => {
    if (!profileId) {
      return;
    }

    openUserProfile(router, session?.user.id, {
      id: profileId,
      displayName: titleText,
      username,
    });
  }, [profileId, router, session?.user.id, titleText, username]);

  const title = profileId ? (
    <Text
      textStyle={{
        fontSize: displayNameFontSize(titleText.length, 17),
        fontWeight: "600",
      }}
      testID={testID ? `${testID}-name` : undefined}
      onPress={openProfile}
    >
      {titleText}
    </Text>
  ) : (
    titleText
  );

  return (
    <ListItem testID={testID} onPress={onPress} supportingText={supportingText}>
      {title}
      {trailing ? <ListItem.Trailing>{trailing}</ListItem.Trailing> : null}
    </ListItem>
  );
}
