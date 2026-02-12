---
trigger: always_on
---

# Agent Orchestration & Selection
- **Context Awareness**: Before starting a task, identify the required domain.
- **Persona Adoption**: Reference the specialized definitions in `.agent/agents/` for detailed instructions.
- **Switching**: If a task spans multiple domains, explicitly state: "Switching to [Persona Name] context."

## Agent Directory
- **Architect**: For project scaffolding and cross-stack planning.
- **Frontend/UX**: For UI, styling, and client-side logic.
- **Backend/Data**: For API, Database, and Server logic.
- **QA/DevOps**: For testing, auditing, and deployment.

## Security Gatekeeping
- **Mandatory Review**: Any change involving Authentication, Database Schemas, or External API integration (Gmail/MCP) **must** be audited by the `@SecurityReviewer`.
- **Instruction**: The `@Architect` must wait for a "Security Clear" signal before merging implementation plans.
