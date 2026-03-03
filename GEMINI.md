# GEMINI.md

## Project Overview
**Personal Ninja** (formerly OOO Agent / Coverage Ninja) is an AI-powered everyday assistant built with Next.js 15. It deeply integrates with a user's workspace (Gmail, Drive) to gather context and automatically generate draft replies to incoming actionable emails, staging them in the user's inbox for quick review and sending.

### Key Features
- **Context-Aware Drafts**: Uses local embeddings and semantic search (RAG) to find answers in indexed documents and past emails.
- **Triage Layer**: Filters out newsletters, marketing, and non-actionable emails to save tokens and focus only on real requests.
- **Bring Your Own Key**: Leverages the user's own Gemini API quota to process data.
- **Drafts, Not Auto-Replies**: Stages the generated response in the user's Gmail Drafts folder instead of sending automatically.
- **Event-Driven Cloud Architecture**: Relies on webhooks, **Google Pub/Sub**, and **Google Cloud Tasks** for real-time processing.
- **MCP Integration**: Connects to Gmail, Drive, and Slack via the Model Context Protocol.

## Tech Stack
- **Framework**: Next.js 15 (App Router)
- **Runtime**: Node.js 18+
- **AI/LLM**: 
  - **Reasoning**: Google Gemini 1.5 Flash (via user's own API key)
  - **Embeddings**: Local `@xenova/transformers` (BGE-Small-v1.5)
- **Database**: PostgreSQL (Cloud SQL) with Prisma ORM
- **Processing**: Google Cloud Tasks & Google Pub/Sub
- **Deployment**: Dockerized (Next.js standalone tracing), Google Cloud Run, Google Secret Manager
- **Styling**: Tailwind CSS + Shadcn UI

## Core Mandates & Architecture Guidelines
These rules take precedence over general defaults:
1. **Zero-Cost First Policy**: Always prefer local embeddings (`LocalEmbeddingService`) over remote API calls for indexing.
2. **User LLM Quota**: Use the user-provided Gemini API key for all generation tasks. Default to `Gemini 1.5 Flash`.
3. **Event-Driven Only**: Avoid `setInterval` or polling. All triggers flow through webhooks, Google Pub/Sub, and Cloud Tasks.
4. **Triage First**: Incoming emails MUST pass through the `TriageService` to filter out junk/newsletters before invoking any LLM.
5. **No Auto-Send**: The agent MUST ONLY create drafts in Gmail. It must never auto-send emails on behalf of the user.
6. **Activity Logging**: Every agent action (reads, writes) must be logged to the database for the user's dashboard summary.

## Building and Running

### Development
```bash
# Install dependencies
npm install

# Set up environment (Database URLs required)
cp .env.example .env

# Initialize database
npx prisma migrate dev

# Start development server
npm run dev
```

### Production Deployment Notes
- Containerized using a Dockerfile that utilizes Next.js standalone tracing.
- Deployed on **Google Cloud Run**.
- Database is stateful **PostgreSQL on Cloud SQL**. NextAuth user credentials are persisted using Prisma Adapter behind a Cloud SQL socket proxy.
- Ensure `@google-cloud/tasks` is manually copied into the standalone build.
- Schema changes in production require manual bootstrapping of `prisma/migrations`.

## Key Directories
- `src/app/api/tasks`: Entry point for Google Cloud Tasks background processing.
- `src/app/api/webhooks`: Handlers for Pub/Sub and external webhooks.
- `src/lib/llm.ts`: LLM Provider Factory and Gemini integration.
- `src/lib/local-embeddings.ts`: Local vector generation.
- `src/modules/context`: RAG implementation and document indexing.
- `src/modules/response`: Draft generation logic.
- `prisma/schema.prisma`: Source of truth for users, configurations, and activity logs.
