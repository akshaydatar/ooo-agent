import { TriageService } from '../src/modules/response/triage-service';
import { LocalEmbeddingService } from '../src/lib/local-embeddings';

async function verify() {
    console.log('🧪 Verifying Slim Architecture Setup...');

    // 1. Test Triage (Actionable)
    console.log('\n1️⃣  Testing Triage: Actionable Email');
    const actionable = TriageService.analyze('boss@company.com', 'Project Update', 'Hi, can you give me an update on the Gemini project?');
    console.log(`   Result: ${actionable.actionable ? '✅ SUCCESS (Actionable)' : '❌ FAILED'}`);

    // 2. Test Triage (Noise)
    console.log('\n2️⃣  Testing Triage: Noise Email (Should be skipped)');
    const noise = TriageService.analyze('newsletter@spam.com', 'Weekly Newsletter', 'Click here to unsubscribe from our weekly marketing digest.');
    console.log(`   Result: ${!noise.actionable ? '✅ SUCCESS (Skipped)' : '❌ FAILED'}`);
    console.log(`   Reason: ${noise.reason}`);

    // 3. Test Embeddings (Remote/Local)
    console.log('\n3️⃣  Testing Embedding Generation...');
    if (process.env.REMOTE_EMBEDDING_URL) {
        console.log(`   Using Remote URL: ${process.env.REMOTE_EMBEDDING_URL}`);
    } else {
        console.log('   Using Local Transformers.js...');
    }
    
    try {
        const start = Date.now();
        const embedding = await LocalEmbeddingService.embed("Testing the embedding service.");
        const duration = Date.now() - start;
        console.log(`   ✅ SUCCESS: Generated vector of length ${embedding.length} in ${duration}ms`);
    } catch (err) {
        console.error('   ❌ Embedding Failed:', err);
    }

    console.log('\n✨ Verification Complete.');
}

verify().catch(console.error);
