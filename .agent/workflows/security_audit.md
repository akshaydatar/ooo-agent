---
description: 
---

# Workflow: /security-audit
1. **Secret Scan**: Scan the workspace for hardcoded keys or `.env` files not in `.gitignore`.
2. **Access Control Check**: Review API route handlers to ensure user-scoping is enforced (e.g., "Can User A read User B's emails?").
3. **Dependency Audit**: Run `npm audit` or equivalent and summarize critical patches.
4. **Sanitization Check**: Verify that all email body rendering uses proper HTML sanitization (e.g., DOMPurify) to prevent XSS.
5. **Report**: Output a 'Security Advisory' artifact with prioritized fixes (P0 to P3).