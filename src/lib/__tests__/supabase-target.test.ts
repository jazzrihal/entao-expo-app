import {
  canOfferPreview,
  isPreviewTriggerEmail,
  resolveSupabaseTarget,
} from "../supabase-target";

describe("resolveSupabaseTarget", () => {
  it("local wins over persisted preview", () => {
    expect(
      resolveSupabaseTarget({
        useLocal: true,
        persistedPreview: true,
        previewConfigured: true,
      }),
    ).toBe("local");
  });

  it("falls back to production when preview keys are missing", () => {
    expect(
      resolveSupabaseTarget({
        useLocal: false,
        persistedPreview: true,
        previewConfigured: false,
      }),
    ).toBe("production");
  });

  it("uses preview when persisted and configured", () => {
    expect(
      resolveSupabaseTarget({
        useLocal: false,
        persistedPreview: true,
        previewConfigured: true,
      }),
    ).toBe("preview");
  });

  it("defaults to production", () => {
    expect(
      resolveSupabaseTarget({
        useLocal: false,
        persistedPreview: false,
        previewConfigured: true,
      }),
    ).toBe("production");
  });
});

describe("canOfferPreview", () => {
  it("offers only on production with keys", () => {
    expect(
      canOfferPreview({
        useLocal: false,
        currentTarget: "production",
        previewConfigured: true,
      }),
    ).toBe(true);
  });

  it("does not offer in local, on preview, or without keys", () => {
    expect(
      canOfferPreview({
        useLocal: true,
        currentTarget: "local",
        previewConfigured: true,
      }),
    ).toBe(false);
    expect(
      canOfferPreview({
        useLocal: false,
        currentTarget: "preview",
        previewConfigured: true,
      }),
    ).toBe(false);
    expect(
      canOfferPreview({
        useLocal: false,
        currentTarget: "production",
        previewConfigured: false,
      }),
    ).toBe(false);
  });
});

describe("isPreviewTriggerEmail", () => {
  it("trims and compares case-insensitively", () => {
    expect(isPreviewTriggerEmail("  Alice@Example.com ")).toBe(true);
    expect(isPreviewTriggerEmail("bob@example.com")).toBe(false);
  });
});
