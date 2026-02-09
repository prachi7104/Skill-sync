import postgres from 'postgres';
import * as dotenv from 'dotenv';

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

function section(title: string) {
    console.log('\n' + '='.repeat(72));
    log(title, 'bold');
    console.log('='.repeat(72) + '\n');
}

// ── Main ─────────────────────────────────────────────────────────────────────

async function analyzeQueries() {
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

        // Create a dummy vector for testing (384 dimensions)
        const dummyVector = JSON.stringify(Array(384).fill(0.1));


        const tests: { name: string; query: string; params?: any[] }[] = [
            {
                name: 'Student Eligibility (Batch + Branch + CGPA)',
                query: `
          EXPLAIN ANALYZE SELECT id 
          FROM students 
          WHERE batch_year = 2025 AND branch = 'CSE' AND cgpa >= 8.0
        `
            },
            {
                name: 'Ranking Leaderboard (Drive + Score)',
                query: `
          EXPLAIN ANALYZE SELECT * 
          FROM rankings 
          WHERE drive_id = '00000000-0000-0000-0000-000000000000' 
          ORDER BY match_score DESC 
          LIMIT 50
        `
            },
            {
                name: 'Vector Similarity (HNSW)',
                query: `
          EXPLAIN ANALYZE SELECT id 
          FROM students 
          ORDER BY embedding <=> $1::vector 
          LIMIT 10
        `,
                params: [dummyVector]
            },
            {
                name: 'Active Drives (Filtered + Sorted)',
                query: `
          EXPLAIN ANALYZE SELECT * 
          FROM drives 
          WHERE is_active = true 
          ORDER BY created_at DESC 
          LIMIT 20
        `
            },
            {
                name: 'Job Queue Polling',
                query: `
          EXPLAIN ANALYZE SELECT id 
          FROM jobs 
          WHERE status = 'pending' 
          ORDER BY priority DESC, created_at ASC 
          LIMIT 1
        `
            }
        ];

        section('🧪 ANALYZING QUERY PERFORMANCE');

        for (const test of tests) {
            log(`🔎 Analyzing: ${test.name}`, 'yellow');

            try {
                const result = test.params
                    ? await sql.unsafe(test.query, test.params)
                    : await sql.unsafe(test.query);

                // The result of EXPLAIN ANALYZE is usually a set of rows describing the plan
                // We want to check for "Seq Scan" (bad for large tables) vs "Index Scan" / "Bitmap Heap Scan"
                const plan = result.map(r => r['QUERY PLAN']).join('\n');

                console.log(C.cyan + plan + C.reset);

                if (plan.includes('Seq Scan') && !plan.includes('Index')) {
                    // For very small tables, Postgres might choose Seq Scan anyway, so this is just a hint
                    log('⚠️  Warning: Sequential Scan detected (could be due to empty tables)', 'yellow');
                } else if (plan.includes('Index Scan') || plan.includes('Index Only Scan') || plan.includes('Bitmap Index Scan')) {
                    log('✅ Index usage detected', 'green');
                } else {
                    log('ℹ️  Plan does not explicitly show simple Index Scan (check output)', 'blue');
                }

                console.log('-'.repeat(40));
            } catch (e) {
                log(`❌ Failed to analyze: ${e}`, 'red');
            }
        }

        log('\n✅ Query analysis complete.', 'green');

    } catch (err) {
        log('\n❌ ANALYSIS FAILED', 'red');
        console.error(err instanceof Error ? err.message : err);
        process.exit(1);
    } finally {
        await sql.end();
    }
}

analyzeQueries();
