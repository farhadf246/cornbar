import { defineConfig } from "tsup";

const shared = {
  format: ["esm", "cjs"] as const,
  dts: true,
  splitting: false,
  sourcemap: false,
  minify: true,
  treeshake: true,
  target: "es2020" as const,
  external: ["react"]
};

export default defineConfig([
  {
    ...shared,
    entry: {
      index: "src/index.ts"
    },
    clean: true
  },
  {
    ...shared,
    entry: {
      react: "src/react.ts"
    },
    clean: false,
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
    minify: true,
    sourcemap: false,
    clean: false
  }
]);
