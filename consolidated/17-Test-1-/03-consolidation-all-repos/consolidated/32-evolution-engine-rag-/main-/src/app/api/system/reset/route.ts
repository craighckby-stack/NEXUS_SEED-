// src/app/api/system/reset/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// Define constants for collections to be deleted
const collectionsToDelete = [
  'placeholder',
  'systemLog',
  'implementationResult',
  'resource',
  'projectSpecification',
  'uploadedFile',
  'relevantRepo',
  'buildInstructions',
];

// Define constants for user and system config updates
const userUpdate = {
  data: {
    onboardingCompleted: false,
  },
};

const systemConfigUpdate = {
  data: {
    evolutionCycle: 1,
  },
};

/**
 * Resets the system by deleting project-related data, resetting user onboarding status, and resetting evolution cycle.
 * @param request - NextRequest object
 * @returns NextResponse object
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // Delete all project-related data (keep user and config)
    await Promise.all(
      collectionsToDelete.map((collection) => db[collection].deleteMany({}))
    );

    // Reset user onboarding status
    await db.user.updateMany(userUpdate);

    // Reset evolution cycle
    const config = await db.systemConfig.findFirst();
    if (config) {
      await db.systemConfig.update({
        where: { id: config.id },
        ...systemConfigUpdate,
      });
    }

    return NextResponse.json({
      success: true,
      message: 'System reset successfully. You can now start a new project.',
    });
  } catch (error: any) {
    console.error('System reset error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to reset system' },
      { status: 500 }
    );
  }
}