import type { ColorSchemeName } from "react-native";

export type ThemeName = "light" | "dark";

export function resolveColorScheme(scheme: ColorSchemeName): ThemeName {
  return scheme === "dark" ? "dark" : "light";
}

/** App base (photo-first) background — also used for image/grid backdrops. */
export const BASE_BACKGROUND = {
  light: "#FFFFFF",
  dark: "#000000",
} as const;

/** Bars/headers/footers sitting above the base background. */
export const ELEVATED_BACKGROUND = {
  light: "#F2F2F7",
  dark: "#1C1C1E",
} as const;

export const SEPARATOR_COLOR = {
  light: "#C6C6C8",
  dark: "#38383A",
} as const;

export const SECONDARY_LABEL = {
  light: "#6C6C70",
  dark: "#8E8E93",
} as const;

/** Error banner surface (auth forms and similar). */
export const ERROR_BACKGROUND = {
  light: "#FEE2E2",
  dark: "#3F1D1D",
} as const;

export const ERROR_TEXT = {
  light: "#DC2626",
  dark: "#FCA5A5",
} as const;

/** Date/location/meta text on base or elevated surfaces. */
export const META_TEXT_COLOR = {
  light: "#8E8E93",
  dark: "#C7C7CC",
} as const;

export const BADGE_BACKGROUND = {
  light: "#F2F2F7",
  dark: "#3A3A3C",
} as const;

export const BADGE_TEXT_COLOR = {
  light: "#3A3A3C",
  dark: "#F2F2F7",
} as const;
