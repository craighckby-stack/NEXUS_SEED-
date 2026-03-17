import { hash } from 'crypto';

// Shared Response Interface
interface LLMResponse {
  text?: string;
  reasoning?: string;
  confidence?: number;
}

// Realistic Response Templates
interface RealisticResponse {
  text: string;
  reasoning: string;
  confidence: number;
}

const realisticResponses: { [queryType: string]: RealisticResponse[] } = {
  general: [
    {
      text: "Based on my analysis of this topic, I can provide a comprehensive response that addresses key aspects of your query. The synthesized answer considers multiple perspectives and provides actionable insights.",
      reasoning: "I've reviewed the available information and can offer insights from multiple perspectives to ensure a balanced understanding of this topic.",
      confidence: 0.82
    },
    // More general response templates...
  ],
  technical: [
    {
      text: "From a technical standpoint, this involves understanding the underlying architecture and how components interact. I'll explain the key technical principles and their practical applications in the synthesized design.",
      reasoning: "I'll analyze technical specifications, consider design trade-offs, and explain how this relates to best practices in the field.",
      confidence: 0.89
    },
    // More technical response templates...
  ],
  analytical: [
    {
      text: "I've analyzed this from multiple angles and can provide a nuanced perspective that considers complexities and potential ambiguities in the question.",
      reasoning: "My analysis takes into account the different dimensions of the topic, acknowledging where definitive answers might not be available. The synthesized result provides thoughtful consideration.",
      confidence: 0.76
    },
    // More analytical response templates...
  ],
  creative: [
    {
      text: "This is a creative challenge that invites multiple approaches. I'll brainstorm several different perspectives, highlighting the unique insights each offers. The synthesized outcome explores innovative solutions.",
      reasoning: "I'll approach this with an open mind, exploring conventional and unconventional ideas alike, and finding innovative connections between them. The synthesized result is creative and diverse.",
      confidence: 0.71
    },
    // More creative response templates...
  ],
  factual: [
    {
      text: "Based on established information, I can provide accurate details about this topic. I'll be precise and include relevant context to ensure completeness. The synthesized response is factually accurate.",
      reasoning: "I'm drawing on verified information from reliable sources, ensuring accuracy while also providing necessary background for full understanding.",
      confidence: 0.92
    },
    // More factual response templates...
  ]
};

// Determine Query Type
function determineQueryType(prompt: string): string {
  const lowerPrompt = prompt.toLowerCase();

  if (lowerPrompt.includes('how') || lowerPrompt.includes('explain') || lowerPrompt.includes('what')) {
    if (lowerPrompt.includes('technical') || lowerPrompt.includes('system') || lowerPrompt.includes('architecture')) {
      return 'technical';
    }
    return 'general';
  }

  if (lowerPrompt.includes('analyze') || lowerPrompt.includes('evaluate') || lowerPrompt.includes('compare')) {
    return 'analytical';
  }

  if (lowerPrompt.includes('create') || lowerPrompt.includes('imagine') || lowerPrompt.includes('brainstorm')) {
    return 'creative';
  }

  if (lowerPrompt.includes('fact') || lowerPrompt.includes('accurate') || lowerPrompt.includes('confirm') || lowerPrompt.includes('documented')) {
    return 'factual';
  }

  return 'general';
}

// Mock ZAI SDK
class MockZAI {
  static async create(): Promise<MockZAI> {
    return new MockZAI();
  }

  private async callLLM(prompt: string): Promise<LLMResponse> {
    const queryType = determineQueryType(prompt);
    const responses = realisticResponses[queryType];

    const hash = hash('sha256').update(prompt).digest('hex');
    const responseIndex = parseInt(hash.slice(0, 8), 16) % responses.length;
    const response = responses[responseIndex];

    return {
      text: response.text,
      reasoning: response.reasoning,
      confidence: response.confidence
    };
  }

  get chat() {
    return {
      completions: {
        create: async (params: any) => {
          const prompt = params.messages?.[params.messages.length - 1]?.content || '';

          const response = await this.callLLM(prompt);

          return {
            choices: [
              {
                message: {
                  role: 'assistant',
                  content: response.text || ''
                }
              }
            ]
          } as any;
        }
      }
    };
  }
}

export default MockZAI;
```

**