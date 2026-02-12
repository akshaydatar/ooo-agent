import { StdioMCPClient } from '../src/lib/mcp/stdio-client';
import { loadMCPConfig } from '../src/lib/mcp/config';

async function main() {
    console.log('--- Testing Real MCP Client ---');

    console.log('1. Loading Config...');
    const config = loadMCPConfig();
    console.log('   Found servers:', config.servers.length);

    if (config.servers.length === 0) {
        console.log('   ⚠️ No servers configured. Test ends here (Mock mode active in app).');
        console.log('   To test real MCP, ensure loadMCPConfig returns a server.');
        return;
    }

    const serverConfig = config.servers[0];
    console.log(`2. Connecting to ${serverConfig.name} (${serverConfig.command})...`);

    const client = new StdioMCPClient(serverConfig);

    try {
        await client.connect();
        console.log('   ✅ Connected!');

        console.log('3. Listing Tools...');
        const tools = await client.listTools();
        console.log(`   Found ${tools.length} tools:`, tools.map(t => t.name));

        if (tools.length > 0) {
            console.log('   (Skipping tool execution to avoid side effects)');
        }

    } catch (error) {
        console.error('   ❌ Connection failed:', error);
    } finally {
        await client.close();
    }
}

main().catch(console.error);
