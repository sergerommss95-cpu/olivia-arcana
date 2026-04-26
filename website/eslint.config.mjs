import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Ignore build artifacts, caches, and public assets
  globalIgnores([
    ".next/**",
    ".netlify/**",
    "out/**",
    "build/**",
    "node_modules/**",
    "public/**",
    "next-env.d.ts",
    "*.mjs",
    "*.js"
  ]),
]);

export default eslintConfig;
