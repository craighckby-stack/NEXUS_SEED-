# Enhancement Guide

## Overview

This guide explains how to integrate the placeholder system into your project.

## What is the Placeholder System?

The placeholder system is a strategic approach to evolving your codebase. Instead of randomly mutating files, the AI identifies gaps (placeholders) and fills them in priority order.

## Key Components

### 1. Placeholder System (`src/system/placeholders.ts`)

Defines strategic features to build:
- **Placeholders**: Feature gaps that need to be filled
- **Priority Levels**: CRITICAL, HIGH, MEDIUM, LOW, RESEARCH
- **Dependencies**: Some placeholders require others to be filled first
- **Categories**: AI infrastructure, communication, security, optimization, etc.

### 2. Evolution Enhancer (`src/system/evolution-enhancer.ts`)

Wrapper that decides what to evolve:
- **RANDOM Mode**: Same behavior as before (random file mutation)
- **STRATEGIC Mode**: Only fills placeholders
- **HYBRID Mode**: Mix of random and strategic (configurable)

### 3. Knowledge Base Sync (`src/scripts/sync-knowledge-base.ts`)

Pulls code patterns from GitHub repos:
- **DAILY**: High-priority repos (LangChain, Vercel AI, Anthropic)
- **WEEKLY**: Medium-priority repos (AutoGPT, Next.js, Zustand)
- **MONTHLY**: Low-priority repos (TypeScript, Prettier, etc.)

## Integration Steps

### Step 1: Add Imports

```typescript
import { EvolutionEnhancer } from '@/system/evolution-enhancer';
import { PlaceholderManager } from '@/system/placeholders';
```

### Step 2: Create Enhancer

```typescript
// Start with RANDOM mode (no change to existing behavior)
const enhancer = new EvolutionEnhancer({ mode: 'RANDOM' });

// Later, switch to HYBRID for gradual rollout
const enhancer = new EvolutionEnhancer({
  mode: 'HYBRID',
  strategicWeight: 0.7 // 70% strategic, 30% random
});
```

### Step 3: Wrap Your Mutation Logic

```typescript
const decision = enhancer.selectEvolutionTarget();

if (decision.type === 'PLACEHOLDER' && decision.placeholder) {
  // Strategic path - fill a placeholder
  const placeholder = decision.placeholder;

  // Query knowledge base for context
  const knowledgeResponse = await fetch('/api/knowledge', {
    method: 'POST',
    body: JSON.stringify({
      query: `${placeholder.category} ${placeholder.tags.join(' ')}`,
      limit: 5
    })
  });

  const knowledgeData = await knowledgeResponse.json();
  const knowledgeContext = knowledgeData.results
    .map((r: any) => `File: ${r.file}\nCode: ${r.code}`)
    .join('\n\n---\n\n');

  // Build placeholder-specific prompt
  const prompt = enhancer.buildPlaceholderPrompt(placeholder, knowledgeContext);

  // Generate code
  const evolved = await callGemini(prompt);

  // CREATE new file (not mutate existing)
  await createNewFile(placeholder.file, evolved);

  // Mark as filled
  PlaceholderManager.markFilled(placeholder.id);

} else {
  // Random path - your existing mutation logic (unchanged)
  const files = treeData.tree.filter(...);
  const target = files[Math.floor(Math.random() * files.length)];
  // ... continue with existing code ...
}
```

## Rollout Strategy

### Week 1: RANDOM Mode
- Add all files
- Test that nothing broke
- System behaves exactly as before

### Week 2: HYBRID 10%
- Switch to `strategicWeight: 0.1`
- Monitor for issues
- First placeholders fill

### Week 3: HYBRID 50%
- Increase to `strategicWeight: 0.5`
- More placeholders fill
- System becomes strategic

### Week 4+: STRATEGIC Mode
- Switch to `mode: 'STRATEGIC'`
- System fills placeholders exclusively
- Falls back to random if no placeholders available

## API Routes

### Placeholder Management

```typescript
// Get stats
GET /api/system/placeholders?action=stats

// List placeholders
GET /api/system/placeholders?action=list&category=ai-infrastructure&filled=false

// Get next placeholder
GET /api/system/placeholders?action=next

// Mark as filled
POST /api/system/placeholders
Body: { action: 'mark-filled', placeholderId: '...' }

// Mark as unfilled (rollback)
POST /api/system/placeholders
Body: { action: 'mark-unfilled', placeholderId: '...' }
```

### Knowledge Sync

```typescript
POST /api/system/sync-knowledge
Body: {
  syncType: 'FULL' | 'DAILY' | 'WEEKLY' | 'MONTHLY',
  githubToken: '...',
  knowledgeBaseUrl: '/api/knowledge'
}
```

## UI Component

Include `PlaceholderDashboard` in your page to visualize progress:

```typescript
import { PlaceholderDashboard } from '@/components/PlaceholderDashboard';

// Add to your JSX
<PlaceholderDashboard />
```

## Safety

### Rollback

```typescript
// Quick: Change mode
const enhancer = new EvolutionEnhancer({ mode: 'RANDOM' });

// Mark placeholder as unfilled
await fetch('/api/system/placeholders', {
  method: 'POST',
  body: JSON.stringify({
    action: 'mark-unfilled',
    placeholderId: '...'
  })
});
```

### Error Handling

The system includes error handling utilities:

```typescript
import {
  safeAsync,
  validateRequired,
  formatError,
  retryWithBackoff
} from '@/lib/error-handler';
```

## Next Steps

1. ✅ All files created
2. ⏳ Test API routes
3. ⏳ Sync knowledge base
4. ⏳ Integrate enhancer into evolution cycle
5. ⏳ Test in RANDOM mode
6. ⏳ Gradual rollout to HYBRID
7. ⏳ Move to STRATEGIC mode

Good luck! 🚀
