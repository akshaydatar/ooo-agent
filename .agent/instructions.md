# Agent Instructions: Slim Architecture Guidelines

These instructions dictate how AI coding personas (`@Architect`, `@Frontend`, etc.) should approach further development of the OOO Agent, taking strictly into account the recently implemented "Slim Architecture" optimizations.

## 1. Zero-Cost / Low-Cost First Policy
- **Embeddings**: When dealing with the Context Engine or Vector Store, prioritize the local `@xenova/transformers` implementation. Do not revert to the Gemini Embedding API unless explicitly prompted to do so by the user for performance reasons.
- **LLM Routing**: Use `Gemini 1.5 Flash` as the default model in the `LLMProviderFactory`. Reserve more expensive models only for fallback or highly complex reasoning (which is currently out of scope).

## 2. Event-Driven Mindset
- **Avoid Polling**: Do not write `setInterval` or cron-style background jobs for external API fetching.
- **Push Systems**: All external triggers must map to a webhook -> Inngest event pipeline.

## 3. Triage & Safety First
- **No Direct LLM Passthrough**: incoming emails MUST pass through the `TriageService` to filter out junk/newsletters before calling any LLM.
- **Identity Enforcement**: Ensure any generated text explicitly signs off as `{user}_OOO_assistant`.

## 4. Database Source of Truth
- Every action the agent takes MUST be logged via the Activity Logging system to populate the return dashboard. Do not execute "silent" interactions.
