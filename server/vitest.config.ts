import path from "path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@server": path.resolve(__dirname, "src"),
      "@common": path.resolve(__dirname, "../common"),
    },
  },
  test: {
    root: ".",
    include: ["test/**/*.test.ts"],
    env: {
      LOG_LEVEL: "silent",
      DOTENV_CONFIG_QUIET: "true",
    },
  },
});
