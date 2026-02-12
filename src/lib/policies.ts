export const POLICIES = {
    // PR-1: Indexing Scope
    MAX_INDEXING_MONTHS: 6,

    // PR-2: Coverage Precedence
    CONFLICT_RESOLUTION: 'USER_OVERRIDE', // User Manual > AI Suggestion

    // PR-3 & PR-4 handled via store state (metaPolicyAllowContext)
}

export const RULES_DESCRIPTION = {
    INDEXING_SCOPE: "Hard limit: Indexing is restricted to emails and documents from the last 6 months.",
    COVERAGE_PRECEDENCE: "Manual coverage assignments always take precedence over AI suggestions.",
}
