import type { Theme } from "@/context/ThemeContext";

export const COLORS = (theme: Theme) => ({
  primary: theme === "dark" ? "#E5E7EB" : "#1E1E2F",
  secondary: theme === "dark" ? "#818CF8" : "#4F46E5",
  accent: theme === "dark" ? "#4ADE80" : "#22C55E",

  background: theme === "dark" ? "#0F172A" : "#F9FAFB",
  surface: theme === "dark" ? "#020617" : "#FFFFFF",

  textPrimary: theme === "dark" ? "#F9FAFB" : "#111827",
  textSecondary: theme === "dark" ? "#94A3B8" : "#6B7280",

  border: theme === "dark" ? "#1E293B" : "#E5E7EB",

  danger: theme === "dark" ? "#F87171" : "#EF4444",
  warning: theme === "dark" ? "#FBBF24" : "#F59E0B",
});