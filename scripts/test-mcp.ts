import { MockMCPClient } from '../src/lib/mcp/mock-adapter';
import { ContextService } from '../src/modules/context/service';
import { ResponseService } from '../src/modules/response/service';

async function main() {
    console.log('--- Testing MCP Client ---');
    const mcp = new MockMCPClient();

    // 1. Test List Tools
    const tools = await mcp.listTools();
    console.log('Available Tools:', tools.map(t => t.name));

    // 2. Test Call Tool (Gmail)
    const emails = await mcp.callTool('gmail_list_messages', { query: 'is:unread' });
    console.log('Gmail Result:', emails.content[0].text);

    console.log('\n--- Testing Context Service Integration (Drive MCP) ---');
    const contextService = new ContextService();
    // Verify it falls back to MCP when no DB items
    const results = await contextService.query({ userId: 'test-user-id', query: 'Gemini' });
    console.log('Context Query Result (should form Drive):', results);

    console.log('\n--- Testing Response Service Integration (Gmail MCP) ---');
    const responseService = new ResponseService();
    const draft = await responseService.generateDraft({
        userId: 'test-user-id',
        id: 'msg_1',
        sender: 'boss@example.com',
        subject: 'Urgent Sync',
        content: 'When are you back?',
        receivedAt: new Date()
    });
    console.log('Generated Draft (via MCP):', draft);
}

main().catch(console.error);
