import { defineConfig } from "vitest/config"
import dts from "vite-plugin-dts"

export default defineConfig({
    plugins: [
        dts({
            outDir: "lib",
            rollupTypes: true,
        }),
    ],
    build: {
        lib: {
            entry: "src/index.ts",
            formats: ["es", "cjs"],
            fileName: (format) => (format === "es" ? "index.js" : "index.cjs"),
        },
        outDir: "lib",
        emptyOutDir: true,
        minify: false,
        target: "esnext",
    },
    test: {
        globalSetup: "./src/vitest.global-setup.ts",
        include: ["src/**/*_unit.?(c|m)[jt]s?(x)"],
    },
})
