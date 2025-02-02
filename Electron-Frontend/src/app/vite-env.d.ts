import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: "./",
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@/ui": path.resolve(__dirname, "./src/app"),
      "@/components": path.resolve(__dirname, "./src/components"),
    },
  },
});
