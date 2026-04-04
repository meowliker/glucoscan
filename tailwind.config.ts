import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#0B6E72",
          light: "#11B5BD",
        },
        secondary: "#11B5BD",
        accent: "#F4A543",
        background: "#F8FAFB",
        surface: "#FFFFFF",
        border: "#E5E7EB",
        text: {
          primary: "#1A1A2E",
          secondary: "#6B7280",
          muted: "#9CA3AF",
          onPrimary: "#FFFFFF",
        },
        status: {
          success: "#43A047",
          warning: "#F4A543",
          error: "#E53935",
          successBg: "#F0FFF4",
          warningBg: "#FFFBEB",
          errorBg: "#FFF5F5",
        },
        impact: {
          low: "#43A047",
          moderate: "#F4A543",
          high: "#E53935",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      fontSize: {
        h1: ["32px", { lineHeight: "1.2", fontWeight: "700" }],
        h2: ["24px", { lineHeight: "1.3", fontWeight: "700" }],
        h3: ["20px", { lineHeight: "1.4", fontWeight: "600" }],
        "body-lg": ["16px", { lineHeight: "1.5", fontWeight: "400" }],
        "body-sm": ["14px", { lineHeight: "1.5", fontWeight: "400" }],
        caption: ["12px", { lineHeight: "1.4", fontWeight: "400" }],
        label: ["12px", { lineHeight: "1.4", fontWeight: "600" }],
      },
      borderRadius: {
        card: "12px",
        button: "8px",
        badge: "999px",
      },
      boxShadow: {
        sm: "0 1px 3px rgba(0,0,0,0.08)",
        card: "0 2px 8px rgba(0,0,0,0.06)",
      },
    },
  },
  plugins: [],
};
export default config;
