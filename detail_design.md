# Personal Ninja - Detailed Design Document

## 1. Overview
The "Personal Ninja" architecture is an evolution of the previous OOO Agent. It has been streamlined to optimize for real-time responsiveness, personal context mapping, and cost efficiency. The system operates as a continuous assistant rather than an out-of-office auto-responder, generating highly contextual drafts for incoming emails and staging them in the user's Gmail Drafts folder.

## 2. Core Architecture Components

### 2.1 Serverless & Event-Driven Engine
- **Push vs. Polling**: The agent relies on a Pub/Sub webhook mechanism combined with Google Cloud Tasks. This enables real-time, on-demand execution for incoming emails.

### 2.2 Triage Layer (`TriageService`)
- **Purpose**: A pre-processing layer that filters out non-actionable emails (e.g., newsletters, automated alerts, marketing emails) locally.
- **Benefit**: Significantly saves on LLM costs by preventing unnecessary token usage and API calls. Only actionable human-driven emails proceed to the reasoning layer.

### 2.3 Context & Retrieval (Local RAG)
- **Zero-Cost Embeddings**: Integrated `@xenova/transformers` to generate embeddings locally within the Node.js process.
- **Vector Store**: A lightweight vector store is used for local similarity execution, enabling semantic search over the user's historical context (Drive docs, recent emails).
- **Daily Context Sync**: A cron job triggers Cloud Tasks to fetch and embed recent context data.

### 2.4 User-Supplied LLM Strategy
- **Bring Your Own Key**: The system requires the user to supply their own Gemini API Key (`gemini-1.5-flash` or `gemini-1.5-pro`). This key is encrypted and stored in the database.
- **Provider Factory**: The `LLMProviderFactory` dynamically injects the user's API key when instantiating the LLM client.

### 2.5 Response Generation
- **Drafting, Not Sending**: The `ResponseService` does not auto-reply. Instead, it generates a draft using the context and the user's LLM, and inserts it directly into the Gmail thread as a Draft for the user to review.

### 2.6 Comprehensive Activity Logging
- **Database Integration**: Every agent action, policy interception, email read, and draft generated is synchronously recorded in the PostgreSQL (Cloud SQL) database.

## 3. Technology Stack

- **Framework**: Next.js 15 (App Router)
- **Runtime**: Node.js 18+
- **AI/LLM**: Google Gemini 1.5 (via user's API key)
- **Embeddings**: Local `@xenova/transformers`
- **Database**: PostgreSQL (Cloud SQL) with Prisma ORM
- **Processing**: Google Cloud Tasks & Google Pub/Sub
- **Deployment**: Dockerized (Next.js standalone tracing), Google Cloud Run
- **Styling**: Tailwind CSS + Shadcn UI
