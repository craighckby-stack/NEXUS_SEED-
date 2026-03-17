// src/app/api/evolution/generate/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import ZAI from 'z-ai-web-dev-sdk';

// Define constants for system prompt and user prompt
const SYSTEM_PROMPT = `You are a software architect designing the next evolution of a fullstack application.
Your task is to analyze the current state and suggest the next logical feature to implement.
Return your response as a JSON object with the following structure:
{
  "id": "feature-unique-id",
  "name": "Feature Name (concise)",
  "description": "Brief description of what this feature does",
  "dependencies": ["existing-feature-id-or-empty-array"]
}

Rules:
1. Suggest features that build upon existing completed features
2. Dependencies should reference the externalId of existing features
3. Keep names concise but descriptive
4. Only suggest features that are technically feasible`;

// Define a function to generate user prompt
const generateUserPrompt = (currentCycle: string, placeholders: any[]) => {
  const completedFeatures = placeholders.filter((p) => p.completed);
  const existingFeatures = placeholders.map((p) => `- ${p.externalId}: ${p.name} (${p.completed ? 'completed' : 'pending'})`).join('\n');
  const completedFeatureIds = completedFeatures.map((p) => p.externalId).join(', ');

  return `Current evolution cycle: ${currentCycle}
Current features (completed/total): ${completedFeatures.length}/${placeholders.length}

Existing features:
${existingFeatures}

Completed features:
${completedFeatureIds}

Suggest the next feature to implement. Return only a JSON object.`;
};

// Define a function to parse JSON response from LLM
const parseJsonResponse = (response: string) => {
  try {
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    } else {
      return JSON.parse(response);
    }
  } catch (e) {
    console.error('Failed to parse LLM response:', response);
    // Fallback to a default feature
    return {
      id: `feature-${Date.now()}`,
      name: 'Advanced Search & Data Filtering',
      description: 'Implement advanced search with filtering capabilities',
      dependencies: ['crud-feature']
    };
  }
};

// Define a function to generate next feature using LLM
const generateNextFeature = async (zai: any, systemPrompt: string, userPrompt: string) => {
  const completion = await zai.chat.completions.create({
    messages: [
      {
        role: 'assistant',
        content: systemPrompt
      },
      {
        role: 'user',
        content: userPrompt
      }
    ],
    thinking: { type: 'disabled' }
  });

  const response = completion.choices[0]?.message?.content;

  if (!response) {
    throw new Error('No response from LLM');
  }

  return parseJsonResponse(response);
};

// Define the main function to handle POST request
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { currentCycle } = body;

    // Get current placeholders for context
    const placeholders = await db.placeholder.findMany({
      orderBy: { createdAt: 'asc' }
    });

    // Get config for Gemini API key
    const config = await db.systemConfig.findFirst();

    if (!config || !config.geminiApiKey) {
      return NextResponse.json(
        { error: 'Gemini API Key not configured' },
        { status: 400 }
      );
    }

    // Create system prompt for feature generation
    const userPrompt = generateUserPrompt(currentCycle, placeholders);

    // Use LLM to generate next feature
    const zai = await ZAI.create();

    const nextFeature = await generateNextFeature(zai, SYSTEM_PROMPT, userPrompt);

    return NextResponse.json(nextFeature);
  } catch (error) {
    console.error('Error generating next feature:', error);

    // Return a fallback feature
    return NextResponse.json({
      id: `feature-${Date.now()}`,
      name: 'Advanced Search & Data Filtering',
      description: 'Implement advanced search with filtering capabilities',
      dependencies: ['crud-feature']
    });
  }
}