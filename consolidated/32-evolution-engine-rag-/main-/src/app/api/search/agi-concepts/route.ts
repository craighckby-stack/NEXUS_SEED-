// src/app/api/search/agi-concepts/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { createZaiClient } from './zai-client';
import { generateDefaultAGIConcepts } from './default-concepts';
import { parseResponseContent } from './response-parser';

const AGI_CONCEPTS_QUERY = 'artificial general intelligence AGI concepts';
const GEMINI_API_KEY_ERROR = 'Gemini API key not configured';

interface AGIConcept {
  title: string;
  snippet: string;
  relevanceScore: number;
}

async function getGeminiApiKey(): Promise<string | null> {
  const config = await db.systemConfig.findFirst();
  return config?.geminiApiKey || null;
}

async function searchAGIConcepts(query: string): Promise<AGIConcept[]> {
  const zai = await createZaiClient();
  const completion = await zai.chat.completions.create({
    messages: [
      {
        role: 'assistant',
        content: `You are an AI researcher specializing in Artificial General Intelligence (AGI) and advanced AI systems. Your task is to generate a comprehensive list of AGI concepts, architectures, and research areas.`,
      },
      {
        role: 'user',
        content: `Based on the query "${query}", generate a list of important AGI concepts and research areas. For each concept, provide:
1. Name of the concept
2. Brief description (1-2 sentences)
3. Key papers or researchers (if known)
4. Relevance score (0-1)

Format as a JSON array. Include at least 15-20 concepts covering:
- Consciousness and self-awareness
- Reasoning and inference
- Memory systems
- Learning algorithms
- Neural architectures
- Quantum computing applications
- AGI safety and ethics
- Current state-of-the-art approaches`,
      },
    ],
    thinking: { type: 'disabled' },
  });

  const responseContent = completion.choices[0]?.message?.content || '[]';
  return parseResponseContent(responseContent);
}

async function logSearch(query: string, results: AGIConcept[]): Promise<void> {
  await db.systemLog.create({
    data: {
      message: `🔍 Searched AGI concepts. Found ${results.length} concepts.`,
      type: 'info',
      timestamp: new Date(),
    },
  });
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json();
    const query = body.query || AGI_CONCEPTS_QUERY;

    const geminiApiKey = await getGeminiApiKey();
    if (!geminiApiKey) {
      return NextResponse.json({ error: GEMINI_API_KEY_ERROR }, { status: 400 });
    }

    const results = await searchAGIConcepts(query);
    await logSearch(query, results);

    return NextResponse.json({
      results,
      total: results.length,
      query,
    });
  } catch (error: any) {
    console.error('AGI concepts search error:', error);
    const fallback = generateDefaultAGIConcepts();
    return NextResponse.json({
      results: fallback,
      total: fallback.length,
      query: AGI_CONCEPTS_QUERY,
    });
  }
}

// src/app/api/search/agi-concepts/zai-client.ts
import { create } from 'z-ai-web-dev-sdk';

export async function createZaiClient(): Promise<any> {
  return await create();
}

// src/app/api/search/agi-concepts/default-concepts.ts
export function generateDefaultAGIConcepts(): AGIConcept[] {
  return [
    {
      title: 'Consciousness and Self-Awareness',
      snippet: 'Theoretical frameworks for machine consciousness, Global Workspace Theory, Integrated Information Theory',
      relevanceScore: 0.95,
    },
    // ...
  ];
}

// src/app/api/search/agi-concepts/response-parser.ts
export function parseResponseContent(responseContent: string): AGIConcept[] {
  try {
    const jsonMatch = responseContent.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    } else {
      return JSON.parse(responseContent);
    }
  } catch (e) {
    console.error('Failed to parse AGI concepts:', responseContent);
    return generateDefaultAGIConcepts();
  }
}