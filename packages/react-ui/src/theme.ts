export interface BookingTheme {
  /** Primary interactive color. Default: "#000000" */
  accent?: string;
  /** Border radius in px. Default: 8 */
  radius?: number;
  /** Font family. Default: system font stack */
  fontFamily?: string;
  /** Color mode. Default: "light" */
  mode?: "light" | "dark" | "auto";
}

export const defaultTheme: Required<BookingTheme> = {
  accent: "#000000",
  radius: 8,
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  mode: "light",
};

/** Convert theme to CSS custom properties. */
export function themeToCssVars(
  theme: BookingTheme = {},
): Record<string, string> {
  const merged = { ...defaultTheme, ...theme };
  const isDark = merged.mode === "dark";
  return {
    "--openings-accent": merged.accent,
    "--openings-radius": `${merged.radius}px`,
    "--openings-font": merged.fontFamily,
    "--openings-bg": isDark ? "#1a1a1a" : "#ffffff",
    "--openings-text": isDark ? "#f5f5f5" : "#111111",
    "--openings-border": isDark ? "#333333" : "#e5e5e5",
    "--openings-muted": isDark ? "#999999" : "#666666",
    "--openings-surface": isDark ? "#222222" : "#f5f5f5",
    "--openings-hover": isDark ? "#2a2a2a" : "#fafafa",
  };
}
