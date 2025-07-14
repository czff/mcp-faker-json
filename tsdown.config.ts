import { defineConfig } from "tsdown";

export default defineConfig({
  entry: ["./src/index.ts"],
  outputOptions: {
    format: "esm",
    banner: "#!/usr/bin/env node",
  },
  minify: true,
});
