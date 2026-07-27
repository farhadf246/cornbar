import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const directive = '"use client";';

for (const file of [
  "dist/index.js",
  "dist/index.cjs",
  "dist/react.js",
  "dist/react.cjs"
]) {
  const path = join(root, file);
  const content = readFileSync(path, "utf8");
  if (content.startsWith(directive)) {
    continue;
  }
  writeFileSync(path, `${directive}\n${content}`);
}

console.log("Stamped use client on cornbar client build outputs");
