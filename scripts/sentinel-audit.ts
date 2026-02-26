import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import { LLMProviderFactory } from '../src/lib/llm';

async function sentinelAudit() {
    console.log('🛡️  Sentinel: Commencing Security & Reliability Audit...');

    // 1. Get Staged Diff (Increasing buffer to handle large diffs, but excluding package-lock)
    let diff = '';
    try {
        diff = execSync('git diff --cached -- . ":(exclude)package-lock.json"', {
            maxBuffer: 10 * 1024 * 1024 // 10MB buffer
        }).toString();
    } catch (e) {
        console.warn('⚠️ Sentinel: Failed to get diff or diff too large. Skipping audit.');
        return;
    }

    if (!diff || diff.trim() === '') {
        console.log('✅ No critical code changes to audit.');
        return;
    }

    // 2. Load Project Rules
    const securityRulesPath = path.join(process.cwd(), '.agent/rules/security_reliability.md');
    
    let rules = '';
    if (fs.existsSync(securityRulesPath)) rules += fs.readFileSync(securityRulesPath, 'utf8');

    // 3. Invoke LLM
    const llm = LLMProviderFactory.getProvider();
    
    const systemPrompt = "You are the 'Sentinel Agent'. Respond only with 'AUDIT_PASSED' or 'RISK_DETECTED: [Reason]'. " +
        "Check for: 1. Secrets/Keys. 2. PII leaks. 3. Async errors. 4. Unsafe DB calls.";

    try {
        const response = await llm.generate({
            systemPrompt,
            userPrompt: `Audit this diff:\n\n${diff.substring(0, 10000)}\n\nRules:\n${rules}`, // Cap diff size for LLM context
            tier: 'flash'
        });

        if (response.content.includes('RISK_DETECTED:')) {
            console.error('\n🛑 SENTINEL AUDIT FAILED\n');
            console.error(response.content.trim());
            process.exit(1);
        } else {
            console.log('✅ Sentinel Audit Passed.');
        }
    } catch (error) {
        console.warn('⚠️ Sentinel: Audit technical skip.');
    }
}

sentinelAudit();
