import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx,js,jsx}",
    "./src/**/*.{ts,tsx,js,jsx}",
    "./components/**/*.{ts,tsx,js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          primary: "#0A66FF",
          secondary: "#FF3B30",
          accent: "#FFB800",
          green: "#34A853",
        },
      },
      borderRadius: {
        xl: "1rem",
        "2xl": "1.25rem",
      },
      boxShadow: {
        soft: "0 8px 20px rgba(0,0,0,0.08)",
      },
    },
  },
  plugins: [],
};
export default config;
