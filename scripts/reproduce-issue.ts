import { RoutingService } from '../src/modules/routing/service';
import { prisma } from '../src/lib/db';

async function main() {
    const service = new RoutingService();
    const userId = "cmm11rxf60000obpjw2py5jn4";
    const topic = "foo";

    console.log(`--- Testing Routing for topic: "${topic}" ---`);

    // Check what we have in DB
    const maps = await prisma.coverageMap.findMany({ where: { userId } });
    console.log("Current Coverage Maps in DB:", JSON.stringify(maps, null, 2));

    const recommendation = await service.resolveCoverage(userId, topic);

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

main().catch(console.error).finally(() => prisma.$disconnect());
