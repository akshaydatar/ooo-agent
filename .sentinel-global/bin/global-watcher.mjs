import chokidar from 'chokidar';
import fs from 'fs';
import path from 'path';
import { GoogleGenerativeAI } from '@google/generative-ai';

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
    console.error('❌ Global Watcher: GEMINI_API_KEY not set. Exiting.');
    process.exit(1);
}

const genAI = new GoogleGenerativeAI(apiKey);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

const watchPath = path.join(process.env.HOME, 'projects');
console.log(`👀 Global Sentinel Watcher: Monitoring ${watchPath}/**/*.ts ...`);

const watcher = chokidar.watch(`${watchPath}/**/*.ts`, {
    ignored: /node_modules|\.next|\.git/,
    persistent: true,
    ignoreInitial: true
});

watcher.on('change', async (filePath) => {
    console.log(`
📝 Change detected in ${path.basename(filePath)}. Auditing...`);
    
    const content = fs.readFileSync(filePath, 'utf8');
    if (content.length < 50) return; // Skip tiny files

    try {
        const result = await model.generateContent(`
            Audit this code for security/reliability risks:
            ${content.substring(0, 10000)}
            
            Reply ONLY with 'PASS' or 'ALERT: [Reason]'.
        `);
        const text = (await result.response).text();

        if (text.includes('ALERT:')) {
            console.error(`🚨 SENTINEL ALERT [${filePath}]:
${text.trim()}`);
        } else {
            console.log(`✅ ${path.basename(filePath)} passed background audit.`);
        }
    } catch (e) {
        // Log errors but keep watching
    }
});
