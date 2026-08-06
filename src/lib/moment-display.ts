import { format } from "date-fns";

export function formatMomentDate(iso: string): string {
  return format(new Date(iso), "EEE do MMM yyyy");
}

export function formatMomentTime(iso: string): string {
  return format(new Date(iso), "p");
}

export function formatMomentLocation(parts: {
  address?: string | null;
  city?: string | null;
  region?: string | null;
  country?: string | null;
}): string {
  const line = [parts.address, parts.city, parts.region, parts.country]
    .filter((value) => value?.trim())
    .join(", ");

  return line || "Selected location";
}
