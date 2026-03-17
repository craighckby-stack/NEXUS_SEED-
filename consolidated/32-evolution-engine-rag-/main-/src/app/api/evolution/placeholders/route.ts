// src/app/api/evolution/placeholders/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// Define a type for the placeholder request body
interface PlaceholderRequestBody {
  externalId: string;
  name: string;
  description: string;
  dependencies?: any[];
}

// Define a type for the error response
interface ErrorResponse {
  error: string;
}

// Define a function to handle errors
const handleError = (error: Error, status: number = 500): NextResponse => {
  console.error('Error:', error);
  return NextResponse.json({ error: 'Failed to process request' }, { status });
};

// Define a function to fetch placeholders
const fetchPlaceholders = async (): Promise<NextResponse> => {
  try {
    const placeholders = await db.placeholder.findMany({
      orderBy: { createdAt: 'asc' }
    });
    return NextResponse.json(placeholders);
  } catch (error) {
    return handleError(error);
  }
};

// Define a function to create a placeholder
const createPlaceholder = async (request: NextRequest): Promise<NextResponse> => {
  try {
    const body: PlaceholderRequestBody = await request.json();
    const { externalId, name, description, dependencies } = body;

    const placeholder = await db.placeholder.create({
      data: {
        externalId,
        name,
        description,
        dependencies: JSON.stringify(dependencies || []),
        completed: false
      }
    });

    return NextResponse.json(placeholder);
  } catch (error) {
    return handleError(error);
  }
};

// Export the route handlers
export async function GET(): Promise<NextResponse> {
  return fetchPlaceholders();
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  return createPlaceholder(request);
}