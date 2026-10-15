import { fileURLToPath } from "node:url";
import { mergeConfig } from "vite";
import base from "../../vite.config.ts";

export default mergeConfig(base, {
  build: {
    rollupOptions: {
      input: {
        documentation: fileURLToPath(
          new URL("../../index.html", import.meta.url),
        ),
        landing: fileURLToPath(new URL("../../landing.html", import.meta.url)),
      },
    },
  },
});
