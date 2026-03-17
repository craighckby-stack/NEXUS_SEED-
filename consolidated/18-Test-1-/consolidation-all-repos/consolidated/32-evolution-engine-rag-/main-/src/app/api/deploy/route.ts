// src/app/api/deploy/route.ts

import { NextRequest, NextResponse } from 'next/server';

// Define a type for the API response
interface ApiResponse {
  success: boolean;
  repoUrl?: string;
  messages?: string[];
  error?: string;
  canDeploy?: boolean;
  message?: string;
  instructions?: string[];
}

// Define a function to handle API errors
function handleApiError(error: any): ApiResponse {
  console.error('API error:', error);
  return {
    error: error.message || 'Internal server error',
  };
}

// Define a function to validate the request body
function validateRequestBody(body: any): boolean {
  return !!body.repoName;
}

// Define a function to generate the deployment instructions
function generateDeploymentInstructions(): string[] {
  return [
    '1. git init',
    '2. git add -A',
    '3. git commit -m "Initial deployment by Craig Huckerby"',
    '4. git remote add origin https://github.com/YOUR_USERNAME/evolution-engine-rag.git',
    '5. git branch -M main',
    '6. git push -u origin main',
  ];
}

// Define the POST endpoint
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json();

    if (!validateRequestBody(body)) {
      return NextResponse.json(
        { error: 'Repository name is required' },
        { status: 400 }
      );
    }

    const results: ApiResponse = {
      success: false,
      repoUrl: body.repoName,
      messages: ['Deployment API endpoint - Use git commands directly for deployment'],
    };

    return NextResponse.json(results);
  } catch (error: any) {
    const errorResponse = handleApiError(error);
    return NextResponse.json(errorResponse, { status: 500 });
  }
}

// Define the GET endpoint
export async function GET(): Promise<NextResponse> {
  const response: ApiResponse = {
    canDeploy: false,
    message: 'Use git commands for deployment. See DEPLOYMENT.md for instructions.',
    instructions: generateDeploymentInstructions(),
  };

  return NextResponse.json(response);
}