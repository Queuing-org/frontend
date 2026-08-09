import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
  {
    files: ["src/shared/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            "@/src/features/**",
            "@/src/features",
            "@/src/app/**",
            "@/src/app",
            "**/features/**",
            "**/features",
            "**/app/**",
            "**/app",
          ],
        },
      ],
    },
  },
  {
    files: ["src/features/room/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            "@/src/features/home/**",
            "@/src/features/home",
            "**/home/**",
            "**/home",
          ],
        },
      ],
    },
  },
]);

export default eslintConfig;
