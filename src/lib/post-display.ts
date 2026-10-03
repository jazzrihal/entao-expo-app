import { format, formatDistanceStrict } from "date-fns";

export type PostLocationParts = {
  address?: string | null;
  city?: string | null;
  region?: string | null;
  country?: string | null;
};

export function formatCapturedAt(value: string | Date): string {
  return new Date(value).toLocaleString();
}

/** Camera-style local stamp, e.g. `03.10.2026    10:10`. */
export function formatCapturedAtDigital(value: string | Date): string {
  return format(new Date(value), "dd.MM.yyyy    HH:mm");
}

/** Relative stamp under the location, e.g. `2 hours ago`. */
export function formatCapturedAtAgo(
  value: string | Date,
  now = new Date(),
): string {
  const date = new Date(value);
  if (Math.abs(now.getTime() - date.getTime()) < 60_000) {
    return "Just now";
  }
  return formatDistanceStrict(date, now, { addSuffix: true });
}

export function buildLocationLine(parts: PostLocationParts): string {
  return [parts.address, parts.city, parts.region, parts.country]
    .filter(Boolean)
    .join(", ");
}
