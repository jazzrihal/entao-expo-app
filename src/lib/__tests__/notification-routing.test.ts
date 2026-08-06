import { getNotificationHref } from "../notification-routing";

describe("getNotificationHref", () => {
  it("returns a non-empty data.url string", () => {
    expect(getNotificationHref({ url: "/(app)/(tabs)/friends/list" })).toBe(
      "/(app)/(tabs)/friends/list",
    );
  });

  it("trims whitespace around url", () => {
    expect(getNotificationHref({ url: "  /post/abc  " })).toBe("/post/abc");
  });

  it("returns null when url is missing", () => {
    expect(getNotificationHref({})).toBeNull();
    expect(getNotificationHref({ post_id: "x" })).toBeNull();
  });

  it("returns null when url is empty or whitespace", () => {
    expect(getNotificationHref({ url: "" })).toBeNull();
    expect(getNotificationHref({ url: "   " })).toBeNull();
  });

  it("returns null when url is not a string", () => {
    expect(getNotificationHref({ url: 123 })).toBeNull();
    expect(getNotificationHref({ url: null })).toBeNull();
    expect(getNotificationHref({ url: { path: "/x" } })).toBeNull();
  });

  it("returns null for non-object data", () => {
    expect(getNotificationHref(null)).toBeNull();
    expect(getNotificationHref(undefined)).toBeNull();
    expect(getNotificationHref("/(app)/post/1")).toBeNull();
  });
});
