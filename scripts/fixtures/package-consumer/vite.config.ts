import { defineConfig } from "vite";

export default defineConfig({
  build: {
    // Preserve :dir(): language and direction are independent provider inputs.
    cssTarget: ["chrome120", "edge120", "firefox114", "safari16.4", "ios16.4"],
  },
});
