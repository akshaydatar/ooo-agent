import { prisma } from '../src/lib/db';
import { ResponseService } from '../src/modules/response/service';

async function main() {
    console.log('--- Testing Fallback Logic ---');

    const userId = "test-user-id";

    // 1. Setup User with Manager and invalid coverage plan that might cause issues? 
    // Actually we just want to verify the fallback logic works when generate throws.
    // We will update the user to have manager info.
    console.log('1. Setting up user with manager info...');
    await prisma.user.upsert({
        where: { id: userId },
        update: {
            managerName: 'Big Boss',
            managerEmail: 'boss@company.com',
            coveragePlanLink: 'http://wiki/coverage'
        },
        create: {
            id: userId,
            email: 'test@example.com',
            managerName: 'Big Boss',
            managerEmail: 'boss@company.com',
            coveragePlanLink: 'http://wiki/coverage'
        }
    });

    // 2. Mock the LLM to throw an error
    // Since ResponseService uses a private/internal LLM instance we can't easily mock it from outside 
    // WITHOUT modifying the service or using dependency injection.
    // However, for this test, let's force a failure by passing a param that might crash something?
    // Or we can rely on the fact we can't mock the internal LLM easily and instead REFACTOR ResponseService to allow injection.

    // REFACTOR DECISION: To make this testable, we should allow injecting dependencies into ResponseService.
    console.log('   (Note: To properly test fallback, we might need to simulate an LLM failure)');

    // For now, let's try to verify the HAPPY path of the fallback by sub-classing or mocking
    // But since we can't change the code from here easily, let's modify ResponseService check.

    // actually, let's just trigger the fallback by causing an error. 
    // We can pass a `null` sender or something if types allow? No strict types.
    // We can simulate an error by temporarily modifying the code or using a mock.

    // Alternative: We can import the class and patch the `llm.generate` method if we can access it.
    // But it's private.

    console.log('2. Simulating LLM Failure (by patching prototype if possible or assuming valid setup)...');

    const service = new ResponseService();

    // Force the internal LLM to throw
    // @ts-ignore
    service.llm.generate = async () => {
        throw new Error("Simulated LLM Crash");
    };

    try {
        console.log('3. Calling generateDraft...');
        const draft = await service.generateDraft({
            userId: 'mock-user-id',
            id: 'mock-123',
            receivedAt: new Date(),
            sender: 'client@fail.com',
            subject: 'Important Request',
            content: 'Hello?',
            id: 'test-id-123',
            receivedAt: new Date()
        });

        console.log('4. Result received:');
        console.log('   Subject:', draft.subject);
        console.log('   Body:', draft.body);

        if (draft.body.includes('Big Boss') && draft.body.includes('Fallback Mode')) {
            console.log('   ✅ Fallback successful! Manager info present.');
        } else {
            console.error('   ❌ Fallback did not trigger or returned wrong content.');
        }

    } catch (e) {
        console.error('   ❌ Exception leaked out:', e);
    }
}

main().catch(console.error);
