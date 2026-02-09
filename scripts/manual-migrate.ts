import postgres from 'postgres';
import * as dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config({ path: '.env.local' });

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
    console.error('❌ DATABASE_URL is invalid or missing.');
    process.exit(1);
}

const sql = postgres(connectionString, { max: 1 });

async function manualMigrate() {
    try {
        console.log('🔌 Connecting to database...');

        // Find the migration file
        const drizzleDir = path.join(process.cwd(), 'drizzle');
        const files = fs.readdirSync(drizzleDir).filter(f => f.endsWith('.sql'));

        if (files.length === 0) {
            console.error('❌ No migration files found in drizzle folder.');
            process.exit(1);
        }

        // Check tables once more before starting
        const tablesBefore = await sql`SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'`;
        console.log(`📊 Tables before: ${tablesBefore.map(t => t.table_name).join(', ') || 'none'}`);

        for (const file of files) {
            console.log(`📂 Processing migration file: ${file}`);
            const filePath = path.join(drizzleDir, file);
            const content = fs.readFileSync(filePath, 'utf-8');

            const statements = content.split('--> statement-breakpoint');

            for (let i = 0; i < statements.length; i++) {
                const stmt = statements[i].trim();
                if (!stmt) continue;

                console.log(`▶️ Executing statement ${i + 1}/${statements.length}...`);
                // console.log(stmt); // Uncomment to debug SQL

                try {
                    await sql.unsafe(stmt);
                } catch (err: any) {
                    if (err.code === '42710') {
                        console.warn(`⚠️ Ignoring duplicate object error: ${err.message}`);
                        continue;
                    }
                    console.error(`❌ Statement failed:\n${stmt}\nError:`, err);
                    process.exit(1);
                }
            }
        }

        console.log('✅ Manual migration completed.');

    } catch (error) {
        console.error('❌ Migration script failed:', error);
        process.exit(1);
    } finally {
        await sql.end();
    }
}

manualMigrate();
