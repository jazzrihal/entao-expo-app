function firstNonEmpty(
  ...values: Array<string | null | undefined>
): string {
  for (const value of values) {
    const trimmed = value?.trim();
    if (trimmed) {
      return trimmed;
    }
  }

  return "";
}

export function resolveDisplayName(person: {
  display_name?: string | null;
  username?: string | null;
  id?: string | null;
}): string {
  return firstNonEmpty(person.display_name, person.username, person.id);
}

export const DISPLAY_NAME_FULL_SIZE_MAX_CHARS = 16;
export const DISPLAY_NAME_MEDIUM_SIZE_MAX_CHARS = 22;
export const DISPLAY_NAME_MEDIUM_SIZE_SCALE = 0.85;
export const DISPLAY_NAME_COMPACT_SIZE_SCALE = 0.72;

export function displayNameFontSize(
  length: number,
  baseFontSize: number,
): number {
  if (length <= DISPLAY_NAME_FULL_SIZE_MAX_CHARS) {
    return baseFontSize;
  }
  if (length <= DISPLAY_NAME_MEDIUM_SIZE_MAX_CHARS) {
    return Math.round(baseFontSize * DISPLAY_NAME_MEDIUM_SIZE_SCALE);
  }
  return Math.round(baseFontSize * DISPLAY_NAME_COMPACT_SIZE_SCALE);
}

export function truncateDisplayName(name: string, maxChars: number): string {
  if (name.length <= maxChars) {
    return name;
  }
  return `${name.slice(0, maxChars - 1)}…`;
}
