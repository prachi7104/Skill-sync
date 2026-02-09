import postgres from 'postgres';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
    console.error('❌ DATABASE_URL is invalid or missing.');
    process.exit(1);
}

const sql = postgres(connectionString);

async function checkExtensions() {
    try {
        const fs = await import('fs');
        let log = '';
        log += '🔌 Connecting to database...\n';
        const extensions = await sql`
      SELECT e.extname, n.nspname AS schema_name
      FROM pg_extension e
      JOIN pg_namespace n ON e.extnamespace = n.oid;
    `;
        log += `📦 Installed extensions: ${JSON.stringify(extensions, null, 2)}\n`;

        const searchPath = await sql`SHOW search_path;`;
        log += `🔍 Current search_path: ${searchPath[0].search_path}\n`;

        fs.writeFileSync('extensions.log', log);
        console.log('Check completed. See extensions.log');

    } catch (error) {
        const fs = await import('fs');
        fs.writeFileSync('extensions.log', `❌ Failed: ${error}`);
        console.error('❌ Failed to check extensions:', error);
    } finally {
        await sql.end();
    }
}

checkExtensions();
