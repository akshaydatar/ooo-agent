import { ContextService } from '../src/modules/context/service';
import { prisma } from '../src/lib/db';

async function main() {
    console.log('--- Testing Real RAG with Gemini Embeddings ---');

    if (!process.env.GEMINI_API_KEY) {
        console.warn("⚠️ No GEMINI_API_KEY found. This test might fail or use mock if fallback logic triggered.");
    }

    const service = new ContextService();

    // 1. Clear previous test data (optional, but good for clean state)
    // await prisma.contextChunk.deleteMany({});
    // await prisma.contextItem.deleteMany({});

    // 0. Test Generation Connectivity
    console.log('0. Testing Generation (gemini-1.5-flash)...');
    try {
        const { GoogleGenerativeAI } = require("@google/generative-ai");
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const result = await model.generateContent("Hello via API");
        console.log("   ✅ Generation success:", result.response.text());
    } catch (e) {
        console.error("   ❌ Generation failed:", e);
    }

    // 2. Index Documents with distinct meanings
    console.log('1. Indexing knowledge...');

    await service.indexItem({
        id: 'doc-project-alpha',
        type: 'document',
        content: 'Project Alpha is scheduled to launch on October 15th. lead is Sarah.',
        metadata: { source: 'test' },
        createdAt: new Date()
    });

    await service.indexItem({
        id: 'doc-cafeteria',
        type: 'document',
        content: 'The cafeteria menu for today includes pizza, salad, and sushi.',
        metadata: { source: 'test' },
        createdAt: new Date()
    });

    console.log('   ✅ Indexed 2 documents.');

    // 3. Query: SEMANTIC match, not keyword match
    const query = "When do we go live?";
    console.log(`\n2. Querying: "${query}"`);
    console.log('   (Note: "go live" is semantically similar to "launch", but no keyword overlap)');

    const results = await service.query({ query });

    console.log('\n3. Results:');
    results.forEach((r, i) => {
        console.log(`   [${i + 1}] ${r.content} (Score/Metadata: ${JSON.stringify(r.metadata)})`);
    });

    // Verification
    const bestMatch = results[0];
    if (bestMatch && bestMatch.content.includes('Project Alpha')) {
        console.log('\n✅ PASS: Semantic search found the launch date!');
    } else {
        console.error('\n❌ FAIL: Did not find Project Alpha as top result.');
    }
}

main().catch(console.error);
