import { Button, Icon } from "@expo/ui";
import type { SFSymbol } from "sf-symbols-typescript";

type PostFeedIconButtonProps = {
  icon: SFSymbol;
  accessibilityLabel: string;
  testID?: string;
  disabled?: boolean;
  onPress: () => void;
};

export function PostFeedIconButton({
  icon,
  accessibilityLabel,
  testID,
  disabled = false,
  onPress,
}: PostFeedIconButtonProps) {
  return (
    <Button
      testID={testID}
      variant="text"
      disabled={disabled}
      onPress={onPress}
    >
      <Icon name={icon} size={22} accessibilityLabel={accessibilityLabel} />
    </Button>
  );
}
