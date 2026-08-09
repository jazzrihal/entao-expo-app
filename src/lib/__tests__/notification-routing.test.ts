import { getNotificationHref } from "../notification-routing";

describe("getNotificationHref", () => {
  it("returns a safe relative data.url string", () => {
    expect(getNotificationHref({ url: "/(app)/(tabs)/friends/list" })).toBe(
      "/(app)/(tabs)/friends/list",
    );
  });

  it("trims whitespace around url", () => {
    expect(getNotificationHref({ url: "  /post/abc  " })).toBe("/post/abc");
  });

  it("rejects absolute and protocol-relative urls", () => {
    expect(getNotificationHref({ url: "https://evil.example/post/1" })).toBeNull();
    expect(getNotificationHref({ url: "//evil.example/post/1" })).toBeNull();
    expect(getNotificationHref({ url: "http://evil.example/" })).toBeNull();
  });

  it("maps post_id to /post/{id}", () => {
    expect(
      getNotificationHref({ type: "post_liked", post_id: "abc-123", actor_id: "u1" }),
    ).toBe("/post/abc-123");
    expect(getNotificationHref({ post_id: "  abc-123  " })).toBe("/post/abc-123");
  });

  it("maps friend_request to /friends/list even when actor_id is present", () => {
    expect(
      getNotificationHref({
        type: "friend_request",
        friendship_request_id: "req-1",
        actor_id: "requester-1",
      }),
    ).toBe("/friends/list");
  });

  it("maps friend_request_accepted actor_id to the actor profile", () => {
    expect(
      getNotificationHref(
        {
          type: "friend_request_accepted",
          friendship_request_id: "req-1",
          actor_id: "accepter-1",
        },
        { sessionUserId: "me" },
      ),
    ).toBe("/user/accepter-1");
  });

  it("maps actor_id matching session user to own profile", () => {
    expect(
      getNotificationHref(
        { type: "friend_request_accepted", actor_id: "me" },
        { sessionUserId: "me" },
      ),
    ).toBe("/(app)/(tabs)/profile");
  });

  it("falls back to actor profile when post_id is absent", () => {
    expect(
      getNotificationHref(
        { type: "friend_badge_awarded", actor_id: "friend-1" },
        { sessionUserId: "me" },
      ),
    ).toBe("/user/friend-1");
  });

  it("maps friendship_request_id to /friends/list when type and actor are absent", () => {
    expect(getNotificationHref({ friendship_request_id: "req-1" })).toBe(
      "/friends/list",
    );
  });

  it("prefers url over entity ids when url is safe", () => {
    expect(
      getNotificationHref({
        url: "/custom",
        post_id: "abc",
        friendship_request_id: "req-1",
        actor_id: "u1",
      }),
    ).toBe("/custom");
  });

  it("falls through to post_id when url is unsafe", () => {
    expect(
      getNotificationHref({
        url: "https://evil.example/",
        post_id: "abc",
      }),
    ).toBe("/post/abc");
  });

  it("prefers post_id over actor_id and friendship_request_id", () => {
    expect(
      getNotificationHref({
        type: "post_liked",
        post_id: "abc",
        actor_id: "u1",
        friendship_request_id: "req-1",
      }),
    ).toBe("/post/abc");
  });

  it("returns null when no usable fields are present", () => {
    expect(getNotificationHref({})).toBeNull();
    expect(getNotificationHref({ type: "badge_awarded" })).toBeNull();
    expect(getNotificationHref({ post_id: "" })).toBeNull();
    expect(getNotificationHref({ post_id: "   " })).toBeNull();
    expect(getNotificationHref({ friendship_request_id: "" })).toBeNull();
    expect(getNotificationHref({ actor_id: "" })).toBeNull();
    expect(getNotificationHref({ post_id: 123 })).toBeNull();
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
