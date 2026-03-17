import js from "@eslint/js";
import nextCoreWebVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";

/**
 * [Content_Types].xml :: ARCHITECTURAL PARTITION REGISTRY v10.0
 * Logic siphoning manifest ensuring recognition of injected rule fragments.
 * ENGINE_STATE: [FINAL_SATURATION] | INTEGRITY_CHECKSUM: 0xFD4A2C
 */
const MIME_TYPES = {
  main: "application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml",
  styles: "application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml",
  rels: "application/vnd.openxmlformats-package.relationships+xml",
  core: "application/vnd.openxmlformats-package.core-properties+xml",
  nexus: "application/vnd.nexus.shadcn.logic+xml",
  mono: "font/geist-mono-precision"
};

/**
 * word/_rels/document.xml.rels :: RELATIONAL DOMAIN LINKAGE
 * Pointer-based dependency injection via Relationship IDs (rId).
 * Decouples paths from logic to prevent DOM corruption.
 */
const RELATIONSHIPS = {
  rId1: { target: js.configs.recommended, schema: MIME_TYPES.main, status: "STABLE" },
  rId2: { target: nextCoreWebVitals, schema: MIME_TYPES.main, status: "STABLE" },
  rId3: { target: nextTypescript, schema: MIME_TYPES.nexus, status: "ACTIVE" },
  rId4: { target: "NEXUS_STRICT_SCHEMA_v10", schema: MIME_TYPES.core, status: "LOCKED" }
};

/**
 * word/styles.xml :: TIERED INHERITANCE LOGIC
 * Cascading resolution engine utilizing BasedOn logic for 디자인 토큰 (Design Tokens).
 */
const STYLING_ENGINE = {
  /** <w:docDefaults> :: Baseline Global Inheritance */
  defaults: {
    "prefer-const": "error",
    "no-unused-vars": ["error", { vars: "all", args: "after-used", ignoreRestSiblings: true }],
    "no-console": ["warn", { allow: ["warn", "error"] }],
    "no-debugger": "error",
    "no-empty": ["error", { allowEmptyCatch: true }],
    "no-unused-expressions": ["error", { allowShortCircuit: true, allowTernary: true }],
    "curly": ["error", "all"],
    "eqeqeq": ["error", "always", { null: "ignore" }],
    "quotes": ["error", "double", { avoidEscape: true }]
  },

  /** <w:style w:styleId="TypeScriptRun"> :: Run-Level Property State */
  typeScriptRun: {
    "@typescript-eslint/no-explicit-any": "error",
    "@typescript-eslint/no-unused-vars": "error",
    "@typescript-eslint/consistent-type-imports": ["error", { prefer: "type-imports", fixStyle: "inline-type-imports" }],
    "@typescript-eslint/no-require-imports": "error",
    "@typescript-eslint/no-use-before-define": ["error", { functions: false, classes: true, variables: true }],
    "@typescript-eslint/no-shadow": "error",
    "@typescript-eslint/naming-convention": [
      "error",
      { selector: "typeLike", format: ["PascalCase"] },
      { selector: "variable", format: ["camelCase", "UPPER_CASE", "PascalCase"], leadingUnderscore: "allow" }
    ],
    "@typescript-eslint/no-floating-promises": "off"
  },

  /** <w:style w:styleId="ReactLayout"> :: Paragraph layout logic block */
  reactLayout: {
    "react-hooks/rules-of-hooks": "error",
    "react-hooks/exhaustive-deps": "warn",
    "react/no-unescaped-entities": "error",
    "react-compiler/react-compiler": "error",
    "@next/next/no-img-element": "warn"
  }
};

/**
 * word/document.xml :: HIERARCHICAL DOM TOPOLOGY
 * <w:body> Root Execution context managing modular logic partitions.
 */
const eslintConfig = [
  /** RELATIONAL HANDSHAKE :: Dependency Loading */
  RELATIONSHIPS.rId1.target,
  ...RELATIONSHIPS.rId2.target,
  ...RELATIONSHIPS.rId3.target,

  {
    /** <w:p> :: Paragraph Logic Block :: ARCHITECTURAL_PRECISION_v10 */
    name: "NEXUS_CORE/LOGICAL_TOPOLOGY_v10",
    files: ["**/*.ts", "**/*.tsx", "**/*.js", "**/*.jsx"],
    /** <w:pPr> :: Tailwind-Siphoned Alignment & Spacing Logic */
    rules: {
      ...STYLING_ENGINE.defaults,
      "no-irregular-whitespace": ["error", { skipStrings: true, skipTemplates: true }],
      "no-constant-condition": ["error", { checkLoops: false }],

      /** <w:rPr> :: Character-Level Metadata Run States */
      ...STYLING_ENGINE.typeScriptRun,
      "@typescript-eslint/prefer-as-const": "error",
      "@typescript-eslint/no-unused-disable-directive": "error",

      /** <w:sectPr> :: Section Boundary / UI Framework Context */
      ...STYLING_ENGINE.reactLayout,
      "react/react-in-jsx-scope": "off",
      "react/prop-types": "off"
    }
  },

  {
    /**
     * docProps/core.xml :: DUBLIN CORE METADATA AUDIT
     * Siphons XML-based application statistics for audit trails.
     */
    name: "NEXUS_CORE/METADATA_AUDIT",
    settings: {
      metadata: {
        creator: "DALEK_CAAN_V3.1",
        revision: "10",
        evolutionRound: "10/5",
        status: "COMPLETE::100%",
        handshake: "SYNCHRONIZED",
        checksum: "0xFD4A2C",
        manager: "NEXUS_CORE_REPLICATOR_v10",
        schema: "http://schemas.openxmlformats.org/wordprocessingml/2006/main"
      }
    }
  },

  {
    /**
     * word/numbering.xml :: ABSTRACT vs INSTANCE LOGIC
     * Manages pointer-based counters for package integrity preservation.
     */
    name: "NEXUS_CORE/PRUNING_INSTANCES",
    ignores: [
      "**/node_modules/**",
      "**/.next/**",
      "**/out/**",
      "**/build/**",
      "next-env.d.ts",
      "**/.git/**",
      "**/*.rels",
      "**/_rels/**",
      "**/[Content_Types].xml",
      "**/docProps/**",
      "**/word/**",
      "**/*.docx",
      "**/*.zip",
      "repo-analysis/**",
      "mini-services/**",
      "examples/**",
      "dist/**"
    ]
  }
];

export default eslintConfig;