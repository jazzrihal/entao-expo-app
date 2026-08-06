import type { ReactNode } from "react";
import { Icon, ListItem, Row, Text } from "@expo/ui";
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
      <Text onPress={onPress}>{formatMomentTime(occurredAt)}</Text>
    </Row>
  );
}

export function MomentLocationLabel(parts: {
  address?: string | null;
  city?: string | null;
  region?: string | null;
  country?: string | null;
}) {
  return (
    <Row spacing={8}>
      <Icon name="mappin.and.ellipse" size={16} />
      <Text>{formatMomentLocation(parts)}</Text>
    </Row>
  );
}

export function MomentListItemRow({
  moment,
  onPress,
  testID,
  trailing,
}: MomentListItemProps) {
  return (
    <ListItem
      testID={testID}
      onPress={onPress}
      supportingText={<MomentLocationLabel {...moment} />}
    >
      {/* The row's own testID (on the outer @expo/ui ListItem Button) isn't exposed
      to the accessibility tree once the row also contains other interactive
      children (e.g. a trailing Delete Button); the row-label Text's testID is
      exposed reliably, matching the pattern used by ProfileListItem. */}
      <MomentOccurredLabels
        occurredAt={moment.occurred_at}
        onPress={onPress}
        testID={testID ? `${testID}-name` : undefined}
      />
      {trailing ? <ListItem.Trailing>{trailing}</ListItem.Trailing> : null}
    </ListItem>
  );
}
