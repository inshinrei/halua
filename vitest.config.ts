import { defineConfig } from "vitest/config"

export default defineConfig({
    test: {
        globalSetup: "./src/vitest.global-setup.ts",
        include: ["src/**/*_unit.?(c|m)[jt]s?(x)"],
    },
})
