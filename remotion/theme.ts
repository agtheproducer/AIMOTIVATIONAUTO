import { loadFont as loadPlexSans } from "@remotion/google-fonts/IBMPlexSans";
import { loadFont as loadPlexMono } from "@remotion/google-fonts/IBMPlexMono";

// Matches the approved graphic chart: https://claude.ai/artifact/723qzTXpnm9WXR76TsGtZA
// "Clinical / lab-precise" -- near-black + IBM Plex, one accent reserved for
// action (CTAs, the active caption word) and never used on citations.
export const colors = {
  ink: "#0A0E12",
  surface: "#12171D",
  border: "#232B33",
  textPrimary: "#F4F6F8",
  textSecondary: "#8A97A3",
  accent: "#3E7BFA",
} as const;

const plexSans = loadPlexSans();
const plexMono = loadPlexMono();

export const fonts = {
  sans: plexSans.fontFamily,
  mono: plexMono.fontFamily,
} as const;

export const BRAND_NAME = "THE PROTOCOL";
