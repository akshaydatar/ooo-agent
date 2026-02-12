import { RoutingService } from '../src/modules/routing/service';

async function main() {
    const service = new RoutingService();

    const topic = "Project Gemini";
    console.log(`Testing Routing for topic: "${topic}"...`);

    const recommendation = await service.resolveCoverage(topic);

    if (recommendation) {
        console.log("✅ Recommendation Found:");
        console.log(`   - Name: ${recommendation.contact.name}`);
        console.log(`   - Email: ${recommendation.contact.email}`);
        console.log(`   - Reason: ${recommendation.reason}`);
        console.log(`   - Confidence: ${(recommendation.confidence * 100).toFixed(0)}%`);
    } else {
        console.log("❌ No coverage recommendation found.");
    }
}

main().catch(console.error);
