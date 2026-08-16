import {
  displayNameFontSize,
  resolveDisplayName,
  truncateDisplayName,
} from "../profile-display";

describe("resolveDisplayName", () => {
  it("prefers display name", () => {
    expect(
      resolveDisplayName({
        display_name: "Alice",
        username: "alice",
        id: "user-1",
      }),
    ).toBe("Alice");
  });

  it("falls back to username when display name is missing", () => {
    expect(
      resolveDisplayName({
        display_name: null,
        username: "alice",
        id: "user-1",
      }),
    ).toBe("alice");
  });

  it("falls back to user id when display name and username are missing", () => {
    expect(
      resolveDisplayName({
        display_name: undefined,
        username: "",
        id: "user-1",
      }),
    ).toBe("user-1");
  });

  it("skips whitespace-only values", () => {
    expect(
      resolveDisplayName({
        display_name: "   ",
        username: "\talice\n",
        id: "user-1",
      }),
    ).toBe("alice");
    expect(
      resolveDisplayName({
        display_name: "  ",
        username: "  ",
        id: "  user-1  ",
      }),
    ).toBe("user-1");
  });

  it("returns an empty string when nothing is set", () => {
    expect(resolveDisplayName({})).toBe("");
    expect(
      resolveDisplayName({
        display_name: null,
        username: null,
        id: null,
      }),
    ).toBe("");
  });
});

describe("displayNameFontSize", () => {
  it("keeps the base size for short names", () => {
    expect(displayNameFontSize(16, 17)).toBe(17);
    expect(displayNameFontSize(1, 28)).toBe(28);
  });

  it("shrinks at 17 characters", () => {
    expect(displayNameFontSize(17, 17)).toBe(14);
    expect(displayNameFontSize(17, 28)).toBe(24);
  });

  it("shrinks further at 23 characters", () => {
    expect(displayNameFontSize(23, 17)).toBe(12);
    expect(displayNameFontSize(23, 28)).toBe(20);
  });
});

describe("truncateDisplayName", () => {
  it("leaves short names unchanged", () => {
    expect(truncateDisplayName("Alice", 28)).toBe("Alice");
  });

  it("truncates a 40-character name at the given maxChars", () => {
    const name = "A".repeat(40);
    expect(truncateDisplayName(name, 28)).toBe(`${"A".repeat(27)}…`);
    expect(truncateDisplayName(name, 16)).toBe(`${"A".repeat(15)}…`);
  });

  it("keeps an empty string empty", () => {
    expect(truncateDisplayName("", 16)).toBe("");
  });
});
