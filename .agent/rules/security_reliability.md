# Security & Reliability
- **Secrets**: Never hardcode API keys or credentials. Use `.env` files and ensure they are in `.gitignore`.
- **Validation**: Use Zod for schema validation on all API boundaries.
- **Error Handling**: Implement global error boundaries and structured logging (Severity, Timestamp, Context).
- **Git**: Follow Conventional Commits (e.g., `feat:`, `fix:`, `docs:`). Always create a new branch for features.
