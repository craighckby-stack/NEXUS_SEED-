// src/app/api/onboarding/complete/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { validateOnboardingRequest } from './validation';
import { createGitHubRepository } from './github';
import { createInitialPlaceholders } from './placeholders';
import { initializeRepositoryContent } from './repository';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { error, validatedBody } = validateOnboardingRequest(body);

    if (error) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const { name, email, githubUsername, githubToken, repoName, consentAccepted, experienceLevel, company, role } = validatedBody;

    const user = await createUser(email, name, company, role, experienceLevel, githubUsername, consentAccepted);
    const githubRepo = await createGitHubRepository(user.id, repoName, githubToken);
    await updateSystemConfig(githubToken, repoName);

    try {
      const repoUrl = await createGitHubRepositoryAsync(githubToken, repoName);
      await updateGitHubRepository(githubRepo.id, repoUrl);
      await initializeRepositoryContent(githubToken, repoName, user);
    } catch (error) {
      console.error('GitHub repository creation error:', error);
      await updateGitHubRepository(githubRepo.id, '', 'failed');
    }

    await createSystemLog(user.name, repoName, githubRepo.status);
    await createInitialPlaceholders(user.id, experienceLevel);

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email
      },
      repository: {
        id: githubRepo.id,
        name: repoName,
        url: githubRepo.repoUrl,
        status: githubRepo.status
      }
    });
  } catch (error: any) {
    console.error('Onboarding error:', error);
    return NextResponse.json({ error: error.message || 'Failed to complete onboarding' }, { status: 500 });
  }
}

// src/app/api/onboarding/complete/validation.ts
export function validateOnboardingRequest(body: any) {
  const requiredFields = ['name', 'email', 'githubUsername', 'githubToken', 'repoName', 'consentAccepted'];
  const error = requiredFields.find((field) => !body[field]);

  if (error) {
    return { error: 'Missing required fields' };
  }

  return { validatedBody: body };
}

// src/app/api/onboarding/complete/github.ts
import { db } from '@/lib/db';

export async function createGitHubRepository(userId: string, repoName: string, githubToken: string) {
  return await db.gitHubRepository.create({
    data: {
      userId,
      repoName,
      description: `Evolution Engine Learning Repository for ${repoName}`,
      isPrivate: false,
      status: 'creating'
    }
  });
}

export async function updateGitHubRepository(id: string, repoUrl: string, status: string = 'created') {
  return await db.gitHubRepository.update({
    where: { id },
    data: {
      repoUrl,
      status,
      githubRepoId: status === 'created' ? String(id) : ''
    }
  });
}

