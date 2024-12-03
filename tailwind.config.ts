import type { Config } from "tailwindcss";

export default {
  darkMode: "class",
  content: ["./app/**/{**,.client,.server}/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          '"Inter"',
          "ui-sans-serif",
          "system-ui",
          "sans-serif",
          '"Apple Color Emoji"',
          '"Segoe UI Emoji"',
          '"Segoe UI Symbol"',
          '"Noto Color Emoji"',
        ],
      },
      
      colors: {
        darkBackground: "#1a1a1a",
        lightBackground: "#f3f4f6",
        primary: {
          light: "#f87171", 
          dark: "#fca5a5", 
        },
      },
    },
  },

  plugins: [],
} satisfies Config;