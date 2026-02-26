// 1. Bypass env validation and mock server-only deps
process.env.NODE_ENV = "test";

import * as Module from 'module';
const originalRequire = (Module as any).prototype.require;
(Module as any).prototype.require = function (path: string) {
    if (path === 'react') {
        return { cache: (fn: any) => fn };
    }
    if (path === 'next/headers') {
        return { headers: () => new Map() };
    }
    if (path === 'server-only') {
        return {};
    }
    return originalRequire.apply(this, arguments);
};

// 2. Load logic
async function runTest() {
    const dotenv = await import("dotenv");
    const { resolve } = await import("path");
    dotenv.config({ path: resolve(process.cwd(), ".env.local") });

    const { generateEmbedding } = await import("../lib/embeddings/generate");

    console.log("--- Testing Embedding Generation ---");

    // 1. Test Gemini (assuming key is valid)
    console.log("\n[1] Testing Gemini Primary...");
    try {
        const geminiVector = await generateEmbedding("This is a test profile for Gemini.");
        console.log(`✅ Gemini Success! Dimensions: ${geminiVector.length}`);
        if (geminiVector.length !== 768) {
            console.error(`❌ Dimension mismatch! Expected 768, got ${geminiVector.length}`);
        }
    } catch (err: any) {
        console.warn(`⚠️ Gemini Test failed (expected if key/quota issue): ${err.message}`);
    }

    // 2. Test Xenova Fallback
    console.log("\n[2] Testing Xenova Fallback (Forced via internal failure simulation)...");
    // Force gemini error by temporarily setting an invalid key format in env
    const originalKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
    process.env.GOOGLE_GENERATIVE_AI_API_KEY = "INVALID_KEY";

    try {
        const xenovaVector = await generateEmbedding("This is a test profile for Xenova.");
        console.log(`✅ Xenova Success! Dimensions: ${xenovaVector.length}`);
        if (xenovaVector.length !== 768) {
            console.error(`❌ Dimension mismatch! Expected 768, got ${xenovaVector.length}`);
        }

        const zeroCount = xenovaVector.slice(384).filter(v => v === 0).length;
        console.log(`   Padding check: found ${zeroCount} zeros at the end (expected 384)`);

    } catch (err: any) {
        console.error(`❌ Xenova Test failed: ${err.message}`);
    } finally {
        process.env.GOOGLE_GENERATIVE_AI_API_KEY = originalKey;
    }

    console.log("\n--- Test Complete ---");
}

runTest().catch(console.error);
