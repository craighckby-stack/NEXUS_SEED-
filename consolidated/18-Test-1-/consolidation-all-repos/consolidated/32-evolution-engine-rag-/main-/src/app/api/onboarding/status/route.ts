// src/app/api/onboarding/status/route.ts
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

/**
 * Retrieves the onboarding status and user information if onboarding is completed.
 * 
 * @returns {Promise<NextResponse>} A JSON response containing the onboarding status and user information.
 */
export async function GET(): Promise<NextResponse> {
  try {
    // Check if any user exists with completed onboarding
    const completedUser = await db.user.findFirst({
      where: { onboardingCompleted: true },
      select: {
        id: true,
        name: true,
        email: true,
        githubUsername: true,
        experienceLevel: true
      }
    });

    return NextResponse.json({
      onboardingCompleted: !!completedUser,
      user: completedUser
    });
  } catch (error) {
    console.error('Error checking onboarding status:', error);
    return NextResponse.json({ onboardingCompleted: false, user: null }, { status: 500 });
  }
}