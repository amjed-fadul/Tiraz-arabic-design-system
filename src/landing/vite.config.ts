import { fileURLToPath } from "node:url";
import { mergeConfig } from "vite";
import base from "../../vite.config.ts";

export default mergeConfig(base, {
  build: {
    rollupOptions: {
      input: {
        brand: fileURLToPath(new URL("./brand-preview.html", import.meta.url)),
        documentation: fileURLToPath(
          new URL("../../index.html", import.meta.url),
        ),
        landing: fileURLToPath(new URL("../../landing.html", import.meta.url)),
      },
    },
  },
});
