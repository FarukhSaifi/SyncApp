import js from "@eslint/js";
import tseslint from "@typescript-eslint/eslint-plugin";
import tsParser from "@typescript-eslint/parser";
import importPlugin from "eslint-plugin-import-x";
import reactHooks from "eslint-plugin-react-hooks";
import globals from "globals";

export default [
  { ignores: [".next/", "node_modules/", "dist/", "*.config.*"] },
  js.configs.recommended,
  {
    files: ["src/**/*.{js,jsx,ts,tsx}", "app/**/*.{js,jsx,ts,tsx}"],
    languageOptions: {
      parser: tsParser,
      parserOptions: { ecmaFeatures: { jsx: true } },
      globals: {
        ...globals.browser,
        ...globals.node,
        React: "readonly",
        JSX: "readonly",
      },
    },
    plugins: {
      "@typescript-eslint": tseslint,
      "react-hooks": reactHooks,
      "import-x": importPlugin,
    },
    rules: {
      ...tseslint.configs.recommended.rules,
      ...reactHooks.configs.recommended.rules,
      "react-hooks/set-state-in-effect": "off",
      "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
      "@typescript-eslint/no-explicit-any": "warn",
      "no-empty": ["error", { allowEmptyCatch: true }],
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
