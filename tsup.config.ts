import { defineConfig } from "tsup";

export default defineConfig([
  {
    entry: {
      index: "src/index.ts"
    },
    format: ["esm", "cjs"],
    dts: true,
    splitting: false,
    sourcemap: true,
    clean: true,
    external: ["react"],
    esbuildOptions(options) {
      options.banner = {
        js: '"use client";'
      };
    }
  },
  {
    entry: {
      styles: "src/styles.css"
    },
    format: ["esm"],
    dts: false,
    splitting: false,
    clean: false
  }
]);
