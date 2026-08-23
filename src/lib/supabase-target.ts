export type SupabaseTarget = "local" | "preview" | "production";

export const PREVIEW_STORAGE_KEY = "entao.supabase.env";
export const PREVIEW_STORAGE_VALUE = "preview";
export const PREVIEW_TRIGGER_EMAIL = "alice@example.com";

export function resolveSupabaseTarget(opts: {
  useLocal: boolean;
  persistedPreview: boolean;
  previewConfigured: boolean;
}): SupabaseTarget {
  if (opts.useLocal) {
    return "local";
  }
  if (opts.persistedPreview && opts.previewConfigured) {
    return "preview";
  }
  return "production";
}

export function isPreviewTriggerEmail(email: string): boolean {
  return email.trim().toLowerCase() === PREVIEW_TRIGGER_EMAIL;
}

export function canOfferPreview(opts: {
  useLocal: boolean;
  currentTarget: SupabaseTarget;
  previewConfigured: boolean;
}): boolean {
  return (
    !opts.useLocal &&
    opts.currentTarget === "production" &&
    opts.previewConfigured
  );
}
