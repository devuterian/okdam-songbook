import js from "@eslint/js";
import tseslint from "@typescript-eslint/eslint-plugin";
import tsParser from "@typescript-eslint/parser";
import reactHooks from "eslint-plugin-react-hooks";

export default [
  js.configs.recommended,
  {
    ignores: ["node_modules/**", "dist/**", "coverage/**", "work/**", "outputs/**", "apps/web/dist/**"]
  },
  {
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module"
      },
      globals: {
        document: "readonly",
        window: "readonly",
        navigator: "readonly",
        localStorage: "readonly",
        crypto: "readonly",
        Response: "readonly",
        fetch: "readonly",
        HTMLElement: "readonly",
        HTMLDivElement: "readonly",
        KeyboardEvent: "readonly",
        CustomEvent: "readonly"
      }
    },
    plugins: {
      "@typescript-eslint": tseslint,
      "react-hooks": reactHooks
    },
    rules: {
      ...tseslint.configs.recommended.rules,
      ...reactHooks.configs.recommended.rules,
      "no-unused-vars": "off",
      "@typescript-eslint/no-unused-vars": ["error", { "argsIgnorePattern": "^_" }]
    }
  }
];
