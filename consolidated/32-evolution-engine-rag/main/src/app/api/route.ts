// src/app/api/route.ts
import { NextResponse } from "next/server";

/**
 * Handles GET requests to the root API endpoint.
 * 
 * @returns A JSON response with a greeting message.
 */
export async function GET(): Promise<NextResponse> {
  const responseBody = { message: "Hello, world!" };
  return NextResponse.json(responseBody, { status: 200 });
}