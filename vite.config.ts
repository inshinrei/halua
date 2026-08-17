import { defineConfig } from "vitest/config"
import dts from "vite-plugin-dts"
import fs from "node:fs"
import path from "node:path"

const copyShippedDocsPlugin = {
    name: "copy-shipped-docs",
    closeBundle() {
        let agentsSrc = path.resolve("agents-for-module.md")
        let agentsDest = path.resolve("lib", "AGENTS.md")
        let migrationsSrc = path.resolve("docs", "migrations")
        let migrationsDest = path.resolve("lib", "migrations")
        try {
            fs.copyFileSync(agentsSrc, agentsDest)
            if (fs.existsSync(migrationsSrc)) {
                fs.mkdirSync(migrationsDest, { recursive: true })
                let names = fs.readdirSync(migrationsSrc)
                for (let name of names) {
                    if (name.endsWith(".md")) {
                        fs.copyFileSync(path.join(migrationsSrc, name), path.join(migrationsDest, name))
                    }
                }
            }
        } catch (err) {
            // non-fatal during non-build runs or if src missing
            if (process.env.CI) {
                console.warn("[copy-shipped-docs] Could not copy shipped docs:", err)
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
        copyShippedDocsPlugin,
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
