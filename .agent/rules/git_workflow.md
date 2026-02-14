---
trigger: always_on
---

# Git & Commit Standards
- **Branching**: Always check out a new branch before modifying code. Pattern: `[initials]/[feature-name]`.
- **Commit Format**: Use Conventional Commits (feat, fix, docs, refactor).
- **Atomic Commits**: Commits should be "atomic"—one logical change per commit.
- **Pre-Commit**: Run the `/security-audit` workflow before any commit to ensure no secrets are staged.
- **Messages**: Commit messages must be in the imperative mood (e.g., "add search index" NOT "added search index").

## Post-Feature Cleanup
- **Squash Policy**: Prefer 'Squash and Merge' for feature branches to maintain a readable `main` history.
- **Deletion**: Delete local and remote branches immediately after a successful merge to `main`.
- **Sync**: After merging, the Architect must ensure the local `main` is pulled and dependencies are re-installed if `package.json` changed.