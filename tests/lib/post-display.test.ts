import {
  formatCapturedAtAgo,
  formatCapturedAtDigital,
} from "@/lib/post-display";

describe("formatCapturedAtDigital", () => {
  it("formats a local date and time as a camera stamp", () => {
    expect(formatCapturedAtDigital(new Date(2026, 9, 3, 10, 10))).toBe(
      "03.10.2026    10:10",
    );
  });
});

describe("formatCapturedAtAgo", () => {
  const now = new Date(2026, 9, 3, 12, 0, 0);

  it("uses a strict distance with a suffix", () => {
    expect(formatCapturedAtAgo(new Date(2026, 9, 3, 10, 0, 0), now)).toBe(
      "2 hours ago",
    );
    expect(formatCapturedAtAgo(new Date(2026, 8, 30, 12, 0, 0), now)).toBe(
      "3 days ago",
    );
  });

  it("says just now when the capture is under a minute old", () => {
    expect(formatCapturedAtAgo(new Date(now.getTime() - 30_000), now)).toBe(
      "Just now",
    );
  });
});
