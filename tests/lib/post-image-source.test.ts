import {
  diskCachePolicyForSource,
  postImageSource,
} from "@/lib/post-image-source";

describe("postImageSource", () => {
  it("keys remote photos by storage path so a new signed URL hits the same cache", () => {
    expect(
      postImageSource(
        "https://example.test/object?token=one",
        "user/photo.jpg",
      ),
    ).toEqual({
      uri: "https://example.test/object?token=one",
      cacheKey: "user/photo.jpg",
    });
  });

  it("leaves local files unkeyed", () => {
    expect(
      postImageSource("file:///documents/local-posts/a.jpg", "user/photo.jpg"),
    ).toEqual({ uri: "file:///documents/local-posts/a.jpg" });
    expect(postImageSource("file:///documents/local-posts/a.jpg", "")).toEqual({
      uri: "file:///documents/local-posts/a.jpg",
    });
  });

  it("returns undefined when there is no uri", () => {
    expect(postImageSource(undefined, "user/photo.jpg")).toBeUndefined();
    expect(postImageSource(null, "user/photo.jpg")).toBeUndefined();
  });
});

describe("diskCachePolicyForSource", () => {
  it("uses memory and disk only when a cache key is set", () => {
    expect(
      diskCachePolicyForSource({
        uri: "https://example.test/object",
        cacheKey: "user/photo.jpg",
      }),
    ).toBe("memory-disk");
    expect(
      diskCachePolicyForSource({ uri: "file:///documents/a.jpg" }),
    ).toBeUndefined();
    expect(
      diskCachePolicyForSource("https://example.test/object"),
    ).toBeUndefined();
    expect(diskCachePolicyForSource(undefined)).toBeUndefined();
  });
});
