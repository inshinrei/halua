import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["./index.ts"],
  outDir: "./lib",
  clean: true,
  format: ["cjs", "esm"],
  dts: true,
});
