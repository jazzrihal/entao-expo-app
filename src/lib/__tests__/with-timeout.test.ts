import { withTimeout } from "../with-timeout";

describe("withTimeout", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("resolves when the promise finishes first", async () => {
    const result = withTimeout(Promise.resolve("ok"), 1_000);
    await expect(result).resolves.toBe("ok");
  });

  it("rejects when the timer wins", async () => {
    const result = withTimeout(new Promise<string>(() => {}), 1_000);
    const assertion = expect(result).rejects.toThrow("Timed out");
    jest.advanceTimersByTime(1_000);
    await assertion;
  });
});
