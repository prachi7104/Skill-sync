import postgres from 'postgres';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
    console.error('❌ DATABASE_URL is invalid or missing.');
    process.exit(1);
}

const sql = postgres(connectionString);

async function testVectorCreation() {
    try {
        console.log('🔌 Connecting to database...');

        // Cleanup previous run
        await sql`DROP TABLE IF EXISTS test_vector_table;`;

        console.log('🔨 Creating table with vector column...');
        // Try simply 'vector(768)' first
        await sql`CREATE TABLE test_vector_table (id serial primary key, embedding vector(768));`;

        console.log('✅ Success! Created table with vector(768).');

        await sql`DROP TABLE test_vector_table;`;

    } catch (error) {
        console.error('❌ Failed to create vector table:', error);

        try {
            console.log('🔄 Retrying with extensions.vector(768)...');
            await sql`CREATE TABLE test_vector_table (id serial primary key, embedding extensions.vector(768));`;
            console.log('✅ Success! Created with extensions.vector(768).');
            await sql`DROP TABLE test_vector_table;`;
        } catch (error2) {
            console.error('❌ Failed again:', error2);
        }

    } finally {
        await sql.end();
    }
}

testVectorCreation();
