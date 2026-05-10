import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
  // Root-level rule overrides for non-DOM renderers / known-safe patterns.
  {
    files: ["lib/pdf/InvoicePdfDocument.tsx"],
    rules: {
      // React-PDF's <Image> isn't a DOM <img>, so alt-text doesn't apply.
      "jsx-a11y/alt-text": "off",
    },
  },
  {
    files: ["components/invoice/InvoiceForm.tsx"],
    rules: {
      // React Hook Form's watch() triggers this React Compiler lint rule; safe to ignore here.
      "react-hooks/incompatible-library": "off",
    },
  },
  {
    files: ["components/bills/BillsListClient.tsx"],
    rules: {
      // Initial data load pattern; acceptable for this simple list view.
      "react-hooks/set-state-in-effect": "off",
    },
  },
]);

export default eslintConfig;
