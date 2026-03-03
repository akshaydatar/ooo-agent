# Product Requirements Document: Personal Ninja

## 1. Product Motivation

### Problem Statement
Professionals spend an inordinate amount of time reading and drafting responses to routine, yet highly contextual emails. While static auto-replies or generic AI responders exist, they lack the deep context of the user's past communications, current projects, and internal documentation. Users need an everyday assistant that understands their workspace and can pre-draft intelligent, context-aware responses directly in their inbox for review.

### Vision
An AI-powered everyday assistant ("Personal Ninja") that deeply understands the user's role, responsibilities, contributions, and organizational context. Rather than sending automated out-of-office replies, Personal Ninja actively monitors the inbox, triages emails to ignore newsletters and spam, and automatically prepares highly contextual draft responses for relevant incoming emails, leaving them in the user's Gmail Drafts folder for a quick review and send.

### Value Proposition
- **For ICs and Managers**: Drastically reduce email processing time. Open an email and find a highly accurate draft already waiting for you, complete with links to relevant Drive docs and historical context.
- **For the Organization**: Faster response times, better utilization of institutional knowledge, and reduced context-switching overhead.

---

## 2. Personas

### 2.1 The Professional (Primary User)
**Profile**: An individual contributor, manager, or executive dealing with high email volume.
**Goals**:
- Toggle the assistant ON indefinitely (no date windows).
- Have drafts waiting for them that require minimal editing.
- Bring their own Gemini API quota/key for processing.
**Pain Points**:
- Context switching to find old documents or threads to answer simple questions.
- Time wasted writing boilerplate email responses.

---

## 3. Critical User Journeys (CUJs)

### CUJ-1: User Activates Personal Ninja
1. User opens the Personal Ninja dashboard.
2. User provides their personal Gemini API Key (leveraging their own quota).
3. Grants permissions for Gmail and Google Drive analysis.
4. Toggles the agent ON (indefinite state, no date window required).
5. Agent begins indexing recent email threads and Drive documents (runs daily).
6. Agent is live — monitoring the inbox.

### CUJ-2: Incoming Email Processing & Draft Generation
1. Sender emails the user with a question about a project.
2. Agent intercepts the email via Pub/Sub webhook.
3. Agent's TriageService analyzes the email to ensure it's actionable (ignores newsletters/spam).
4. Agent searches indexed Drive documents and historical emails for context.
5. Agent uses the user's Gemini quota to generate a highly contextual draft reply.
6. Agent creates a draft in the user's Gmail thread, rather than sending it directly.
7. User opens Gmail, reviews the draft, makes minor edits, and clicks "Send".

---

## 4. Detailed Feature Requirements

### 4.1 Context Engine
**Purpose**: Build and maintain a rich understanding of the user's work context.

| ID | Requirement | Priority |
|----|------------|----------|
| CE-1 | Index Gmail threads and Google Drive documents for context | P0 |
| CE-2 | Daily background cron job to gather and update context | P0 |
| CE-3 | Local Embeddings generation using `@xenova/transformers` to save costs | P0 |

### 4.2 Response Engine
**Purpose**: Generate intelligent, policy-compliant drafts.

| ID | Requirement | Priority |
|----|------------|----------|
| RE-1 | Triage all incoming emails; skip marketing, newsletters, and non-actionable items | P0 |
| RE-2 | Generate a contextual email draft leveraging the user's custom Gemini API key | P0 |
| RE-3 | Insert the generated response directly into the user's Gmail Drafts, associated with the correct thread | P0 |
| RE-4 | Do not auto-send emails; strictly prepare drafts for user review | P0 |

### 4.3 Plugin UI / Dashboard
**Purpose**: Configuration interface for users to set up and monitor Personal Ninja.

| ID | Requirement | Priority |
|----|------------|----------|
| UI-1 | Simple Toggle: Single switch to activate/deactivate the agent indefinitely | P0 |
| UI-2 | Settings Page: Input for User's Gemini API Key | P0 |
| UI-3 | Permission grants: OAuth flow for Gmail and Drive access | P0 |
| UI-4 | Activity feed: Log of emails triaged and drafts created | P1 |

---

## 5. Performance, Reliability & Security Criteria

### 5.1 Security
| Requirement | Detail |
|-------------|--------|
| Authentication | Google OAuth 2.0 with PKCE |
| API Keys | User's Gemini API key must be encrypted at rest in the Cloud SQL database |
| Data | Emails and docs are processed using local embeddings and the user's LLM quota. |

### 5.2 Architecture
- **Infrastructure**: Google Cloud Run, Google Cloud Tasks (for background jobs/daily indexing), Cloud SQL (PostgreSQL).
- **Event-Driven**: Gmail Pub/Sub for immediate email interception.

---

## 6. Success Metrics

| Metric | Definition | Target |
|--------|-----------|-------------------------------|
| Draft Utilization | % of generated drafts that are sent with minimal edits | > 70% |
| Triage Accuracy | % of marketing/spam successfully ignored | > 95% |
| Time Saved | Estimated time saved per user per week | > 2 hours |
