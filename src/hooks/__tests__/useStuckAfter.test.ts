import { act, renderHook } from "@testing-library/react-native";

import { useStuckAfter } from "../useStuckAfter";

describe("useStuckAfter", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("stays false until the timeout while loading", async () => {
    const { result } = await renderHook(() => useStuckAfter(true, 1_000));
    expect(result.current).toBe(false);

    await act(async () => {
      jest.advanceTimersByTime(999);
    });
    expect(result.current).toBe(false);

    await act(async () => {
      jest.advanceTimersByTime(1);
    });
    expect(result.current).toBe(true);
  });

  it("resets when loading ends", async () => {
    const { result, rerender } = await renderHook(
      ({ isLoading }: { isLoading: boolean }) =>
        useStuckAfter(isLoading, 1_000),
      { initialProps: { isLoading: true } },
    );

    await act(async () => {
      jest.advanceTimersByTime(1_000);
    });
    expect(result.current).toBe(true);

    await act(async () => {
      rerender({ isLoading: false });
    });
    expect(result.current).toBe(false);
  });

  it("does not stay stuck when loading starts again", async () => {
    const { result, rerender } = await renderHook(
      ({ isLoading }: { isLoading: boolean }) =>
        useStuckAfter(isLoading, 1_000),
      { initialProps: { isLoading: true } },
    );

    await act(async () => {
      jest.advanceTimersByTime(1_000);
    });
    expect(result.current).toBe(true);

    await act(async () => {
      rerender({ isLoading: false });
    });
    await act(async () => {
      rerender({ isLoading: true });
    });
    expect(result.current).toBe(false);

    await act(async () => {
      jest.advanceTimersByTime(999);
    });
    expect(result.current).toBe(false);

    await act(async () => {
      jest.advanceTimersByTime(1);
    });
    expect(result.current).toBe(true);
  });
});
