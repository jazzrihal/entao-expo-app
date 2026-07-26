import {
  buildPostLink,
  buildPostShareMessage,
  getPostIdFromReturnPath,
  POST_LINK_ORIGIN,
  validatePostReturnPath,
} from "../post-sharing";

describe("post sharing", () => {
  it("builds a canonical HTTPS link and encodes the post ID", () => {
    expect(buildPostLink("post id/1")).toBe(
      `${POST_LINK_ORIGIN}/post/post%20id%2F1`,
    );
  });

  it("builds the fixed share message without post content", () => {
    expect(buildPostShareMessage("Alice")).toBe("See Alice’s post on Fotuu.");
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
});
