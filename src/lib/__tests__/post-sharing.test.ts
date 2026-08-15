import {
  buildPostLink,
  buildPostShareMessage,
  getPostIdFromReturnPath,
  getUsernameFromReturnPath,
  POST_LINK_ORIGIN,
  postPathFromLinkingUrl,
  rememberPostReturnPath,
  consumePostReturnPath,
  userPathFromLinkingUrl,
  validatePostReturnPath,
  validateUserReturnPath,
} from "../post-sharing";

describe("post sharing", () => {
  it("builds a canonical HTTPS link and encodes the post ID", () => {
    expect(buildPostLink("post id/1")).toBe(
      `${POST_LINK_ORIGIN}/post/post%20id%2F1`,
    );
  });

  it("builds the fixed share message without post content", () => {
    expect(buildPostShareMessage("Alice")).toBe("See Alice’s post on Então.");
  });

  it("validates and normalizes only internal post paths", () => {
    expect(validatePostReturnPath("/post/abc-123")).toBe("/post/abc-123");
    expect(validatePostReturnPath("/(app)/post/abc-123")).toBe("/post/abc-123");
    expect(getPostIdFromReturnPath("/post/abc-123")).toBe("abc-123");
    expect(validatePostReturnPath("/post/abc%20123")).toBeNull();
    expect(validatePostReturnPath("https://example.com/post/abc")).toBeNull();
    expect(
      validatePostReturnPath("/post/abc?next=https://example.com"),
    ).toBeNull();
    expect(validatePostReturnPath("/post/abc/other")).toBeNull();
    expect(validatePostReturnPath("/settings")).toBeNull();
    expect(getPostIdFromReturnPath("/post/%2E%2E")).toBeNull();
  });

  it("maps custom-scheme and https linking URLs to post return paths", () => {
    expect(postPathFromLinkingUrl("entao://post/abc-123")).toBe(
      "/post/abc-123",
    );
    expect(postPathFromLinkingUrl("entao:///post/abc-123")).toBe(
      "/post/abc-123",
    );
    expect(postPathFromLinkingUrl(`${POST_LINK_ORIGIN}/post/abc-123`)).toBe(
      "/post/abc-123",
    );
    expect(postPathFromLinkingUrl("entao://post/abc/other")).toBeNull();
  });

  it("remembers and consumes a pending post return path", () => {
    consumePostReturnPath();
    expect(rememberPostReturnPath("entao://post/abc-123")).toBe(
      "/post/abc-123",
    );
    expect(consumePostReturnPath()).toBe("/post/abc-123");
    expect(consumePostReturnPath()).toBeNull();
  });

  it("validates and normalizes only internal user paths", () => {
    expect(validateUserReturnPath("/user/bob")).toBe("/user/bob");
    expect(validateUserReturnPath("/(app)/user/bob")).toBe("/user/bob");
    expect(getUsernameFromReturnPath("/user/bob")).toBe("bob");
    expect(validateUserReturnPath("/user/alice.smith")).toBe(
      "/user/alice.smith",
    );
    expect(validateUserReturnPath("/user/abc%20123")).toBeNull();
    expect(validateUserReturnPath("https://example.com/user/bob")).toBeNull();
    expect(
      validateUserReturnPath("/user/bob?next=https://example.com"),
    ).toBeNull();
    expect(validateUserReturnPath("/user/bob/other")).toBeNull();
    expect(validateUserReturnPath("/post/abc-123")).toBeNull();
    expect(getUsernameFromReturnPath("/user/%2E%2E")).toBeNull();
  });

  it("maps custom-scheme and https linking URLs to user return paths", () => {
    expect(userPathFromLinkingUrl("entao://user/bob")).toBe("/user/bob");
    expect(userPathFromLinkingUrl("entao:///user/bob")).toBe("/user/bob");
    expect(userPathFromLinkingUrl(`${POST_LINK_ORIGIN}/user/bob`)).toBe(
      "/user/bob",
    );
    expect(userPathFromLinkingUrl("entao://user/bob/other")).toBeNull();
    expect(userPathFromLinkingUrl("entao://post/abc-123")).toBeNull();
  });

  it("remembers and consumes a pending user return path", () => {
    consumePostReturnPath();
    expect(rememberPostReturnPath("entao://user/bob")).toBe("/user/bob");
    expect(consumePostReturnPath()).toBe("/user/bob");
    expect(consumePostReturnPath()).toBeNull();
  });
});
