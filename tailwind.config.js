/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        crucible: {
          bg: "#1E1E1E",
          sidebar: "#252526",
          border: "#3E3E3E",
          text: "#CCCCCC",
          "text-dim": "#808080",
          accent: "var(--crucible-accent)",
          success: "#4EC9B0",
          warning: "#E5C07B",
          error: "#F44747",
          attention: "#007ACC",
        },
      },
      fontFamily: {
        mono: ['"Cascadia Code"', "Consolas", "monospace"],
      },
    },
  },
  plugins: [],
};
