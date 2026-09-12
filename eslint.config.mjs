import { fileURLToPath } from "node:url";

import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import sonarjs from "eslint-plugin-sonarjs";
import tseslint from "typescript-eslint";

const tsconfigRootDir = fileURLToPath(new URL(".", import.meta.url));

const warnOnly = (configs) =>
  configs.map((config) => ({
    ...config,
    ...(config.rules
      ? {
          rules: Object.fromEntries(
            Object.entries(config.rules).map(([name, setting]) => {
              if (setting === "off" || setting === 0) return [name, setting];
              if (Array.isArray(setting) && (setting[0] === "off" || setting[0] === 0)) {
                return [name, setting];
              }
              return [name, Array.isArray(setting) ? ["warn", ...setting.slice(1)] : "warn"];
            }),
          ),
        }
      : {}),
  }));

const commonTypeScriptRules = {
  complexity: ["warn", 15],
  "max-lines": ["warn", { max: 400, skipBlankLines: true, skipComments: true }],
  "sonarjs/cognitive-complexity": ["warn", 10],
  "max-depth": ["warn", 3],
  "max-lines-per-function": [
    "warn",
    { max: 60, skipBlankLines: true, skipComments: true },
  ],
};

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    files: ["**/*.{ts,tsx}"],
    plugins: { sonarjs },
    // Keep the YAMORU rule set visible without blocking delivery while the
    // existing warnings are paid down. Promote these severities after zero.
    extends: warnOnly(tseslint.configs.strictTypeChecked),
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir,
      },
    },
    rules: commonTypeScriptRules,
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    "coverage/**",
    "dist/**",
    "examples/**",
    ".open-next/**",
    ".wrangler/**",
    ".worktrees/**",
  ]),
  {
    files: ["components/ui/**/*.{ts,tsx}", "hooks/use-mobile.ts"],
    extends: [tseslint.configs.disableTypeChecked],
    rules: {
      // These files are vendored verbatim from shadcn@4.17.0. Keep the
      // registry source intact while applying the stricter rules to Site code.
      "@typescript-eslint/no-unused-vars": "off",
      complexity: "off",
      "max-depth": "off",
      "max-lines": "off",
      "max-lines-per-function": "off",
      "react-hooks/purity": "off",
      "react-hooks/set-state-in-effect": "off",
      "sonarjs/cognitive-complexity": "off",
    },
  },
]);

export default eslintConfig;
