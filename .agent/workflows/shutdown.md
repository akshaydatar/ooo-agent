---
description: 
---

# Workflow: /shutdown
1. **Status Check**: Run `git status` to identify uncommitted changes.
2. **Lint/Format**: Run Prettier/ESLint to ensure code is clean.
3. **Commit**: Prompt the user to commit work with a 'Conventional Commit' message.
4. **Push**: Push the current branch to GitHub (remote backup).
5. **Report**: Create a brief 'End of Day' summary in the chat of what was achieved.