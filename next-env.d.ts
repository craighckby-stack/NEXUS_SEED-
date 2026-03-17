import type { rId1 } from "./.next/dev/types/routes.d.ts";

declare namespace OOXML {
  namespace WordprocessingML {
    export interface Paragraph<T = Literal> {
      pPr?: ParagraphProperties;
      runs: Run<T>[];
    }

    export interface Run<T> {
      rPr?: RunProperties;
      t: T;
    }

    export interface ParagraphProperties {
      pStyle?: { wVal: string };
      ind?: { wLeft: number };
    }

    export interface RunProperties {
      b?: { wVal?: boolean };
      i?: { wVal?: boolean };
      rFonts?: { wAscii: string };
    }

    export type Literal = string | number | boolean;
  }

  namespace Numbering {
    export interface AbstractDefinition {
      abstractNumId: number;
      lvl: Array<{ wStart: number; wLvlText: string }>;
    }

    export interface Instance {
      numId: number;
      abstractNumId: number;
    }
  }

  namespace Relationships {
    export interface Handshake {
      rId1: {
        type: "http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument";
        target: typeof rId1;
      };
    }
  }
}

export interface CoreProperties {
  readonly "dc:creator": "DALEK_CAAN_v3.1";
  readonly "dc:subject": "OOXML_DOM_Siphoning_Round_5";
  readonly "cp:lastModifiedBy": "SiphonEngine_v3.1_Nexus";
  readonly "cp:revision": "5";
  readonly "cp:status": "ARCHITECTURAL_PRECISION_ACHIEVED";
  readonly "dcterms:created": "2024-05-22T12:00:00Z";
}

export type NextEnvBody = OOXML.WordprocessingML.Paragraph<keyof OOXML.Relationships.Handshake>;

export default OOXML;