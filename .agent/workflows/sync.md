---
description: 
---

# Workflow: /sync
1. **Stash**: Temporarily save any uncommitted changes (`git stash`).
2. **Fetch**: Checkout `main`, `git pull origin main`.
3. **Integrate**: Checkout the feature branch, `git merge main` (or `rebase`).
4. **Restore**: Re-apply the stashed changes (`git stash pop`).
5. **Verify**: Run a quick build check to ensure the sync didn't break anything.