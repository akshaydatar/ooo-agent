import * as fs from 'fs';
import * as path from 'path';
import { LLMProviderFactory } from '../src/lib/llm';

async function fullSystemAudit() {
    console.log('🏛️  Sentinel: Commencing Full System Audit...');
    const llm = LLMProviderFactory.getProvider();

    const srcDir = path.join(process.cwd(), 'src');
    
    // 1. Collect all critical files
    const getFiles = (dir: string): string[] => {
        let results: string[] = [];
        const list = fs.readdirSync(dir);
        list.forEach(file => {
            const filePath = path.join(dir, file);
            const stat = fs.statSync(filePath);
            if (stat && stat.isDirectory()) {
                results = results.concat(getFiles(filePath));
            } else if (filePath.endsWith('.ts') || filePath.endsWith('.tsx')) {
                results.push(filePath);
            }
        });
        return results;
    };

    const allFiles = getFiles(srcDir);
    console.log(`🔍 Scanning ${allFiles.length} files...`);

    // 2. Load rules
    const securityRules = fs.readFileSync('.agent/rules/security_reliability.md', 'utf8');

    // 3. Perform Batch Audits
    for (const file of allFiles) {
        const content = fs.readFileSync(file, 'utf8');
        
        // We only audit larger files for deep analysis in the full audit
        if (content.length < 100) continue;

        const response = await llm.generate({
            systemPrompt: `Deep Audit Mode. Rules: ${securityRules}`,
            userPrompt: `Perform a comprehensive security audit of this file: ${file}

Content:
${content}`,
            tier: 'pro' // Use PRO for full system audits (once a week / before release)
        });

        if (response.content.includes('RISK') || response.content.includes('ALERT')) {
            console.log(`
❌ ISSUE FOUND in ${file}:`);
            console.log(response.content.trim());
        }
    }

    console.log('
✨ Full System Audit Complete.');
}

fullSystemAudit();
