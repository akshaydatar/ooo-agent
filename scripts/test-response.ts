import { ResponseService } from '../src/modules/response/service';
import { prisma } from '../src/lib/db';

async function main() {
    const service = new ResponseService();
    const userId = "cmm11rxf60000obpjw2py5jn4";

    const params = {
        userId,
        id: 'msg_123',
        sender: 'colleague@example.com',
        subject: 'Inquiry about foo',
        content: 'Hi, I have a question about foo.',
        receivedAt: new Date()
    };

    console.log("Testing Response Generation for 'foo'...");
    const draft = await service.generateDraft(params);

    console.log("---------------------------------------------------");
    console.log(`To: ${draft.recipient}`);
    console.log(`Subject: ${draft.subject}`);
    console.log(`CC: ${draft.cc.join(', ')}`);
    console.log(`Body:\n${draft.body}`);
    console.log("---------------------------------------------------");
}

main().catch(console.error).finally(() => prisma.$disconnect());
