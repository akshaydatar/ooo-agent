import { ContextService } from '../src/modules/context/service';
import { prisma } from '../src/lib/db';

async function main() {
    const service = new ContextService();

    const sampleDoc = {
        id: 'test-doc-1', // ID might be ignored if DB auto-generates or we need to align
        type: 'document' as const,
        content: `
      OOO Agent Architecture
      
      The OOO Agent is a modular monolith designed to handle out-of-office responses intelligently.
      It consists of three main engines:
      1. Context Engine: Ingests data.
      2. Response Engine: Drafts emails.
      3. Routing Engine: Decides who to CC.
      
      We rely on Prisma for the database and a simple Vector Store for embeddings.
    `.repeat(10), // Repeat to ensure chunking happens
        metadata: { source: 'design_doc.md', author: 'Akshay' },
        createdAt: new Date(),
    };

    console.log("Testing ingestion...");
    await service.indexItem(sampleDoc);

    // Verify DB
    const count = await prisma.contextChunk.count();
    console.log(`Total chunks in DB: ${count}`);

    if (count > 0) {
        console.log("✅ Ingestion successful!");
    } else {
        console.error("❌ Ingestion failed: No chunks found.");
        process.exit(1);
    }
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        // Cleanup
        // await prisma.contextItem.deleteMany(); 
        await prisma.$disconnect();
    });
