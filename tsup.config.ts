import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  outDir: "./lib",
  clean: true,
  format: ["cjs", "esm"],
  dts: true,
});
