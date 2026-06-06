import eslintReact from "@eslint-react/eslint-plugin";
import js from "@eslint/js";
import tseslint from "@typescript-eslint/eslint-plugin";
import tsParser from "@typescript-eslint/parser";
import importPlugin from "eslint-plugin-import-x";
import reactHooks from "eslint-plugin-react-hooks";
import globals from "globals";

/**
 * Vercel react-best-practices — rules enforced via ESLint beyond @eslint-react presets.
 * @see https://github.com/vercel-labs/agent-skills/tree/main/skills/react-best-practices
 */
const reactBestPractices = {
  // bundle-barrel-imports: prefer subpath imports; Next optimizePackageImports covers build-time
  "no-restricted-imports": [
    "warn",
    {
      paths: [
        {
          name: "react-icons",
          message: "Import from subpaths (e.g. react-icons/fi) per bundle-barrel-imports best practice.",
        },
        {
          name: "lodash",
          message: "Import from lodash/<module> per bundle-barrel-imports best practice.",
        },
        {
          name: "date-fns",
          message: "Import from date-fns/<module> per bundle-barrel-imports best practice.",
        },
      ],
    },
  ],
};

/** Prefer eslint-plugin-react-hooks over overlapping @eslint-react hook rules. */
const eslintReactHooksDelegated = {
  "@eslint-react/exhaustive-deps": "off",
  "@eslint-react/purity": "off",
  "@eslint-react/rules-of-hooks": "off",
  "@eslint-react/set-state-in-effect": "off",
  "@eslint-react/set-state-in-render": "off",
  "@eslint-react/use-memo": "off",
};

/**
 * React 19 API migration hints — valid but out of scope for perf-focused lint gates.
 * Re-enable when refactoring forwardRef / Context.Provider usage.
 */
const eslintReactStyleDeferred = {
  "@eslint-react/no-forward-ref": "off",
  "@eslint-react/no-use-context": "off",
  "@eslint-react/no-context-provider": "off",
};

export default [
  { ignores: [".next/", "node_modules/", "dist/", "*.config.*"] },
  js.configs.recommended,
  eslintReact.configs["recommended-typescript"],
  {
    files: ["src/**/*.{js,jsx,ts,tsx}", "app/**/*.{js,jsx,ts,tsx}"],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaFeatures: { jsx: true },
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
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
      ...eslintReactHooksDelegated,
      ...eslintReactStyleDeferred,
      ...reactBestPractices,
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
