import type { ReactNode } from "react";
import { Pressable, View } from "react-native";
import { render, screen, userEvent } from "@testing-library/react-native";
import * as WebBrowser from "expo-web-browser";

import { TERMS_URL } from "@/lib/terms";
import { TermsAgreement } from "../terms-agreement";

jest.mock("expo-web-browser", () => ({
  openBrowserAsync: jest.fn(),
}));

jest.mock("@/lib/supabase", () => ({
  supabase: {},
}));

function mockHost({ children }: { children: ReactNode }) {
  return <View>{children}</View>;
}

function mockCheckbox({
  testID,
  value,
  onValueChange,
  disabled,
}: {
  testID?: string;
  value: boolean;
  onValueChange: (next: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <Pressable
      testID={testID}
      disabled={disabled}
      onPress={() => onValueChange(!value)}
    />
  );
}

jest.mock("@expo/ui", () => ({
  Host: mockHost,
  Checkbox: mockCheckbox,
}));

describe("TermsAgreement", () => {
  beforeEach(() => {
    jest.mocked(WebBrowser.openBrowserAsync).mockReset();
  });

  it("shows the terms copy", async () => {
    await render(<TermsAgreement checked={false} onChange={() => {}} />);

    expect(screen.getByText("I agree to the Terms of Service")).toBeTruthy();
  });

  it("opens the terms URL when the link is pressed", async () => {
    const user = userEvent.setup();
    await render(<TermsAgreement checked={false} onChange={() => {}} />);

    await user.press(screen.getByTestId("auth-terms-link"));

    expect(WebBrowser.openBrowserAsync).toHaveBeenCalledWith(TERMS_URL);
  });

  it("toggles the checkbox via onChange", async () => {
    const user = userEvent.setup();
    const onChange = jest.fn();
    await render(<TermsAgreement checked={false} onChange={onChange} />);

    await user.press(screen.getByTestId("auth-terms-checkbox"));

    expect(onChange).toHaveBeenCalledWith(true);
  });

  it("does not open the browser when the link is disabled", async () => {
    const user = userEvent.setup();
    await render(
      <TermsAgreement checked={false} onChange={() => {}} disabled />,
    );

    await user.press(screen.getByTestId("auth-terms-link"));

    expect(WebBrowser.openBrowserAsync).not.toHaveBeenCalled();
  });
});
