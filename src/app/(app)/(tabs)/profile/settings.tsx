import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { Button, FieldGroup, Text } from "@expo/ui";
import { ProfileAccountFields } from "@/components/profile-account-fields";
import { Stack, useRouter } from "expo-router";
import { useAuth } from "@/context/auth";
import { formatDateOnly, parseDateOnly } from "@/lib/profile";
import {
  useAccountDeletionRequestQuery,
  useCancelAccountDeletionMutation,
  useRequestAccountDeletionMutation,
  useUpdateUserProfileMutation,
  useUserProfileQuery,
} from "@/queries/profile";

export default function Settings() {
  const router = useRouter();
  const { session, signOut } = useAuth();
  const userId = session?.user.id;

  const profileQuery = useUserProfileQuery(userId);
  const updateMutation = useUpdateUserProfileMutation();
  const deletionQuery = useAccountDeletionRequestQuery(userId);
  const requestDeletionMutation = useRequestAccountDeletionMutation();
  const cancelDeletionMutation = useCancelAccountDeletionMutation();

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

  const handleDeleteAccount = useCallback(() => {
    if (requestDeletionMutation.isPending) return;
    Alert.alert(
      "Delete account?",
      "Your account will be permanently deleted after a 30-day grace period. You can cancel anytime before then.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            requestDeletionMutation.mutate(undefined, {
              onError: (error) =>
                Alert.alert("Unable to delete account", error.message),
            });
          },
        },
      ],
    );
  }, [requestDeletionMutation]);

  const handleCancelDeletion = useCallback(() => {
    if (cancelDeletionMutation.isPending) return;
    cancelDeletionMutation.mutate(undefined, {
      onError: (error) =>
        Alert.alert("Unable to cancel account deletion", error.message),
    });
  }, [cancelDeletionMutation]);

  const pendingDeletion =
    deletionQuery.data?.status === "pending" ? deletionQuery.data : null;

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
          >
            <FieldGroup.Section>
              <Button
                variant="text"
                label="Sign out"
                onPress={() => void signOut()}
              />
            </FieldGroup.Section>
            {deletionQuery.isPending ? null : pendingDeletion ? (
              <FieldGroup.Section>
                <Text testID="profile-account-deletion-scheduled">
                  {`Account scheduled for deletion on ${new Date(pendingDeletion.scheduled_for).toLocaleDateString()}`}
                </Text>
                <Button
                  variant="text"
                  label="Cancel account deletion"
                  disabled={cancelDeletionMutation.isPending}
                  onPress={handleCancelDeletion}
                />
              </FieldGroup.Section>
            ) : (
              <FieldGroup.Section>
                <Button
                  variant="text"
                  disabled={requestDeletionMutation.isPending}
                  onPress={handleDeleteAccount}
                >
                  <Text textStyle={{ color: "#DC2626" }}>Delete account</Text>
                </Button>
              </FieldGroup.Section>
            )}
          </ProfileAccountFields>
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
      <Stack.Toolbar placement="left">
        <Stack.Toolbar.Button
          accessibilityLabel="Cancel"
          onPress={() => router.back()}
        >
          Cancel
        </Stack.Toolbar.Button>
      </Stack.Toolbar>
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
