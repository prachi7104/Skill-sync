import postgres from 'postgres';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
    console.error('❌ DATABASE_URL is invalid or missing.');
    process.exit(1);
}

const sql = postgres(connectionString);

async function enableVector() {
    try {
        console.log('🔌 Connecting to database...');
        console.log('🔧 Enabling "vector" extension...');
        await sql`CREATE EXTENSION IF NOT EXISTS vector;`;
        console.log('✅ Extension "vector" validation completed.');
    } catch (error) {
        console.error('❌ Failed to enable vector extension:', error);
        process.exit(1);
    } finally {
        await sql.end();
    }
}

enableVector();