export async function createGitHubRepositoryAsync(githubToken: string, repoName: string) {
  const createRepoResponse = await fetch('https://api.github.com/user/repos', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${githubToken}`,
      'Accept': 'application/vnd.github.v3+json',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      name: repoName,
      description: 'Evolution Engine Learning Repository - AI and human learning together',
      private: false,
      auto_init: true,
      gitignore_template: 'node',
      license_template: 'mit'
    })
  });

  if (createRepoResponse.ok) {
    const repoData = await createRepoResponse.json();
    return repoData.html_url;
  } else {
    const errorData = await createRepoResponse.json();
    throw new Error(errorData.message || 'Failed to create GitHub repository');
  }
}

// src/app/api/onboarding/complete/repository.ts
import { db } from '@/lib/db';

export async function initializeRepositoryContent(githubToken: string, repoName: string, user: any) {
  const owner = user.githubUsername;

  try {
    // Create README.md
    const readmeContent = `# Evolution Engine Learning Repository

This repository represents the learning journey of **${user.name}** with Evolution Engine.

## 🤖 About Evolution Engine

Evolution Engine is an AI-powered system that learns and evolves alongside developers.
Together, humans and AI build better software through intelligent automation.

## 📊 Learning Progress

- **Started**: ${new Date().toISOString().split('T')[0]}
- **Experience Level**: ${user.experienceLevel}
- **Current Cycle**: 1

## 📝 What You'll Find Here

- AI-generated code and components
- Evolution history and learning milestones
- System logs and performance metrics
- Your collaborative work with AI

## 🎯 Learning Together

This repository is a living record of how AI and humans can work together
to create amazing software. Every commit tells a story of learning, improvement,
and evolution.

---

*Generated by Evolution Engine*
`;

    await createFileInRepo(githubToken, owner, repoName, 'README.md', readmeContent, 'Initial commit: Evolution Engine setup');

    // Create LEARNING.md
    const learningContent = `# Learning Journey

This document tracks the learning evolution of both the user and the AI system.

## Milestones

### Cycle 1
- Repository created
- Onboarding completed
- Initial placeholders defined

## Achievements

*Your achievements will be tracked here as you progress.*

---

*Last updated: ${new Date().toISOString()}*
`;

    await createFileInRepo(githubToken, owner, repoName, 'LEARNING.md', learningContent, 'Add learning journey documentation');
  } catch (error) {
    console.error('Error initializing repository content:', error);
  }
}

export async function createFileInRepo(githubToken: string, owner: string, repo: string, path: string, content: string, message: string) {
  const url = `https://api.github.com/repos/${owner}/${repo}/contents/${path}`;

  // Get the file's SHA (if it exists)
  const getFileResponse = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${githubToken}`,
      'Accept': 'application/vnd.github.v3+json'
    }
  });

  const contentBase64 = Buffer.from(content).toString('base64');

  if (getFileResponse.ok) {
    const fileData = await getFileResponse.json();
    // File exists, update it
    await fetch(url, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${githubToken}`,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        message,
        content: contentBase64,
        sha: fileData.sha
      })
    });
  } else {
    // File doesn't exist, create it
    await fetch(url, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${githubToken}`,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        message,
        content: contentBase64
      })
    });
  }
}

// src/app/api/onboarding/complete/user.ts
import { db } from '@/lib/db';

export async function createUser(email: string, name: string, company: string, role: string, experienceLevel: string, githubUsername: string, consentAccepted: boolean) {
  return await db.user.upsert({
    where: { email },
    create: {
      email,
      name,
      company: company || null,
      role: role || null,
      experienceLevel,
      consentAccepted,
      consentVersion: '1.0',
      onboardingCompleted: true,
      githubUsername
    },
    update: {
      name,
      company: company || null,
      role: role || null,
      experienceLevel,
      consentAccepted,
      onboardingCompleted: true,
      githubUsername
    }
  });
}

// src/app/api/onboarding/complete/system.ts
import { db } from '@/lib/db';

export async function updateSystemConfig(githubToken: string, repoName: string) {
  const existingConfig = await db.systemConfig.findFirst();

  if (existingConfig) {
    await db.systemConfig.update({
      where: { id: existingConfig.id },
      data: {
        githubToken,
        githubRepo: repoName
      }
    });
  } else {
    await db.systemConfig.create({
      data: {
        githubToken,
        githubRepo: repoName,
        evolutionCycle: 1
      }
    });
  }
}

export async function createSystemLog(name: string, repoName: string, status: string) {
  await db.systemLog.create({
    data: {
      message: `🚀 Onboarding completed for ${name}. Repository ${repoName} ${status === 'created' ? 'created successfully' : 'creation failed'}`,
      type: status === 'created' ? 'success' : 'error',
      timestamp: new Date()
    }
  });
}

// src/app/api/onboarding/complete/placeholders.ts
import { db } from '@/lib/db';

export async function createInitialPlaceholders(userId: string, experienceLevel: string) {
  const basePlaceholders = [
    { externalId: 'auth-layer', name: 'User Authentication', description: 'Implement authentication system', completed: false, dependencies: [] },
    { externalId: 'db-schema', name: 'Database Schema Design', description: 'Create database models and relationships', completed: false, dependencies: [] },
    { externalId: 'ui-kit', name: 'UI Components Setup', description: 'Set up basic UI components', completed: false, dependencies: [] }
  ];

  // Add additional placeholders based on experience level
  if (experienceLevel === 'beginner') {
    basePlaceholders.push(
      { externalId: 'basic-crud', name: 'Basic CRUD Operations', description: 'Create simple create, read, update, delete operations', completed: false, dependencies: ['db-schema', 'ui-kit'] },
      { externalId: 'form-validation', name: 'Form Validation', description: 'Add form validation and error handling', completed: false, dependencies: ['ui-kit'] }
    );
  } else if (experienceLevel === 'intermediate') {
    basePlaceholders.push(
      { externalId: 'advanced-crud', name: 'Advanced CRUD with Filters', description: 'Implement CRUD with advanced filtering and pagination', completed: false, dependencies: ['db-schema', 'ui-kit'] },
      { externalId: 'api-integration', name: 'External API Integration', description: 'Integrate with external APIs and services', completed: false, dependencies: ['auth-layer'] }
    );
  } else {
    basePlaceholders.push(
      { externalId: 'full-stack-architecture', name: 'Full Stack Architecture', description: 'Implement complete frontend and backend architecture', completed: false, dependencies: [] },
      { externalId: 'performance-optimization', name: 'Performance Optimization', description: 'Optimize application performance and caching', completed: false, dependencies: ['db-schema'] },
      { externalId: 'advanced-features', name: 'Advanced Features', description: 'Implement advanced features like real-time updates, websockets', completed: false, dependencies: ['auth-layer', 'ui-kit'] }
    );
  }

  for (const placeholder of basePlaceholders) {
    await db.placeholder.upsert({
      where: { externalId: placeholder.externalId },
      create: {
        externalId: placeholder.externalId,
        name: placeholder.name,
        description: placeholder.description,
        completed: placeholder.completed,
        dependencies: JSON.stringify(placeholder.dependencies)
      },
      update: {}
    });
  }
}