---
trigger: always_on
---

# Git & Commit Standards
- **Branching**: Always check out a new branch before modifying code. Pattern: `[initials]/[feature-name]`.
- **Commit Format**: Use Conventional Commits (feat, fix, docs, refactor).
- **Atomic Commits**: Commits should be "atomic"—one logical change per commit.
- **Pre-Commit**: Run the `/security-audit` workflow before any commit to ensure no secrets are staged.
- **Messages**: Commit messages must be in the imperative mood (e.g., "add search index" NOT "added search index").