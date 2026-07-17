# OOO Agent (Coverage Ninja)

A smart Out-Of-Office assistant that drafts intelligent email replies using context from your workspace (Gmail, Drive, Calendar) and routes urgent topics to the right coverage contact.

## Features

-   **Context-Aware Replies**: Uses RAG (Retrieval-Augmented Generation) to find relevant internal docs/answers.
-   **Smart Routing**: Analyzes email topics to suggest the best point of contact.
-   **Rules Engine**: "If X, then Y" logic for VIPs or specific topics.
-   **Fallback Safety Net**: Automatically degrades to a static response with manager info if AI services fail.
-   **Google Workspace Integration**: Reads Gmail, Drive, and Calendar via native Google APIs. A generic MCP (Model Context Protocol) client is also included for connecting additional tool servers; only Gmail/Drive are wired up today (Slack appears in the setup UI but is backed by a mock adapter, not a live integration).

## Tech Stack

-   **Framework**: Next.js 16 (App Router)
-   **Database**: PostgreSQL + Prisma
-   **AI/LLM**: Google Gemini (`gemini-1.5-flash`, `models/gemini-embedding-001`), with a local (`@xenova/transformers`) embedding fallback
-   **Integration**: Model Context Protocol (MCP) SDK
-   **Styling**: Tailwind CSS + Shadcn UI

## Getting Started

### Prerequisites

-   Node.js 20+
-   A PostgreSQL database (the included `docker-compose.yml` provides one for local dev)
-   `GEMINI_API_KEY` (Get one from [Google AI Studio](https://aistudio.google.com/))

### Installation

1.  Clone the repository.
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Set up environment variables:
    ```bash
    cp .env.example .env
    # Fill in GEMINI_API_KEY, AUTH_SECRET, and DATABASE_URL at minimum.
    # See .env.example for the full list and what each variable does.
    ```
4.  Start a local database (optional — skip if you already have one):
    ```bash
    docker compose up -d db
    ```
5.  Apply migrations:
    ```bash
    npx prisma migrate dev
    ```

### Running the App

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

Alternatively, `docker compose up --build` runs the full stack (app + Postgres) in containers.

## Testing & Verification

Automated tests (`npm test`) are split into two kinds:

-   **Unit tests** (`__tests__/smoke.test.tsx`, `__tests__/webhook.test.ts`) run with no external dependencies.
-   **Integration tests** (`__tests__/auth-adapter.test.ts`, `__tests__/rag-context.test.ts`, `__tests__/response-rules.test.ts`) require a live `DATABASE_URL` (run `docker compose up -d db` first) and, for the RAG test, a real `GEMINI_API_KEY`. These also run in CI (see `.github/workflows/ci.yml`) against a disposable Postgres service container.

The project also includes standalone scripts under `scripts/` for exercising individual engines during development:

-   **Rule Engine**: `npx tsx scripts/test-rules.ts`
-   **Routing Engine**: `npx tsx scripts/test-routing.ts`
-   **Context Engine (RAG)**: `npx tsx scripts/test-rag-real.ts` (Requires API Key)
-   **Fallback Logic**: `npx tsx scripts/test-fallback.ts`
-   **End-to-End Demo**: `npx tsx scripts/demo-e2e.ts`

## Deployment

This app is designed to be deployed on Vercel or Railway. Ensure your production environment variables (see `.env.example`) are set correctly, and never commit a real `.env` file — `AUTH_SECRET` in particular must be a unique, secret value per environment (`openssl rand -base64 32`).

## License

MIT
