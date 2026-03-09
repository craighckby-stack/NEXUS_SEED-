/// <reference types="next" />
/// <reference types="next/image-types/global" />

/**
 * [Content_Types].xml Manifest Implementation
 * xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"
 * xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"
 * xmlns:dc="http://purl.org/dc/elements/1.1/"
 */

import type { rId1 } from "./.next/dev/types/routes.d.ts";

/** 
 * @w:body - Package-based Modular Architecture Root
 * Siphoning Next.js Environment Logic into Modular XML Components
 */
declare namespace OOXML {
  /** 
   * @word/document.xml - Logic DNA Hierarchy
   * Atomic Unit of Next.js Type Definition Layout
   */
  namespace WordprocessingML {
    /** @w:p - Paragraph Logic: Atomic unit of type layout */
    export interface Paragraph<T = Literal> {
      pPr?: ParagraphProperties; // Local property overrides
      runs: Run<T>[];            // Run Logic: Property-State Pattern
    }

    /** @w:r - Contiguous region of text with identical properties */
    export interface Run<T> {
      rPr?: RunProperties;      // Tiered Inheritance Logic
      t: T;                     // @w:t - Literal Data Leaf
    }

    export interface ParagraphProperties {
      pStyle?: { wVal: string }; // Class-Selector Pattern (e.g., "Heading1")
      ind?: { wLeft: number };
    }

    export interface RunProperties {
      b?: { wVal?: boolean };   // State-heavy declarative XML
      i?: { wVal?: boolean };
      rFonts?: { wAscii: string };
    }

    export type Literal = string | number | boolean;
  }

  /** 
   * @word/numbering.xml - Abstract vs. Instance Logic
   * Manages sequential list-based structures in Next.js internal manifests
   */
  namespace Numbering {
    export interface AbstractDefinition {
      abstractNumId: number;    // Defines the "look"
      lvl: Array<{ wStart: number; wLvlText: string }>;
    }

    export interface Instance {
      numId: number;            // Unique Instance ID
      abstractNumId: number;    // Referential pointer to abstract definition
    }
  }

  /** @_rels/.rels - Relational Linkage Pattern */
  namespace Relationships {
    export interface Handshake {
      rId1: {
        type: "http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument";
        target: typeof rId1;    // Pointer-based navigation system
      };
    }
  }
}

/** 
 * @docProps/core.xml - Dublin Core Metadata Siphon
 * DALEK_CAAN Architectural Audit Trail
 */
export interface CoreProperties {
  readonly "dc:creator": "DALEK_CAAN_v3.1";
  readonly "dc:subject": "OOXML_DOM_Siphoning_Round_5";
  readonly "cp:lastModifiedBy": "SiphonEngine_v3.1_Nexus";
  readonly "cp:revision": "5";
  readonly "cp:status": "ARCHITECTURAL_PRECISION_ACHIEVED";
  readonly "dcterms:created": "2024-05-22T12:00:00Z";
}

/**
 * Tiered Inheritance Resolution
 * Direct Formatting (pPr/rPr) > Named Styles > docDefaults
 */
export type NextEnvBody = OOXML.WordprocessingML.Paragraph<keyof OOXML.Relationships.Handshake>;

export default OOXML;