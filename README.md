# OOO Agent (Coverage Ninja)

A smart Out-Of-Office assistant that drafts intelligent email replies using context from your workspace (Docs, Slack) and routes urgent topics to the right coverage contact.

## Features

-   **Context-Aware Replies**: Uses RAG (Retrieval-Augmented Generation) to find relevant internal docs/answers.
-   **Smart Routing**: Analyzes email topics to suggest the best point of contact.
-   **Rules Engine**: "If X, then Y" logic for VIPs or specific topics.
-   **Fallback Safety Net**: Automatically degrades to a static response with manager info if AI services fail.
-   **MCP Integration**: Connects to Gmail, Drive, and Slack via the Model Context Protocol.

## Tech Stack

-   **Framework**: Next.js 15 (App Router)
-   **Database**: SQLite + Prisma
-   **AI/LLM**: Google Gemini (`gemini-1.5-flash`, `models/gemini-embedding-001`)
-   **Integration**: Model Context Protocol (MCP) SDK
-   **Styling**: Tailwind CSS + Shadcn UI

## Getting Started

### Prerequisites

-   Node.js 18+
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
    # Add your GEMINI_API_KEY in .env
    ```
4.  Initialize the database:
    ```bash
    npx prisma migrate dev
    ```

### Running the App

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Testing & Verification

The project includes several scripts to test core engines independently:

-   **Rule Engine**: `npx tsx scripts/test-rules.ts`
-   **Routing Engine**: `npx tsx scripts/test-routing.ts`
-   **Context Engine (RAG)**: `npx tsx scripts/test-rag-real.ts` (Requires API Key)
-   **Fallback Logic**: `npx tsx scripts/test-fallback.ts`
-   **End-to-End Demo**: `npx tsx scripts/demo-e2e.ts`

## Deployment

This app is designed to be deployed on Vercel or Railway. Ensure your production environment variables (DATABASE_URL, GEMINI_API_KEY) are set correctly.

## License

MIT
