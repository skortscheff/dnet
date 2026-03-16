import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        navy: {
          950: "#04080f",
          900: "#060b14",
          800: "#0a1020",
          700: "#0d1528",
        },
        surface: {
          DEFAULT: "#0f1520",
          hover: "#141c2e",
          border: "#1e2d45",
        },
        accent: {
          DEFAULT: "#0ea5e9",
          hover: "#38bdf8",
          dim: "#0369a1",
        },
        mono: {
          green: "#22c55e",
          red: "#ef4444",
          yellow: "#eab308",
          orange: "#f97316",
          purple: "#a855f7",
          cyan: "#06b6d4",
        },
      },
      fontFamily: {
        mono: ["'JetBrains Mono'", "Consolas", "Monaco", "monospace"],
        sans: ["Inter", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
export default config;
