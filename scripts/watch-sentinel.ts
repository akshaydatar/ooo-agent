import chokidar from 'chokidar';
import * as fs from 'fs';
import { LLMProviderFactory } from '../src/lib/llm';

const llm = LLMProviderFactory.getProvider();

console.log('👀 Sentinel Watcher: Active and monitoring src/ for changes...');

const watcher = chokidar.watch('src/**/*.ts', {
    persistent: true,
    ignoreInitial: true
});

watcher.on('change', async (filePath) => {
    console.log(`
📝 File changed: ${filePath}. Commencing instant audit...`);
    
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Quick triage: Only audit if file is > 10 lines (avoid noise on small edits)
    if (content.split('
').length < 5) return;

    const systemPrompt = "You are the 'Sentinel Real-time Auditor'. " +
        "Audit the provided code for security risks (leaks) and reliability issues. " +
        "If it looks safe, reply with 'PASS'. If risks are found, reply with 'ALERT: [Reason]'.";

    try {
        const response = await llm.generate({
            systemPrompt,
            userPrompt: `Code from ${filePath}:

${content}`,
            tier: 'flash'
        });

        if (response.content.includes('ALERT:')) {
            console.error(`
🚨 SENTINEL ALERT in ${filePath}:
${response.content.trim()}
`);
        } else {
            console.log(`✅ ${filePath} passed background audit.`);
        }
    } catch (err) {
        // Silently fail in watcher to avoid crashing dev experience
    }
});
