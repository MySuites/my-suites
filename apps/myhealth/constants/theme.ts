/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import { Platform } from "react-native";

export const Colors = {
  light: {
    primary: "#FF6D00", // Solar Orange
    primaryMuted: "#FFF7ED", // Orange 50 (approx for muted)
    accent: "#F43F5E", // Neon Rose
    bgLight: "#FFFFFF", // Pure White (Card)
    bg: "#F8FAFC", // Cloud White (App Background)
    bgDark: "#F1F5F9", // Vapor Grey (Hover)
    text: "#0F172A", // Ink Black
    textMuted: "#64748B", // Cool Grey
    icon: "#0F172A",
    tabIconDefault: "#94A3B8",
    tabIconSelected: "#FF6D00",
    error: "#EF4444",
    placeholder: "#94A3B8",
    highlight: "rgba(0, 0, 0, 0.05)",
    // Custom Brand Colors
    solar: "#FF6D00",
    neon: "#F43F5E",
    electric: "#6366F1",
    mystic: "#A855F7",
    success: "#10B981",
    warning: "#EAB308",
    dark: false,
    border: "#E2E8F0",
  },
  dark: {
    primary: "#FF6D00", // Solar Orange
    primaryMuted: "#431407", // Dark Orange/Brown for muted
    accent: "#F43F5E", // Neon Rose
    bgLight: "#1E293B", // Lighter Slate (Card)
    bg: "#0F172A", // Deep Space (App Background)
    bgDark: "#020617", // Darker background for contrast if needed
    bgElevated: "#334155", // Soft Steel (Elevated)
    text: "#F8FAFC", // Bright White
    textMuted: "#94A3B8", // Muted Grey
    icon: "#F8FAFC",
    tabIconDefault: "#94A3B8",
    tabIconSelected: "#FF6D00",
    error: "#EF4444",
    placeholder: "#475569",
    highlight: "rgba(255, 255, 255, 0.1)",
    // Custom Brand Colors
    solar: "#FF6D00",
    neon: "#F43F5E",
    electric: "#6366F1",
    mystic: "#A855F7",
    success: "#10B981",
    warning: "#EAB308",
    dark: true,
    border: "#334155",
  },
};

export const Fonts = Platform.select({
  ios: {
    sans: "system-ui",
    serif: "ui-serif",
    rounded: "ui-rounded",
    mono: "ui-monospace",
  },
  default: {
    sans: "normal",
    serif: "serif",
    rounded: "normal",
    mono: "monospace",
  },
  web: {
    sans:
      "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded:
      "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono:
      "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
