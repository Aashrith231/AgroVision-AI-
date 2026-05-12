import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./pages/**/*.{js,ts,jsx,tsx}", "./components/**/*.{js,ts,jsx,tsx}", "./hooks/**/*.{js,ts}"],
  theme: {
    extend: {
      colors: {
        leaf: {
          50: "#f0fdf4",
          100: "#dcfce7",
          500: "#22c55e",
          600: "#16a34a",
          700: "#15803d",
          900: "#14532d"
        },
        soil: "#7c4a2d",
        sunlight: "#f7b733"
      },
      boxShadow: {
        soft: "0 20px 60px rgba(20, 83, 45, 0.12)"
      }
    }
  },
  plugins: [require("@tailwindcss/forms")]
};

export default config;
