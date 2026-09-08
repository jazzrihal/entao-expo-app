import type { ReactNode } from "react";
import { Pressable, Text, View } from "react-native";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  render,
  screen,
  userEvent,
  waitFor,
} from "@testing-library/react-native";
import * as WebBrowser from "expo-web-browser";

import { TermsGate } from "@/components/terms-gate";
import {
  acceptTerms,
  getCurrentTerms,
  hasAcceptedCurrentTerms,
} from "@/lib/terms";

jest.mock("expo-web-browser", () => ({
  openBrowserAsync: jest.fn(),
}));

jest.mock("@/lib/supabase", () => ({
  supabase: {},
}));

jest.mock("@/lib/terms", () => ({
  ...jest.requireActual("@/lib/terms"),
  hasAcceptedCurrentTerms: jest.fn(),
  getCurrentTerms: jest.fn(),
  acceptTerms: jest.fn(),
}));

function mockAuthScreen({
  testID,
  title,
  action,
  children,
}: {
  testID?: string;
  title: string;
  action?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <View testID={testID}>
      <Text>{title}</Text>
      {action}
      {children}
    </View>
  );
}

function mockHost({ children }: { children: ReactNode }) {
  return <View>{children}</View>;
}

function mockButton({
  testID,
  onPress,
  disabled,
}: {
  testID?: string;
  onPress?: () => void;
  disabled?: boolean;
}) {
  return <Pressable testID={testID} disabled={disabled} onPress={onPress} />;
}

jest.mock("@/components/auth/auth-screen", () => ({
  AuthScreen: mockAuthScreen,
}));

jest.mock("@expo/ui", () => ({
  Host: mockHost,
  Button: mockButton,
}));

const CURRENT_TERMS = {
  slug: "tos-2026-01",
  content_hash: "hash-abc",
  url: "https://entao.link/terms/tos-2026-01",
};

const ACCEPTANCE = {
  id: "acc-1",
  user_id: "user-1",
  terms_slug: CURRENT_TERMS.slug,
  content_hash: CURRENT_TERMS.content_hash,
  accepted_at: "2026-09-08T00:00:00Z",
};

const mockHasAccepted = hasAcceptedCurrentTerms as jest.MockedFunction<
  typeof hasAcceptedCurrentTerms
>;
const mockGetCurrentTerms = getCurrentTerms as jest.MockedFunction<
  typeof getCurrentTerms
>;
const mockAcceptTerms = acceptTerms as jest.MockedFunction<typeof acceptTerms>;

async function renderGate() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <TermsGate>
        <View testID="gated-children" />
      </TermsGate>
    </QueryClientProvider>,
  );
}

describe("TermsGate", () => {
  beforeEach(() => {
    jest.mocked(WebBrowser.openBrowserAsync).mockReset();
    mockHasAccepted.mockReset();
    mockGetCurrentTerms.mockReset();
    mockAcceptTerms.mockReset();
    mockGetCurrentTerms.mockResolvedValue({
      data: CURRENT_TERMS,
      error: null,
    });
  });

  it("renders children when terms are already accepted", async () => {
    mockHasAccepted.mockResolvedValue({ data: true, error: null });

    await renderGate();

    expect(await screen.findByTestId("gated-children")).toBeTruthy();
    expect(screen.queryByTestId("terms-gate")).toBeNull();
    expect(mockGetCurrentTerms).not.toHaveBeenCalled();
  });

  it("accepts terms and then shows children", async () => {
    let accepted = false;
    mockHasAccepted.mockImplementation(async () => ({
      data: accepted,
      error: null,
    }));
    mockAcceptTerms.mockImplementation(async () => {
      accepted = true;
      return { data: ACCEPTANCE, error: null };
    });

    const user = userEvent.setup();
    await renderGate();

    const acceptButton = await screen.findByTestId("terms-gate-accept-button");
    await waitFor(() => {
      expect(acceptButton).toBeEnabled();
    });
    await user.press(acceptButton);

    await waitFor(() => {
      expect(mockAcceptTerms).toHaveBeenCalledWith(
        CURRENT_TERMS.slug,
        CURRENT_TERMS.content_hash,
      );
    });
    expect(await screen.findByTestId("gated-children")).toBeTruthy();
    expect(screen.queryByTestId("terms-gate")).toBeNull();
  });

  it("retries the accepted query after an error and then shows children", async () => {
    mockHasAccepted
      .mockResolvedValueOnce({ data: null, error: "network down" })
      .mockResolvedValue({ data: true, error: null });

    const user = userEvent.setup();
    await renderGate();

    await user.press(await screen.findByTestId("terms-gate-retry-button"));

    expect(await screen.findByTestId("gated-children")).toBeTruthy();
    expect(screen.queryByTestId("terms-gate")).toBeNull();
  });

  it("shows an error and stays gated when accept fails", async () => {
    mockHasAccepted.mockResolvedValue({ data: false, error: null });
    mockAcceptTerms.mockResolvedValue({
      data: null,
      error: "could not record acceptance",
    });

    const user = userEvent.setup();
    await renderGate();

    const acceptButton = await screen.findByTestId("terms-gate-accept-button");
    await waitFor(() => {
      expect(acceptButton).toBeEnabled();
    });
    await user.press(acceptButton);

    expect(await screen.findByTestId("terms-gate-error")).toBeTruthy();
    expect(screen.queryByTestId("gated-children")).toBeNull();
    expect(screen.getByTestId("terms-gate")).toBeTruthy();
  });

  it("opens the current terms URL from the Read Terms link", async () => {
    mockHasAccepted.mockResolvedValue({ data: false, error: null });

    const user = userEvent.setup();
    await renderGate();

    const acceptButton = await screen.findByTestId("terms-gate-accept-button");
    await waitFor(() => {
      expect(acceptButton).toBeEnabled();
    });
    await user.press(screen.getByTestId("terms-gate-link"));

    expect(WebBrowser.openBrowserAsync).toHaveBeenCalledWith(CURRENT_TERMS.url);
  });
});
