import postgres from 'postgres';
import * as dotenv from 'dotenv';
import { readFileSync } from 'fs';
import { join } from 'path';

dotenv.config({ path: '.env.local' });

// ── Helpers ──────────────────────────────────────────────────────────────────

const C = {
    reset: '\x1b[0m',
    bold: '\x1b[1m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m',
} as const;

function log(msg: string, color: keyof typeof C = 'reset') {
    console.log(`${C[color]}${msg}${C.reset}`);
}

// ── Main ─────────────────────────────────────────────────────────────────────

async function applyIndexes() {
    const start = Date.now();

    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
        log('❌ DATABASE_URL not found in .env.local', 'red');
        process.exit(1);
    }

    log('🔐 Connecting to database...', 'cyan');
    const sql = postgres(databaseUrl, { max: 1, onnotice: () => { } });

    try {
        await sql`SELECT 1`;
        log('✅ Database connection established', 'green');

        const sqlPath = join(process.cwd(), 'scripts', 'setup-indexes.sql');
        log(`📄 Reading: ${sqlPath}`, 'cyan');
        const sqlContent = readFileSync(sqlPath, 'utf-8');

        log('⚙️  Applying indexes...', 'yellow');

        // Split statements to provide per-index feedback? 
        // Usually cleaner to execute the whole block unless we want detailed progress.
        // For indexes, creating them might take time, so running one by one is better UX.

        const statements = sqlContent
            .split(';')
            .map(s => s.trim())
            .filter(s => s.length > 0);

        for (const stmt of statements) {
            // Extract index name for logging if possible
            const match = stmt.match(/CREATE INDEX IF NOT EXISTS "([^"]+)"/i);
            const idxName = match ? match[1] : 'index';

            process.stdout.write(`${C.blue}   • Creating ${idxName}... ${C.reset}`);
            await sql.unsafe(stmt);
            console.log(`${C.green}Done${C.reset}`);
        }

        log('\n🎉 All indexes applied successfully!', 'green');
        log(`⏱️  Completed in ${Date.now() - start}ms`, 'blue');

    } catch (err) {
        log('\n❌ INDEX SETUP FAILED', 'red');
        console.error(err instanceof Error ? err.message : err);
        process.exit(1);
    } finally {
        await sql.end();
    }
}

applyIndexes();
