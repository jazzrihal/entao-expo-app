import { useState } from "react";
import { Button, Picker, Row, Text } from "@expo/ui";
import { EmptyActionsSheet } from "@/components/empty-actions-sheet";
import { REPORT_REASON_OPTIONS, type ReportReason } from "@/lib/reports";

const DEFAULT_REASON: ReportReason = "spam";

type ReportSheetProps = {
  isPresented: boolean;
  targetLabel: "post" | "profile";
  onDismiss: () => void;
  onSubmit: (reason: ReportReason) => void;
  isSubmitting: boolean;
  error: string | null;
};

export function ReportSheet({
  isPresented,
  targetLabel,
  onDismiss,
  onSubmit,
  isSubmitting,
  error,
}: ReportSheetProps) {
  const [selectedReason, setSelectedReason] =
    useState<ReportReason>(DEFAULT_REASON);

  const handleDismiss = () => {
    setSelectedReason(DEFAULT_REASON);
    onDismiss();
  };

  return (
    <EmptyActionsSheet
      isPresented={isPresented}
      onDismiss={handleDismiss}
      testID="report-sheet"
    >
      <Text testID="report-sheet-title" textStyle={{ textAlign: "center" }}>
        {`Report this ${targetLabel}?`}
      </Text>
      <Picker
        testID="report-reason-picker"
        selectedValue={selectedReason}
        onValueChange={(value) => setSelectedReason(value as ReportReason)}
        appearance="menu"
      >
        {REPORT_REASON_OPTIONS.map((option) => (
          <Picker.Item
            key={option.value}
            label={option.label}
            value={option.value}
          />
        ))}
      </Picker>
      {error ? (
        <Text testID="report-error" textStyle={{ color: "#DC2626" }}>
          {error}
        </Text>
      ) : null}
      <Row spacing={12} alignment="center">
        <Button
          testID="report-cancel"
          variant="outlined"
          label="Cancel"
          disabled={isSubmitting}
          onPress={handleDismiss}
        />
        <Button
          testID="report-submit"
          variant="filled"
          label={isSubmitting ? "Reporting…" : "Report"}
          disabled={isSubmitting}
          onPress={() => onSubmit(selectedReason)}
        />
      </Row>
    </EmptyActionsSheet>
  );
}
