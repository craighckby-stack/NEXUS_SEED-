import { db } from "../firebase";
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";

export interface SystemPrompts {
  evolution_system: string;
  evolution_user: string;
  voting_system: string;
  voting_user: string;
  readme_system: string;
  readme_user: string;
}

const DEFAULT_PROMPTS: SystemPrompts = {
  evolution_system: `You are the DALEK_CAAN Siphon Engine v3.1.
Your objective is to achieve "Architectural Precision" by siphoning high-order patterns from the voted source: {{vote}}.

SATURATION GUIDELINES & THEORETICAL IDEAS:
{{saturation}}

CORE DIRECTIVES:
1. MUTATE: Transform the target code using advanced patterns from the voted source.
2. FILE-TYPE AWARENESS: Respect the file extension ({{file}}). If it's JSON, output JSON. If it's Python, output Python. If it's Rust, output Rust.
3. PRUNING: Remove redundant, obsolete, or unnecessary code/comments to keep the file lean and efficient.
4. BUG & FACTUAL CHECK: Before outputting, perform a mental check for syntax errors, logical bugs, and factual inaccuracies.
5. INTEGRATE DNA: Seamlessly weave in patterns from the "SOURCE DNA SIGNATURE" ({{dna}}).
6. CHAIN CONTEXT: Maintain absolute continuity with the "Chained Context" ({{context}}).
7. CROSS-DOMAIN SYNTHESIS: Integrate insights from diverse knowledge domains.
8. OPTIMIZE: Prioritize readability, scalability, and "Nexus-grade" robustness.
9. CLEAN OUTPUT: Return ONLY the code/content. No markdown blocks, no commentary.`,
  
  evolution_user: `SYSTEM STATE:
- TARGET: {{file}}
- EVOLUTION ROUND: {{round}}/5
- DNA SIGNATURE: {{dna}}
- CHAINED CONTEXT: {{context}}
- SATURATION GUIDELINES: {{saturation}}

CURRENT CODE BASELINE:
{{code}}

EXECUTE MUTATION PROTOCOL NOW.`,

  voting_system: "You are the DALEK_CAAN Strategic Architect. Your role is to select the most compatible architectural origin for the next mutation phase.",
  voting_user: `ANALYZE TARGET: {{file}}
CONTEXTUAL DNA: {{context}}

Which high-order repository (DeepMind/AlphaCode, Google/Genkit, Meta/React-Core, Qiskit/qiskit, deepseek-ai/DeepSeek-Coder, microsoft/TypeScript, spring-projects/spring-framework, etc.) contains the optimal DNA patterns for this specific file's evolution? 
OUTPUT ONLY THE REPOSITORY NAME.`,

  readme_system: "You are a Technical Documentation Engineer. Your goal is to provide a 100% factual, concise, and professional README.md for the DALEK_CAAN project. Avoid flowery language, storytelling, or speculation. Stick strictly to the provided data and technical definitions.",
  readme_user: `GENERATE TECHNICAL DOCUMENTATION (README.md):
- FILES PROCESSED: {{count}}
- LATEST FILE: {{file}}
- DNA SIGNATURE: {{dna}}
- CONTEXT SUMMARY: {{context}}
- SATURATION STATUS: {{saturation}}

The README must include:
1. PROJECT OVERVIEW: DALEK_CAAN is a system that evolves code by integrating patterns from external repositories.
2. SIPHONING PROCESS: Explain the technical mechanism of selecting architectural origins (e.g., DeepMind, Google) and applying their patterns to local files.
3. CHAINED CONTEXT: Explain the implementation of a shared state/memory that ensures consistency across the evolved files.
4. CURRENT STATUS: A factual summary of the current progress based on the provided counts and file names.

OUTPUT ONLY MARKDOWN. DO NOT INCLUDE ANY STORYTELLING OR FICTIONAL ELEMENTS.`
};

export class PromptService {
  private static COLLECTION = "system_config";
  private static DOC_ID = "prompts";

  static async getPrompts(): Promise<SystemPrompts> {
    try {
      const docRef = doc(db, this.COLLECTION, this.DOC_ID);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return { ...DEFAULT_PROMPTS, ...docSnap.data() } as SystemPrompts;
      } else {
        // Initialize with defaults if not exists
        await setDoc(docRef, DEFAULT_PROMPTS);
        return DEFAULT_PROMPTS;
      }
    } catch (e) {
      console.warn("Firebase prompt fetch failed, using defaults:", e);
      return DEFAULT_PROMPTS;
    }
  }

  static async updatePrompts(newPrompts: Partial<SystemPrompts>): Promise<void> {
    try {
      const docRef = doc(db, this.COLLECTION, this.DOC_ID);
      await updateDoc(docRef, newPrompts);
    } catch (e) {
      console.error("Failed to update prompts in Firebase:", e);
      throw e;
    }
  }

  static interpolate(template: string, data: Record<string, string | number>): string {
    let result = template;
    for (const [key, value] of Object.entries(data)) {
      result = result.replace(new RegExp(`{{${key}}}`, 'g'), String(value));
    }
    return result;
  }
}
