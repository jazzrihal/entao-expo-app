import type { ReactNode } from "react";
import { ListItem, Text } from "@expo/ui";
import {
  formatMomentOccurredAt,
  momentListSubtitle,
} from "@/lib/moment-display";
import type { MomentListItem } from "@/lib/moments";

type MomentListItemProps = {
  moment: MomentListItem;
  onPress: () => void;
  testID?: string;
  trailing?: ReactNode;
};

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
      supportingText={momentListSubtitle(moment)}
    >
      {/* The row's own testID (on the outer @expo/ui ListItem Button) isn't exposed
      to the accessibility tree once the row also contains other interactive
      children (e.g. a trailing Delete Button); the row-label Text's testID is
      exposed reliably, matching the pattern used by ProfileListItem. */}
      <Text
        testID={testID ? `${testID}-name` : undefined}
        onPress={onPress}
      >
        {formatMomentOccurredAt(moment.occurred_at)}
      </Text>
      {trailing ? <ListItem.Trailing>{trailing}</ListItem.Trailing> : null}
    </ListItem>
  );
}
