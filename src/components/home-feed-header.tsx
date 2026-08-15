import { StyleSheet, useColorScheme, View } from "react-native";
import CommunityDateTimePicker from "@expo/ui/community/datetime-picker";
import { Host, Button } from "@expo/ui";
import { ELEVATED_BACKGROUND, resolveColorScheme } from "@/lib/theme-colors";

type HomeFeedHeaderProps = {
  selectedDate: Date;
  onDateChange: (date: Date) => void;
  locationLabel: string;
  onLocationPress: () => void;
};

export function HomeFeedHeader({
  selectedDate,
  onDateChange,
  locationLabel,
  onLocationPress,
}: HomeFeedHeaderProps) {
  const theme = resolveColorScheme(useColorScheme());

  return (
    <View
      style={[
        styles.headerRow,
        { backgroundColor: ELEVATED_BACKGROUND[theme] },
      ]}
    >
      <Host matchContents>
        <Button
          testID="home-feed-location"
          variant="outlined"
          label={locationLabel}
          onPress={onLocationPress}
        />
      </Host>
      <View style={styles.spacer} />
      <CommunityDateTimePicker
        value={selectedDate}
        mode="datetime"
        display="compact"
        style={styles.datePicker}
        onValueChange={(_, date) => {
          onDateChange(date);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    minHeight: 56,
  },
  spacer: {
    flex: 1,
  },
  datePicker: {
    width: 210,
  },
});
