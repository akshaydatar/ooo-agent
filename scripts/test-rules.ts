import { RulesService } from '../src/modules/rules/service';
import { ResponseService } from '../src/modules/response/service';
import { prisma } from '../src/lib/db';

async function main() {
    console.log('--- Testing Rules Engine ---');

    const rulesService = new RulesService();
    const userId = "test-user-id";

    // 0. Ensure User Exists
    await prisma.user.upsert({
        where: { id: userId },
        update: {},
        create: {
            id: userId,
            email: "test@example.com",
            name: "Test User"
        }
    });

    // 1. Clean up old rules
    const existingRules = await rulesService.getRules(userId);
    for (const rule of existingRules) {
        await rulesService.deleteRule(rule.id, userId);
    }
    console.log('Cleaned up old rules.');

    // 2. Create a Rule
    console.log('Creating "VIP" Rule...');
    await rulesService.createRule(
        userId,
        "VIP Handling",
        { type: "subject", value: "Urgent" },
        { type: "instructions", value: "Be extremely polite and offer a cell phone number." },
        10 // High priority
    );

    // 3. Test Evaluation (Direct)
    const rule = await rulesService.evaluate(userId, {
        sender: "vip@client.com",
        subject: "Urgent: System Down",
        body: "Help!"
    });

    if (rule && rule.name === "VIP Handling") {
        console.log('✅ Rule matched correctly:', rule.name);
    } else {
        console.error('❌ Rule match failed:', rule);
    }

    // 4. Test Integration with ResponseService
    console.log('\n--- Testing ResponseService Integration ---');
    const responseService = new ResponseService();
    const draft = await responseService.generateDraft({
        userId: 'test-user-id',
        id: 'msg_test',
        sender: 'vip@client.com',
        subject: 'Urgent: Server Crash',
        content: 'Please look at this.',
        receivedAt: new Date()
    });

    console.log('Generated Draft Body:');
    console.log(draft.body);

    if (draft.body.toLowerCase().includes("polite") || draft.body.toLowerCase().includes("cell")) {
        console.log('✅ Instructions likely applied (based on mock LLM behavior).');
    }
}

main().catch(console.error);
