import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./hooks/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        ink: "#04131f",
        surf: "#081f3a",
        foam: "#9be7ff",
        algae: "#7ddc8b",
        coral: "#ff8c69",
        aurora: "#5cf4d2"
      },
      boxShadow: {
        glow: "0 0 0 1px rgba(155, 231, 255, 0.14), 0 25px 70px rgba(2, 9, 20, 0.55)"
      },
      fontFamily: {
        sans: ["ui-sans-serif", "system-ui", "sans-serif"]
      }
    }
  },
  plugins: [require("tailwindcss-animate")]
};

export default config;
