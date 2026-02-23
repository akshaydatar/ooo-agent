import { ResponseService } from '../src/modules/response/service';

async function main() {
    const service = new ResponseService();

    const params = {
        userId: 'test-user-id',
        id: 'msg_123',
        sender: 'colleague@example.com',
        subject: 'Project Gemini Sync',
        content: 'When can we sync?',
        receivedAt: new Date()
    };

    console.log("Testing Response Generation...");
    const draft = await service.generateDraft(params);

    console.log("---------------------------------------------------");
    console.log(`To: ${draft.recipient}`);
    console.log(`Subject: ${draft.subject}`);
    console.log(`Body:\n${draft.body}`);
    console.log("---------------------------------------------------");
}

main().catch(console.error);
