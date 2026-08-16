import { useCallback, useEffect, useRef, useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, View } from "react-native";
import { ProfileAccountFields } from "@/components/profile-account-fields";
import { Stack } from "expo-router";
import { useAuth } from "@/context/auth";
import { formatDateOnly, parseDateOnly } from "@/lib/profile";
import {
  useUpdateUserProfileMutation,
  useUserProfileQuery,
} from "@/queries/profile";

export default function AccountSettings() {
  const { session } = useAuth();
  const userId = session?.user.id;

  const profileQuery = useUserProfileQuery(userId);
  const updateMutation = useUpdateUserProfileMutation();

  const [username, setUsername] = useState("");
  const [displayNameField, setDisplayNameField] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState<Date | undefined>(undefined);
  const [actionError, setActionError] = useState<string | null>(null);
  const [fieldsSeeded, setFieldsSeeded] = useState(false);
  const hasSeededFields = useRef(false);

  useEffect(() => {
    if (hasSeededFields.current || !profileQuery.data) return;
    hasSeededFields.current = true;
    setUsername(profileQuery.data.username ?? "");
    setDisplayNameField(profileQuery.data.display_name ?? "");
    setDateOfBirth(parseDateOnly(profileQuery.data.date_of_birth));
    setFieldsSeeded(true);
  }, [profileQuery.data]);

  const handleSaveAccount = useCallback(() => {
    if (!userId || updateMutation.isPending) return;
    setActionError(null);
    updateMutation.mutate(
      {
        username,
        display_name: displayNameField,
        date_of_birth: formatDateOnly(dateOfBirth),
      },
      {
        onError: (error) => setActionError(error.message),
        onSuccess: () => setActionError(null),
      },
    );
  }, [userId, updateMutation, username, displayNameField, dateOfBirth]);

  return (
    <>
      <View style={styles.screen}>
        {fieldsSeeded ? (
          <ProfileAccountFields
            username={username}
            displayName={displayNameField}
            dateOfBirth={dateOfBirth}
            email={session?.user.email}
            onUsernameChange={setUsername}
            onDisplayNameChange={setDisplayNameField}
            onDateOfBirthChange={setDateOfBirth}
            errorMessage={actionError}
          />
        ) : (
          <ScrollView
            style={styles.screen}
            contentContainerStyle={styles.scrollContent}
          >
            <ActivityIndicator
              testID="profile-account-loading"
              style={styles.loader}
            />
          </ScrollView>
        )}
      </View>
      <Stack.Toolbar placement="right">
        <Stack.Toolbar.Button
          accessibilityLabel={updateMutation.isPending ? "Saving" : "Save"}
          variant="done"
          disabled={updateMutation.isPending}
          onPress={handleSaveAccount}
        >
          {updateMutation.isPending ? "Saving…" : "Save"}
        </Stack.Toolbar.Button>
      </Stack.Toolbar>
    </>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  loader: {
    marginTop: 32,
  },
});
