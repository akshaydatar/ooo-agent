---
description: 
---

# Workflow: /startup
1. **Sync Main**: Checkout `main`, pull the latest from GitHub.
2. **Rebase/Merge**: Return to the active feature branch and integrate `main`.
3. **Housekeeping**: Run `npm install` (or equivalent) to catch any new dependencies.
4. **Environment**: Start the local development server.
5. **Status**: Summarize the "Next Tasks" from the `IMPLEMENTATION_PLAN.md`.