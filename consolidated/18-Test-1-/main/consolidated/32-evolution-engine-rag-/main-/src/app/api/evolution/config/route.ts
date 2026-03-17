// src/app/api/evolution/config/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// Define a type for the system configuration
interface SystemConfig {
  githubToken: string;
  geminiApiKey: string;
  githubRepo: string;
  evolutionCycle: number;
}

// Define a type for the API response
interface ApiResponse {
  githubToken: string;
  geminiApiKey: string;
  githubRepo: string;
  evolutionCycle: number;
}

// Define a type for the API error response
interface ApiErrorResponse {
  error: string;
}

// Define a type for the API request body
interface ApiRequestBody {
  githubToken: string;
  geminiApiKey: string;
  githubRepo: string;
}

// Define a function to get the system configuration
async function getSystemConfig(): Promise<SystemConfig> {
  let config = await db.systemConfig.findFirst();
  if (!config) {
    config = await db.systemConfig.create({
      data: {
        evolutionCycle: 4
      }
    });
  }
  return config;
}

// Define a function to update the system configuration
async function updateSystemConfig(config: SystemConfig, data: Partial<ApiRequestBody>): Promise<SystemConfig> {
  return await db.systemConfig.update({
    where: { id: config.id },
    data: {
      githubToken: data.githubToken || config.githubToken,
      geminiApiKey: data.geminiApiKey || config.geminiApiKey,
      githubRepo: data.githubRepo || config.githubRepo
    }
  });
}

// Define a function to create the system configuration
async function createSystemConfig(data: ApiRequestBody): Promise<SystemConfig> {
  return await db.systemConfig.create({
    data: {
      ...data,
      evolutionCycle: 4
    }
  });
}

// Define a function to handle API errors
function handleApiError(error: unknown): ApiErrorResponse {
  console.error('Error:', error);
  return { error: 'Failed to process request' };
}

// Define the GET API endpoint
export async function GET(): Promise<NextResponse> {
  try {
    const config = await getSystemConfig();
    const response: ApiResponse = {
      githubToken: config.githubToken,
      geminiApiKey: config.geminiApiKey,
      githubRepo: config.githubRepo,
      evolutionCycle: config.evolutionCycle
    };
    return NextResponse.json(response);
  } catch (error) {
    return NextResponse.json(handleApiError(error), { status: 500 });
  }
}

// Define the POST API endpoint
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body: ApiRequestBody = await request.json();
    let config = await db.systemConfig.findFirst();
    if (!config) {
      config = await createSystemConfig(body);
    } else {
      config = await updateSystemConfig(config, body);
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(handleApiError(error), { status: 500 });
  }
}