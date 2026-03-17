import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const baseDirectory = dirname(fileURLToPath(import.meta.url));

const eslintConfig = new FlatCompat({
  baseDirectory,
  extends: ["plugin:next/recommended", "plugin:typescript/recommended"],
  rules: {
    "no-explicit-any": "off",
    "no-unused-vars": "off",
    "no-non-null-assertion": "off",
    "ban-ts-comment": "off",
    "prefer-as-const": "off",
    "react-hooks/exhaustive-deps": "off",
    "react/no-unescaped-entities": "off",
    "react/display-name": "off",
    "react/prop-types": "off",
    "no-img-element": "off",
    "no-html-link-for-pages": "off",
    "prefer-const": "off",
  },
});

eslintConfig.addDefaultRules({
  "no-empty": "off",
  "no-irregular-whitespace": "off",
  "no-case-declarations": "off",
  "no-fallthrough": "off",
  "no-mixed-spaces-and-tabs": "off",
  "no-redeclare": "off",
  "no-undef": "off",
  "no-unreachable": "off",
  "no-useless-escape": "off",
});

export default eslintConfig;