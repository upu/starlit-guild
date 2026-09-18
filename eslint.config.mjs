import { fileURLToPath } from "node:url";

import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import sonarjs from "eslint-plugin-sonarjs";
import tseslint from "typescript-eslint";

const tsconfigRootDir = fileURLToPath(new URL(".", import.meta.url));

const commonTypeScriptRules = {
  complexity: ["error", 15],
  "max-lines": ["error", { max: 400, skipBlankLines: true, skipComments: true }],
  "sonarjs/cognitive-complexity": ["error", 10],
  "max-depth": ["error", 3],
  "max-lines-per-function": ["error", { max: 60, skipBlankLines: true, skipComments: true }],
};

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    files: ["**/*.{ts,tsx}"],
    plugins: { sonarjs },
    // Keep the YAMORU-equivalent strict rule set as the blocking quality gate.
    extends: tseslint.configs.strictTypeChecked,
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
    ".open-next/**",
    ".wrangler/**",
    ".worktrees/**",
    "work/**",
  ]),
  {
    // Files that exceeded the size limits once Prettier expanded the former
    // one-line style. The limits stay active for new files; split these as
    // tracked in issue #86 and remove entries here as they pass.
    files: [
      "app/api/backup/route.ts",
      "app/map-stage.tsx",
      "app/phaser-adventure.tsx",
      "app/phaser/adventure-game.ts",
      "app/phaser/adventure-painter.ts",
      "app/phone-game.tsx",
      "app/save-panel.tsx",
      "app/story-scenes.tsx",
      "app/use-game-music.ts",
      "app/use-local-game.ts",
      "lib/adventure-presentation.ts",
      "lib/chapter-two.ts",
      "lib/game.ts",
      "lib/journey.ts",
      "lib/prologue-stories.ts",
      "lib/stories.ts",
    ],
    rules: {
      "max-lines": "off",
      "max-lines-per-function": "off",
    },
  },
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
