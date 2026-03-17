# NEXUS AGI v7.0 - System Backup

## What is This?
A self-bootstrapping AGI system that:
- Evolves its own code
- Ingests DNA (knowledge) from GitHub repositories
- Pushes improvements back to GitHub
- Learns and grows autonomously

## Components

### Frontend
- `page.tsx` - Main UI (logs + chat interface)

### API Routes
- `api/llm/route.ts` - LLM integration via z-ai-web-dev-sdk
- `api/dna/route.ts` - DNA ingestion from GitHub repos
- `api/execute/route.ts` - Safe code execution sandbox
- `api/github/route.ts` - Full GitHub operations

### Database
- `prisma/schema.prisma` - SQLite schema for DNA storage

## How to Use
1. Set GITHUB_TOKEN environment variable
2. Run `bun run dev`
3. Open browser to see NEXUS
4. Watch it evolve autonomously!

## Backup Created
- Date: $(date)
- Branch: nexus-backup-v7
- Repository: craighckby-stack/Test-1