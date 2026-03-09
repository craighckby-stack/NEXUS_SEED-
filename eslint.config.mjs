import nextCoreWebVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";

/** 
 * [Content_Types].xml :: THE REGISTRY MANIFEST
 * Global MIME-type registration for configuration fragments.
 */
const CONTENT_TYPES = {
  main: "application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml",
  styles: "application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml",
  typescript: "application/vnd.nexus.logic.typescript+xml",
  react: "application/vnd.nexus.ui.react+xml",
  numbering: "application/vnd.openxmlformats-officedocument.wordprocessingml.numbering+xml"
};

/** 
 * word/_rels/document.xml.rels :: RELATIONAL LINKAGE PATTERN
 * Pointer-based navigation for external logic dependencies via rId mapping.
 */
const RELATIONAL_MAP = {
  rId1: { target: nextCoreWebVitals, type: CONTENT_TYPES.main },
  rId2: { target: nextTypescript, type: CONTENT_TYPES.typescript },
  rId3: { target: "ABSTRACT_NUMBERING_INSTANCES", type: CONTENT_TYPES.numbering },
  rId4: { target: "TIERED_STYLING_ENGINE", type: CONTENT_TYPES.styles }
};

/**
 * word/styles.xml :: TIERED INHERITANCE LOGIC
 * Implements CSS-like cascading using <w:basedOn> logic.
 */
const STYLESHEET = {
  /** Global Baseline Configuration */
  docDefaults: {
    "prefer-const": "off",
    "no-unused-vars": "off",
    "no-console": "warn",
    "no-debugger": "error",
    "no-empty": "off",
    "no-irregular-whitespace": "off"
  },
  /** Character Run Logic :: <w:rPr> State Logic */
  runLogic: {
    "@typescript-eslint/no-explicit-any": "off",
    "@typescript-eslint/no-unused-vars": "off",
    "@typescript-eslint/no-non-null-assertion": "off",
    "@typescript-eslint/ban-ts-comment": "off",
    "@typescript-eslint/prefer-as-const": "off",
    "@typescript-eslint/no-unused-disable-directive": "off"
  },
  /** Direct Shading Logic :: <w:shd> Contextual Overrides */
  shadingLogic: {
    "react-hooks/exhaustive-deps": "off",
    "react-hooks/purity": "off",
    "react/no-unescaped-entities": "off",
    "react/display-name": "off",
    "react/prop-types": "off",
    "react-compiler/react-compiler": "off",
    "@next/next/no-img-element": "off",
    "@next/next/no-html-link-for-pages": "off"
  }
};

/**
 * word/document.xml :: LOGICAL TOPOLOGY (DOM)
 * Hierarchical execution root <w:body> siphoning patterns from source.
 */
const eslintConfig = [
  ...RELATIONAL_MAP.rId1.target,
  ...RELATIONAL_MAP.rId2.target,

  {
    name: "NEXUS_CORE/DOM_HIERARCHY",
    files: ["**/*.ts", "**/*.tsx", "**/*.js", "**/*.jsx"],
    rules: {
      /** <w:pPr> :: Paragraph Properties (Local Overrides) */
      ...STYLESHEET.docDefaults,
      "no-case-declarations": "off",
      "no-fallthrough": "off",
      "no-mixed-spaces-and-tabs": "off",
      "no-redeclare": "off",
      "no-undef": "off",
      "no-unreachable": "off",
      "no-useless-escape": "off",

      /** <w:rPr> :: Run Properties (Character State Siphoning) */
      ...STYLESHEET.runLogic,

      /** <w:sectPr> :: Section Shading (UI Context Injection) */
      ...STYLESHEET.shadingLogic
    }
  },

  {
    /**
     * docProps/core.xml :: DUBLIN CORE METADATA AUDIT
     * Application-specific statistics and audit trails.
     */
    name: "NEXUS_CORE/METADATA_AUDIT",
    settings: {
      metadata: {
        creator: "DALEK_CAAN_V3.1",
        revision: "3",
        lastModifiedBy: "NEXUS_CORE_REPLICATOR_v10",
        state: "ARCHITECTURAL_PRECISION_STABLE",
        integrityChecksum: "0xFD4A2C",
        ooxmlVersion: "10.0.0-STABLE",
        siphonRound: "3/5"
      }
    }
  },

  {
    /**
     * word/numbering.xml :: ABSTRACT INSTANCE LOGIC
     * Manages exclusion counters and package structure mapping.
     */
    ignores: [
      "**/node_modules/**",
      "**/.next/**",
      "**/out/**",
      "**/build/**",
      "next-env.d.ts",
      "examples/**",
      "skills",
      "all-repos-backup/**",
      "mini-services/**",
      "repo-analysis/**",
      "**/.git/**"
    ]
  }
];

export default eslintConfig;