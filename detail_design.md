# OOO Agent - Detailed Design Document (Slim Architecture)

## 1. Overview
The OOO Agent ("Coverage Ninja") architecture has been streamlined from its original design to optimize for cost, performance, and real-time responsiveness. This document outlines the core technical components and highlights deviations from the original Product Requirements Document (PRD).

## 2. Core Architecture Components

### 2.1 Serverless & Event-Driven Engine
- **Push vs. Polling**: Instead of periodic polling intervals, the agent relies on a Pub/Sub webhook mechanism combined with Inngest push-based processing. This enables real-time, on-demand execution for incoming communications without wasting compute cycles on empty inboxes.

### 2.2 Triage Layer (`TriageService`)
- **Purpose**: A pre-processing layer that filters out non-actionable emails (e.g., newsletters, automated alerts, marketing emails) locally.
- **Benefit**: Significantly saves on LLM costs by preventing unnecessary token usage and API calls. Only actionable human-driven emails proceed to the reasoning layer.

### 2.3 Context & Retrieval (Local RAG)
- **Zero-Cost Embeddings**: Integrated `@xenova/transformers` to generate embeddings locally within the Node.js process.
- **Microservice Offloading**: The architecture supports offloading embedding generation to a dedicated Cloud Run microservice if local processing becomes a bottleneck.
- **Vector Store**: A lightweight vector store is used for local similarity execution, enabling semantic search over the user's historical context.

### 2.4 Multi-Tier LLM Strategy
- **Provider Factory**: The `LLMProviderFactory` dynamically manages LLM routing based on the task urgency and complexity.
- **Default Model**: Gemini 1.5 Flash is set as the default model, reducing generation costs by ~90% while maintaining robust reasoning capabilities for drafting responses and topic classification.

### 2.5 Enhanced Routing & Response
- **Routing**: `RoutingService` is improved to use both direct mapping and semantic topic matching to accurately identify the best coverage person.
- **Response**: `ResponseService` encompasses policy-compliant response generation, utilizing the `TriageService` and acting strictly under the `{user}_OOO_assistant` identity.

### 2.6 Comprehensive Activity Logging
- **Database Integration**: Every agent action, policy interception, email read, and response generated is synchronously recorded in the database. This acts as the source of truth for the user's return summary and administrative audit logs.

## 3. Deviations from PRD (The "Diff")

| Feature / Area | PRD Requirement | Current Slim Architecture | Rationale |
| :--- | :--- | :--- | :--- |
| **Email Ingestion** | Polling/periodic syncing implied (CE-1) | **Push-based** via Pub/Sub & Inngest | Real-time responsiveness; zero wasted compute on idle monitoring. |
| **Response Filtering** | AI analyzes all incoming emails (RE-1) | **TriageService** filters locally | Huge LLM cost savings by ignoring newsletters and automated spam. |
| **Embeddings Generation**| Gemini Embedding API | **Local Embeddings** (`@xenova/transformers`) | Zero-cost indexing; completely private data processing. |
| **LLM Model Strategy** | Default Gemini Pro assumed | **Gemini 1.5 Flash** via Factory | 90% cost reduction; sufficient for text classification and proxy replies. |
