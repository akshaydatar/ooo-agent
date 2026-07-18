# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

OOO Agent is an AI-powered out-of-office assistant that replaces static auto-replies with intelligent, context-aware email responses. It indexes a user's emails, documents, and calendar to route requests to the right coverage person per topic and surface relevant documentation. V1 targets Google Workspace integration.

## Commands

- `npm run dev` — start Next.js dev server
- `npm run build` — production build
- `npm run lint` — ESLint
- `npx prisma generate` — regenerate Prisma client after schema changes
- `npx prisma db push` — push schema changes to the PostgreSQL database
- `npx prisma studio` — open database GUI
- `node scripts/check-db.js` — verify database connectivity

## Architecture

**Stack**: Next.js 16 (App Router), TypeScript, Tailwind CSS, Prisma (PostgreSQL), Zustand, Zod, Radix UI (via shadcn/ui).

**Path alias**: `@/*` maps to `./src/*`.

### Module Structure (`src/modules/`)

The backend logic is organized into three domain modules, each with `types.ts` (interfaces) and `service.ts` (business logic class):

- **context/** — Context Engine: indexes emails, docs, and calendar events; provides semantic search over user's work context using vector embeddings (`src/lib/vector-store.ts`, `src/lib/local-embeddings.ts`) — Supabase (pgvector) by default, or a local Prisma-backed store via `OVERRIDE_VECTOR_STORE=sqlite`.
- **response/** — Response Engine: generates policy-compliant email draft responses using LLM + retrieved context. Handles PII redaction.
- **routing/** — Routing Engine: determines the best coverage person for a topic using contributor stats, coverage maps, and heuristic scoring.

### Frontend (`src/app/`, `src/components/`)

- App Router with a `(dashboard)` route group containing the main UI
- Sidebar navigation: Dashboard, Coverage Map, Activity Log, Response Rules, Settings
- UI primitives in `src/components/ui/` (shadcn/ui pattern — modify in place, don't import from a package)
- `src/components/app-sidebar.tsx` — main navigation component
- `src/components/layout/dashboard-layout.tsx` — alternative header-based layout (currently unused)

### Database (`prisma/schema.prisma`)

PostgreSQL with these models: User, Organization, CoverageMap, ResponseRule, ActivityLog, DataPolicy. Flexible fields (conditions, actions, rules, metadata) are stored as JSON strings in `String` columns rather than Prisma's native `Json` type — a holdover from an earlier SQLite-based schema; parse/stringify manually when reading or writing them. Prisma client singleton is in `src/lib/db.ts`.

### API Routes

- `GET /api/health` — health check endpoint (verifies DB connection)

## Coding Conventions

- TypeScript strict mode; no `any` types
- Functional components and hooks only (no class components)
- Zod for schema validation on API boundaries
- Conventional Commits: `feat:`, `fix:`, `docs:`, etc.
- Design follows "Modern Precision" aesthetic (minimal, high-contrast, Linear/Vercel-inspired)
- Tailwind theme uses CSS custom properties via HSL (see `tailwind.config.ts`)
- Dark mode supported via `class` strategy
