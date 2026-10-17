import js from "@eslint/js";
import tseslint from "@typescript-eslint/eslint-plugin";
import tsParser from "@typescript-eslint/parser";
import importPlugin from "eslint-plugin-import-x";
import globals from "globals";

/**
 * Flat ESLint config for the SyncApp Express/TypeScript API.
 * import-x/order mirrors client/eslint.config.mjs (groups, pathGroups, alphabetize).
 * Node-only otherwise — no React plugins.
 */
export default [
  {
    ignores: ["node_modules/", "dist/", "coverage/", "*.config.*", "scripts/"],
  },
  js.configs.recommended,
  {
    files: ["src/**/*.{js,ts}", "api/**/*.{js,ts}"],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
      globals: {
        ...globals.node,
      },
    },
    plugins: {
      "@typescript-eslint": tseslint,
      "import-x": importPlugin,
    },
    rules: {
      ...tseslint.configs.recommended.rules,
      "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
      "@typescript-eslint/no-explicit-any": "warn",
      "no-empty": ["error", { allowEmptyCatch: true }],
      curly: ["error", "all"],
      "import-x/order": [
        "error",
        {
          groups: ["builtin", "external", "internal", "sibling", "parent", "index"],
          pathGroups: [
            {
              pattern: "{react,react-dom,react-redux,@reduxjs/toolkit}",
              group: "external",
              position: "before",
            },
            {
              pattern: "{@mui/**,@emotion/**}",
              group: "external",
              position: "after",
            },
            {
              pattern: "@constants/**",
              group: "internal",
              position: "before",
            },
            {
              pattern: "@types/**",
              group: "internal",
              position: "before",
            },
            {
              pattern: "@components/common/**",
              group: "internal",
              position: "after",
            },
          ],
          pathGroupsExcludedImportTypes: ["react"],
          "newlines-between": "always",
          alphabetize: {
            order: "asc",
            caseInsensitive: true,
          },
        },
      ],
    },
  },
];
