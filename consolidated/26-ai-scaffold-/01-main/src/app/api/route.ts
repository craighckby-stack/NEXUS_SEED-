// src/app/api/route.ts
import { NextRequest, NextResponse } from "next/server";

/**
 * API Endpoint: GET /
 * Description: Returns a simple JSON response.
 */
export async function GET(request: NextRequest) {
  return NextResponse.json({ message: "Hello, world!" }, {
    headers: {
      "Content-Type": "application/json",
    },
  });
}