import postgres from 'postgres';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
    console.error('❌ DATABASE_URL is invalid or missing.');
    process.exit(1);
}

const sql = postgres(connectionString);

async function checkTables() {
    try {
        console.log('🔌 Connecting to database...');
        const tables = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public';
    `;
        console.log('📦 Existing tables:', tables.map(t => t.table_name));

        // Check key tables
        const requiredTables = ['users', 'students', 'drives', 'rankings', 'jobs', 'sample_jds'];
        const existingTableNames = tables.map(t => t.table_name);

        const missing = requiredTables.filter(t => !existingTableNames.includes(t));

        if (missing.length === 0) {
            console.log('✅ All required tables exist.');
        } else {
            console.error('❌ Missing tables:', missing);
            process.exit(1);
        }

    } catch (error) {
        console.error('❌ Failed to check tables:', error);
        process.exit(1);
    } finally {
        await sql.end();
    }
}

checkTables();
