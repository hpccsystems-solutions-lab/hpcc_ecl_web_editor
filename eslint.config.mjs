import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    rules: {
      // Downgrade to warnings or disable problematic rules
      "prefer-const": "warn", // Treat as warning instead of error
      "@typescript-eslint/no-explicit-any": "off", // Disable 'any' type check
      "@typescript-eslint/no-unused-vars": "warn", // Treat unused vars as warning
    },
  },
];

export default eslintConfig;
