import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import * as schema from '../lib/db/schema';
import { sampleJds } from '../lib/db/schema';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
    throw new Error("DATABASE_URL is not set");
}

const client = postgres(connectionString, { prepare: false });
const db = drizzle(client, { schema });

// Fixed IDs for idempotency
const JD_IDS = {
    GOOGLE: '11111111-1111-1111-1111-111111111111',
    AMAZON: '22222222-2222-2222-2222-222222222222',
    MICROSOFT: '33333333-3333-3333-3333-333333333333',
};

const SAMPLE_DATA = [
    {
        id: JD_IDS.GOOGLE,
        company: 'Google',
        title: 'Software Engineering Intern',
        jdText: `Role: Software Engineering Intern
Focus: DSA, backend systems, Java / Go

Minimum Qualifications:
- Currently enrolled in a Bachelor's or Master's degree in Computer Science or related field.
- Experience in one or more of: Java, C++, Python, or Go.
- Solid foundation in data structures, algorithms, and software design.

Preferred Qualifications:
- Experience with Unix/Linux environments.
- Knowledge of TCP/IP and network programming.
- Familiarity with distributed systems.

Responsibilities:
- Build and improve Google's massive-scale software systems.
- Collaborate with cross-functional teams to define and design new features.
- Write clean, testable, and efficient code.`,
        isDeletable: true,
    },
    {
        id: JD_IDS.AMAZON,
        company: 'Amazon (AWS)',
        title: 'SDE Intern',
        jdText: `Role: SDE Intern
Focus: OOP, databases, AWS, Docker

Basic Qualifications:
- Enrolled in BS/MS in Computer Science or equivalent.
- Proficiency in at least one object-oriented language (Java, C++, or C#).
- Understanding of relational databases and SQL.

Preferred Qualifications:
- Experience with AWS services (EC2, S3, Lambda).
- Familiarity with containerization (Docker, Kubernetes).
- Strong problem-solving skills and ability to learn new technologies quickly.

Responsibilities:
- Design, implement, and deploy cloud-native applications.
- Optimize performance and scalability of AWS services.
- Work in an Agile environment with CI/CD pipelines.`,
        isDeletable: true,
    },
    {
        id: JD_IDS.MICROSOFT,
        company: 'Microsoft Research',
        title: 'AI Research Intern',
        jdText: `Role: AI Research Intern
Focus: ML, DL, research, PyTorch

Qualifications:
- Ph.D. or Master's candidate in Computer Science, AI, or related field.
- Strong experience with deep learning frameworks (PyTorch, TensorFlow).
- Published papers in top-tier conferences (NeurIPS, ICML, CVPR) is a plus.

Responsibilities:
- Conduct cutting-edge research in artificial intelligence and machine learning.
- Develop novel algorithms and prototypes.
- Collaborate with researchers and engineers to transfer technology to products.
- Publish valid research findings in leading conferences.`,
        isDeletable: true,
    },
];

async function seed() {
    console.log('🌱 Starting seed: sample_jds...');

    try {
        // We use upsert (onConflictDoUpdate) to ensure idempotency.
        // If the record exists, we update it to match the seed definition.

        for (const jd of SAMPLE_DATA) {
            console.log(`   Writing: ${jd.company} - ${jd.title}`);

            await db.insert(sampleJds)
                .values(jd)
                .onConflictDoUpdate({
                    target: sampleJds.id,
                    set: jd,
                });
        }

        console.log(`✅ Successfully seeded ${SAMPLE_DATA.length} sample JDs.`);
        process.exit(0);
    } catch (error) {
        console.error('❌ Formatting failed:', error);
        process.exit(1);
    }
}

seed();
