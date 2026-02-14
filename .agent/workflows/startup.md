---
description: 
---

# Workflow: /startup
1. **SSH Check**: 
   - Verify if `ssh-agent` is running. If not, start it.
   - Check if the identity is loaded (`ssh-add -l`). 
   - If no keys are loaded, prompt the user to run `ssh-add`.
2. **Sync Main**: Checkout `main`, pull the latest from GitHub.
3. **Rebase/Merge**: Return to the active feature branch and integrate `main`.
4. **Housekeeping**: Run `npm install` (or equivalent) to catch any new dependencies.
5. **Environment**: Start the local development server.
6. **Status**: Summarize the "Next Tasks" from the `IMPLEMENTATION_PLAN.md`.