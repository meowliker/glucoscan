export const COLORS = {
  primary: "#0B6E72",
  primaryLight: "#11B5BD",
  accent: "#F4A543",
  background: "#F8FAFB",
  surface: "#FFFFFF",
  border: "#E5E7EB",
  textPrimary: "#1A1A2E",
  textSecondary: "#6B7280",
  textMuted: "#9CA3AF",
  textOnPrimary: "#FFFFFF",
  success: "#43A047",
  warning: "#F4A543",
  error: "#E53935",
  successBg: "#F0FFF4",
  warningBg: "#FFFBEB",
  errorBg: "#FFF5F5",
} as const;

export const IMPACT_COLORS = {
  low: COLORS.success,
  moderate: COLORS.warning,
  high: COLORS.error,
} as const;

export const IMPACT_BG_COLORS = {
  low: COLORS.successBg,
  moderate: COLORS.warningBg,
  high: COLORS.errorBg,
} as const;
