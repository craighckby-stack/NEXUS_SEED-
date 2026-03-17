# My Project

A modern Next.js application built with TypeScript, Tailwind CSS, and shadcn/ui.

## Tech Stack

- **Next.js 15** - React framework with App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first CSS framework
- **shadcn/ui** - Beautiful, accessible UI components

## Getting Started

```bash
# Install dependencies
bun install

# Run development server
bun run dev

# Build for production
bun run build

# Run linter
bun run lint
```

Visit [http://localhost:3000](http://localhost:3000) to view the application.

## Project Structure

```
src/
├── app/          # Next.js App Router pages
├── components/   # React components
│   └── ui/       # shadcn/ui components
├── hooks/        # Custom React hooks
├── lib/          # Utility functions
└── system/       # System files (placeholders, evolution)
```

## Features

- Responsive design with dark mode support
- Type-safe with TypeScript
- Pre-built UI components
- Database support with Prisma
- AI integration via z-ai-web-dev-sdk
- Placeholder system for strategic development

## Scripts

- `bun run dev` - Start development server
- `bun run build` - Build for production
- `bun run lint` - Run ESLint
- `bun run db:push` - Push database schema
- `bun run db:generate` - Generate Prisma client

## Documentation

For more details, see the project documentation files in the root directory.
