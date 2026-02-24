# Project Evaluation: OOO Agent

## 1. Progress Evaluation Matrix

| Module | Status | Completion % | Current Capabilities |
| :--- | :--- | :--- | :--- |
| **Core Infrastructure** | Stable | 85% | Next.js 14 (App Router), Prisma (Postgres/SQLite), Inngest (Background Jobs), NextAuth (Google). |
| **Google Workspace** | Functional | 70% | Gmail/Drive clients implemented for reading/writing. Calendar integration missing. |
| **Context Engine** | Beta | 55% | RAG pipeline with recursive chunking and vector search. SQLite/Supabase support. |
| **Response Engine** | Functional | 60% | AI-augmented drafting, rule evaluation, basic PII scrubbing (regex). |
| **Routing Engine** | Basic | 40% | Manual overrides and contributor-based suggestions. No semantic topic clustering. |
| **User Dashboard** | Functional | 65% | Status toggle, rules editor, coverage map (UI). Date picker/Activity Feed missing. |
| **Admin Console** | Mocked | 30% | UI exists as a shell. Policy enforcement and audit logging not yet wired to DB. |

---

## 2. Identified Gaps & Missing Requirements

### A. Context & Ingestion (PRD Ref: 4.1)
*   **[CE-3] Calendar Integration**: No `CalendarClient` or indexing for OOO events/meeting patterns.
*   **[PR-1] Indexing Scope**: Current Inngest jobs fetch fixed limits (25 items) instead of enforcing the **6-month hard lookback limit**.
*   **[CE-4] Topic Modeling**: Lacks true LLM-driven topic clustering; currently relies on simple metadata matches.

### B. Response & Security (PRD Ref: 4.2, 4.7)
*   **[RE-7] Assistant Identity**: Currently uses "Coverage Ninja" sign-off. Must be `{user}_OOO_assistant` and clearly AI-identified.
*   **[RE-4] PII Redaction**: `PIIScrubber` is regex-only (Phone/SSN). Lacks financial data detection and DLP API integration.
*   **[PR-3/4] Policy Enforcement**: `ResponseService` ignores `DataPolicy` settings. Meta-policies (Allow/Disallow summaries) are not enforced.

### C. Routing & Logic (PRD Ref: 4.3, 4.5)
*   **[RE-10/UI-7] Activity Tracking**: No `ActivityLog` entries created upon response/escalation. This breaks the **Activity Feed** and **Return Summary**.
*   **[RO-3] Fallback Logic**: Manager fallback is hardcoded in the service; should be more robust and configurable via the `User` model.
*   **[AC-2] Audit Trail**: Immutable logs of agent actions (what was read/shared) are not implemented.

### D. UI/UX (PRD Ref: 4.4)
*   **[UI-2] OOO Scheduling**: Lacks a date picker for start/end dates; toggle is currently immediate-only.
*   **[UI-8] Return Summary**: Dashboard activity feed is a placeholder. Needs categorization: **Resolved**, **Pending**, **Escalated**.
*   **[UI-11/12] Indexing States**: Progress animations and specific indexing status messages are partially implemented but not fully reactive to back-end state.

---

## 3. Technical Debt & Observations
*   **Vector Search**: `SQLiteVectorStore` performs an in-memory cosine similarity across all chunks (O(n)). This will scale poorly beyond ~1000 chunks.
*   **Mock Providers**: `MockLLMProvider` is the default in several places. Needs a more robust configuration switch for production `GeminiLLMProvider`.
*   **Error Handling**: Inngest jobs lack specific retry logic for rate-limited Google APIs (429s).

---

## 4. Recommended Execution Plan

1.  **Phase 1: Compliance & Identity**
    *   Update `ResponseService` identity and sign-off.
    *   Implement `ActivityLog` creation for every generated response.
    *   Add 6-month filter to Gmail/Drive indexing queries.

2.  **Phase 2: Context Expansion**
    *   Build `CalendarClient` and `index-calendar-events` Inngest step.
    *   Improve `RoutingService` using LLM-based topic classification.

3.  **Phase 3: Admin & Governance**
    *   Wire Policy UI to Prisma `DataPolicy`.
    *   Implement `PolicyInterceptor` in the `ResponseService` pipeline.

4.  **Phase 4: UX Polishing**
    *   Add DateRangePicker to Dashboard.
    *   Build the categorization logic for the Activity Feed (Resolved/Pending/Escalated).
