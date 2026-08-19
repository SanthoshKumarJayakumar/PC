import js from "@eslint/js";
import reactHooks from "eslint-plugin-react-hooks";

export default [
  js.configs.recommended,
  {
    files: ["src/**/*.{js,jsx}"],
    plugins: { "react-hooks": reactHooks },
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "module",
      parserOptions: { ecmaFeatures: { jsx: true } },
      globals: { document: "readonly", window: "readonly", navigator: "readonly" },
    },
    rules: { "no-unused-vars": ["warn", { argsIgnorePattern: "^_" }] },
  },
];
