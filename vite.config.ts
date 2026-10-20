import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vitest/config";
export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    // :dir() needs Chrome and Edge 120; below that, Lightning CSS rewrites it
    // to :lang(), which follows the page language instead of its direction.
    // The other floors are Vite's baseline.
    cssTarget: ["chrome120", "edge120", "firefox114", "safari16.4", "ios16.4"],
  },
  test: {
    environment: "jsdom",
    setupFiles: ["./src/tests/setup.ts"],
    include: ["src/**/*.test.{ts,tsx}"],
  },
});
