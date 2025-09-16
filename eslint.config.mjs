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
    ignores: [
      "node_modules/**",
      ".next/**",
      "out/**",
      "build/**",
      "next-env.d.ts",
    ],
  },
  {
    rules: {
      // Suppress warnings for unused variables
      "@typescript-eslint/no-unused-vars": "off",
      // Suppress warnings for unused imports
      "no-unused-vars": "off",
      // Suppress React hooks exhaustive deps warnings
      "react-hooks/exhaustive-deps": "off",
      // Suppress Next.js image optimization warnings
      "@next/next/no-img-element": "off",
    },
  },
];

export default eslintConfig;
