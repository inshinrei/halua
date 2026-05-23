import { defineConfig } from "vitest/config"
import dts from "vite-plugin-dts"
import fs from "node:fs"
import path from "node:path"

const copyModuleAgentsPlugin = {
    name: "copy-module-agents",
    closeBundle() {
        const src = path.resolve("agents-for-module.md")
        const dest = path.resolve("lib", "AGENTS.md")
        try {
            fs.copyFileSync(src, dest)
        } catch (err) {
            // non-fatal during non-build runs or if src missing
            if (process.env.CI) {
                console.warn("[copy-module-agents] Could not copy agents-for-module.md:", err)
            }
        }
    },
}

export default defineConfig({
    plugins: [
        dts({
            outDir: "lib",
            bundleTypes: true,
            entryRoot: "src",
            tsconfigPath: "./tsconfig.json",
        }),
        copyModuleAgentsPlugin,
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
        globalSetup: "./src/vitest-global-setup.ts",
        include: ["src/**/*-unit.?(c|m)[jt]s?(x)"],
    },
})
