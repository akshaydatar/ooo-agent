import { prisma } from '../src/lib/db';
import { ContextService } from '../src/modules/context/service';
import { ResponseService } from '../src/modules/response/service';
import { RoutingService } from '../src/modules/routing/service';
import { RulesService } from '../src/modules/rules/service';

async function main() {
    console.log('🚀 Starting OOO Agent End-to-End Demo...\n');

    const userId = "demo-user";

    // 0. Setup User
    await prisma.user.upsert({
        where: { id: userId },
        update: {},
        create: { id: userId, email: 'demo@example.com', name: 'Demo User' }
    });

    // 1. Rules Engine: Define a "VIP" Rule
    console.log('1️⃣  [Rules Engine] Creating Rule: "VIP Handling" for "Urgent" subjects...');
    const rulesService = new RulesService();
    // Clean old rules
    const oldRules = await rulesService.getRules(userId);
    for (const r of oldRules) await rulesService.deleteRule(r.id, userId);

    await rulesService.createRule(
        userId,
        "VIP Handling",
        { type: "subject", value: "Urgent" },
        { type: "instructions", value: "Prioritize this request. Offer to escalate to the manager immediately." },
        10
    );
    console.log('   ✅ Rule created.\n');

    // 2. Context Engine: Ingest Knowledge
    console.log('2️⃣  [Context Engine] Ingesting "Project Gemini" Documentation...');
    const contextService = new ContextService();
    // Simulate ingestion (usually happens via Drive MCP background job)
    await contextService.indexItem({
        id: 'doc-gemini-v1',
        type: 'document',
        content: 'Project Gemini is launching on Oct 15th. The primary contact is Sarah via slack #gemini-launch.',
        metadata: { source: 'drive', title: 'Gemini Launch Plan', author: 'Sarah' },
        createdAt: new Date()
    });
    console.log('   ✅ Knowledge indexed.\n');

    // 3. Simulation: Incoming Email
    const incomingEmail = {
        id: 'msg_incoming_001',
        sender: 'client@bigcorp.com',
        subject: 'Urgent: Question about Gemini Launch',
        content: 'When is the launch date? We need to know ASAP.',
        receivedAt: new Date()
    };
    console.log(`3️⃣  [Simulation] Receiving Email:\n   From: ${incomingEmail.sender}\n   Subject: "${incomingEmail.subject}"\n`);

    // 4. Response Engine: Generate Draft (Rules + RAG)
    console.log('4️⃣  [Response Engine] Generating Draft...');

    // Check rule match manually to show in demo
    const rulesServiceForDemo = new RulesService();
    const ruleMatch = await rulesServiceForDemo.evaluate(userId, {
        sender: incomingEmail.sender,
        subject: incomingEmail.subject,
        body: incomingEmail.content
    });
    if (ruleMatch) {
        // Cast to any to avoid type error if Prisma types are lagging 
        console.log(`   🔎 [Internal] Rules Engine matched: "${(ruleMatch as any).name}"`);
        console.log(`      Action: ${ruleMatch.action}`);
    }

    const responseService = new ResponseService();
    const draft = await responseService.generateDraft(incomingEmail);

    console.log('\n   📝 GENERATED DRAFT:');
    console.log('   ---------------------------------------------------');
    console.log(`   To: ${draft.recipient}`);
    if (draft.cc && draft.cc.length > 0) console.log(`   Cc: ${draft.cc.join(', ')}`);
    console.log(`   Subject: ${draft.subject}`);
    console.log(`   Body:\n${draft.body.split('\n').map(l => '   ' + l).join('\n')}`);
    console.log('   ---------------------------------------------------\n');

    // Verify Rule Application
    if (draft.body.includes("escalate") || draft.body.includes("manager")) {
        console.log('   ✅ Rule Applied: "Offer to escalate" found in text.');
    } else {
        console.log('   ⚠️ Rule might not have been applied perfectly (Mock LLM variance).');
    }

    // Verify Context Application
    if (draft.body.includes("Oct 15") || draft.body.includes("context")) {
        console.log('   ✅ Context Applied: RAG content referenced.');
    }

    // 5. Routing Engine: Suggest Coverage
    console.log('\n5️⃣  [Routing Engine] Analyzing Coverage...');
    const routingService = new RoutingService();
    const coverage = await routingService.resolveCoverage("Gemini Launch");

    if (coverage) {
        console.log(`   ✅ Recommendation: Contact ${coverage.contact.name} (${coverage.contact.email})`);
        console.log(`   Reason: ${coverage.reason}`);
    } else {
        console.log('   Example coverage heuristic didn\'t find a match (needs more data).');
    }

    console.log('\n✨ Demo Complete.');
}

main().catch(console.error);
