import { NextRequest, NextResponse } from 'next/server';
import { PlaceholderManager, PLACEHOLDER_CATALOG } from '@/system/placeholders';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action');

  try {
    switch (action) {
      case 'stats':
        return NextResponse.json(PlaceholderManager.getStats());

      case 'list':
        const category = searchParams.get('category');
        const filled = searchParams.get('filled');

        let placeholders = Object.values(PLACEHOLDER_CATALOG);

        if (category) {
          placeholders = placeholders.filter(p => p.category === category);
        }

        if (filled !== null) {
          const filledBool = filled === 'true';
          placeholders = placeholders.filter(p => p.filled === filledBool);
        }

        return NextResponse.json(placeholders);

      case 'next':
        const next = PlaceholderManager.getNextPlaceholder();
        return NextResponse.json(next);

      case 'dependencies':
        const graph = PlaceholderManager.getDependencyGraph();
        return NextResponse.json(Object.fromEntries(graph));

      default:
        return NextResponse.json(
          { error: 'Invalid action. Use: stats, list, next, dependencies' },
          { status: 400 }
        );
    }
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to process request', details: String(error) },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { action, placeholderId } = body;

  try {
    switch (action) {
      case 'mark-filled':
        if (!placeholderId) {
          return NextResponse.json(
            { error: 'placeholderId required' },
            { status: 400 }
          );
        }

        PlaceholderManager.markFilled(placeholderId);
        return NextResponse.json({ success: true, placeholderId, filled: true });

      case 'mark-unfilled':
        if (!placeholderId) {
          return NextResponse.json(
            { error: 'placeholderId required' },
            { status: 400 }
          );
        }

        PlaceholderManager.markUnfilled(placeholderId);
        return NextResponse.json({ success: true, placeholderId, filled: false });

      default:
        return NextResponse.json(
          { error: 'Invalid action. Use: mark-filled, mark-unfilled' },
          { status: 400 }
        );
    }
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to process request', details: String(error) },
      { status: 500 }
    );
  }
}
