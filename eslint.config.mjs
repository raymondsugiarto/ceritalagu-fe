import nextPlugin from "@next/eslint-plugin-next";
import tseslint from "typescript-eslint";
import globals from "globals";

const nextRecommended = nextPlugin.configs.recommended;
const nextCoreWebVitals = nextPlugin.configs["core-web-vitals"];

export default tseslint.config(
  {
    ignores: [
      ".next/**",
      ".next-alt/**",
      "node_modules/**",
      "next-env.d.ts",
      "out/**",
      "build/**",
      "coverage/**",
    ],
  },
  ...tseslint.configs.recommended,
  {
    files: ["**/*.{ts,tsx,js,jsx,mjs}"],
    languageOptions: {
      ecmaVersion: 2024,
      sourceType: "module",
      globals: { ...globals.browser, ...globals.node },
    },
  },
  {
    plugins: {
      ...(nextRecommended.plugins ?? {}),
      ...(nextCoreWebVitals.plugins ?? {}),
    },
    rules: {
      ...(nextRecommended.rules ?? {}),
      ...(nextCoreWebVitals.rules ?? {}),
    },
  },
  {
    rules: {
      // --- TypeScript ---
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/consistent-type-imports": [
        "error",
        { prefer: "type-imports", fixStyle: "separate-type-imports" },
      ],

      // --- Styling: shadcn/ui first, then Tailwind utilities. No inline or custom CSS. ---
      "no-restricted-syntax": [
        "error",
        {
          selector: "JSXAttribute[name.name='style']",
          message: "Inline CSS is not allowed. Use a shadcn/ui component or Tailwind classes.",
        },
        {
          selector: "JSXElement[openingElement.name.name='style']",
          message: "<style> blocks are not allowed. Use a shadcn/ui component or Tailwind classes.",
        },
      ],
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["*.css", "*.scss", "*.sass", "*.less", "!./globals.css"],
              message: "Custom CSS is not allowed. Tokens live in src/app/globals.css only.",
            },
          ],
        },
      ],

      // --- General ---
      "no-console": ["warn", { allow: ["warn", "error"] }],
      eqeqeq: ["error", "always"],
    },
  },
  {
    files: ["**/*.test.{ts,tsx}"],
    rules: { "@typescript-eslint/no-explicit-any": "off" },
  },
);
