// src/app/api/evolution/placeholders/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// Define a type for the request body
type UpdatePlaceholderBody = {
  completed: boolean;
};

// Define a type for the API error response
type ApiError = {
  error: string;
};

// Define a function to handle API errors
const handleApiError = (error: unknown, status: number): NextResponse => {
  console.error('API Error:', error);
  return NextResponse.json({ error: 'Internal Server Error' }, { status });
};

// Define a function to update a placeholder
const updatePlaceholder = async (id: string, body: UpdatePlaceholderBody) => {
  try {
    const updatedPlaceholder = await db.placeholder.update({
      where: { id },
      data: body,
    });
    return updatedPlaceholder;
  } catch (error) {
    throw error;
  }
};

// Define a function to delete a placeholder
const deletePlaceholder = async (id: string) => {
  try {
    await db.placeholder.delete({
      where: { id },
    });
  } catch (error) {
    throw error;
  }
};

// Define the PATCH route
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body: UpdatePlaceholderBody = await request.json();
    const updatedPlaceholder = await updatePlaceholder(id, body);
    return NextResponse.json(updatedPlaceholder);
  } catch (error) {
    return handleApiError(error, 500);
  }
}

// Define the DELETE route
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    await deletePlaceholder(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error, 500);
  }
}