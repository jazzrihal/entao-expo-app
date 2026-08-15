import type { ReactNode } from "react";
import { useColorScheme } from "react-native";
import { Column, Icon, ListItem, Row, Text } from "@expo/ui";
import { META_TEXT_COLOR, resolveColorScheme } from "@/lib/theme-colors";
import {
  formatMomentDate,
  formatMomentLocation,
  formatMomentTime,
} from "@/lib/moment-display";
import type { MomentListItem } from "@/lib/moments";

type MomentListItemProps = {
  moment: MomentListItem;
  onPress: () => void;
  testID?: string;
  trailing?: ReactNode;
};

type MomentOccurredLabelsProps = {
  occurredAt: string;
  onPress?: () => void;
  testID?: string;
};

type MomentLocationParts = {
  address?: string | null;
  city?: string | null;
  region?: string | null;
  country?: string | null;
};

type MomentListLabelsProps = {
  occurredAt: string;
  location: MomentLocationParts;
  onPress?: () => void;
  testID?: string;
};

export function MomentOccurredLabels({
  occurredAt,
  onPress,
  testID,
}: MomentOccurredLabelsProps) {
  return (
    <Row spacing={8} alignment="center">
      <Icon name="calendar" size={16} />
      <Text testID={testID} onPress={onPress}>
        {formatMomentDate(occurredAt)}
      </Text>
      <Text onPress={onPress}>·</Text>
      <Text onPress={onPress}>{formatMomentTime(occurredAt)}</Text>
    </Row>
  );
}

/** Date/time + location stacked with a small gap (ListItem's built-in supporting gap is only 2pt). */
export function MomentListLabels({
  occurredAt,
  location,
  onPress,
  testID,
}: MomentListLabelsProps) {
  const theme = resolveColorScheme(useColorScheme());

  return (
    <Column spacing={6} alignment="start">
      <MomentOccurredLabels
        occurredAt={occurredAt}
        onPress={onPress}
        testID={testID}
      />
      <Text textStyle={{ color: META_TEXT_COLOR[theme] }}>
        {formatMomentLocation(location)}
      </Text>
    </Column>
  );
}

export function MomentListItemRow({
  moment,
  onPress,
  testID,
  trailing,
}: MomentListItemProps) {
  return (
    <ListItem testID={testID} onPress={onPress}>
      {/* The row's own testID (on the outer @expo/ui ListItem Button) isn't exposed
      to the accessibility tree once the row also contains other interactive
      children (e.g. a trailing Delete Button); the row-label Text's testID is
      exposed reliably, matching the pattern used by ProfileListItem. */}
      <MomentListLabels
        occurredAt={moment.occurred_at}
        location={moment}
        onPress={onPress}
        testID={testID ? `${testID}-name` : undefined}
      />
      {trailing ? <ListItem.Trailing>{trailing}</ListItem.Trailing> : null}
    </ListItem>
  );
}
