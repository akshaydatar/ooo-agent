import { prisma } from '../src/lib/db';

async function main() {
    console.log('1. Setting up Supabase Vector Store (documents table & match_documents function)...');

    try {
        await prisma.$executeRawUnsafe(`CREATE EXTENSION IF NOT EXISTS vector;`);

        // Ensure the table exists
        await prisma.$executeRawUnsafe(`
            CREATE TABLE IF NOT EXISTS documents (
              id bigserial primary key,
              content text,
              metadata jsonb,
              embedding vector(384)
            );
        `);

        // Create the search function
        await prisma.$executeRawUnsafe(`
            CREATE OR REPLACE FUNCTION match_documents (
              query_embedding vector(384),
              match_threshold float,
              match_count int
            )
            RETURNS TABLE (
              id bigint,
              content text,
              metadata jsonb,
              similarity float
            )
            LANGUAGE SQL STABLE
            AS $$
              SELECT
                documents.id,
                documents.content,
                documents.metadata,
                1 - (documents.embedding <=> query_embedding) AS similarity
              FROM documents
              WHERE 1 - (documents.embedding <=> query_embedding) > match_threshold
              ORDER BY similarity DESC
              LIMIT match_count;
            $$;
        `);
        console.log('Successfully provisioned `documents` table and `match_documents` vector search function!');
    } catch (e: any) {
        console.error('Error creating vector function / table:', e.message);
    }
}

main().finally(() => prisma.$disconnect());
