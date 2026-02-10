const { spawn } = require('child_process');
const http = require('http');

async function runTest() {
    console.log("🚀 Starting Onboarding Performance Test...");
    console.log("DO NOT RUN THIS IN PRODUCTION. Ensure local DB is running.");

    // 1. Start Dev Server
    console.log("📦 Spawning 'npm run dev'...");

    // Cross-platform spawn
    const npmCmd = process.platform === 'win32' ? 'npm.cmd' : 'npm';
    const server = spawn(npmCmd, ['run', 'dev'], {
        shell: true,
        stdio: ['ignore', 'pipe', 'pipe'] // Capture stdout/stderr
    });

    let isReady = false;
    let targetPort = null;
    let dbQueries = 0;
    let sessionChecks = 0;
    let requestCount = 0;

    server.stdout.on('data', (data) => {
        const lines = data.toString().split('\n');
        lines.forEach(line => {
            // console.log(`[SERVER] ${line}`); // Verbose debugging

            // Detect Port
            const portMatch = line.match(/http:\/\/localhost:(\d+)/);
            if (portMatch) {
                targetPort = parseInt(portMatch[1]);
                console.log(`🎯 Detected Server Port: ${targetPort}`);
            }

            if (line.includes("Ready in")) {
                if (!isReady) {
                    isReady = true;
                    console.log("✅ Server Ready. Starting Simulation...");
                    triggerSimulation();
                }
            }
            if (line.includes("Address already in use")) {
                console.error("❌ Port busy. Kill other servers first.");
                cleanup();
            }

            // Count Metrics
            if (line.includes("[DB] Query executed")) {
                dbQueries++;
            }
            if (line.includes("[AUTH] Session check")) {
                sessionChecks++;
            }
            if (line.includes("[REQ]")) {
                requestCount++;
            }
        });
    });

    server.stderr.on('data', (data) => {
        // console.error(`[ERR] ${data}`);
    });

    server.on('close', (code) => {
        console.log(`Server process exited with code ${code}`);
    });

    // 2. Trigger Simulation
    async function triggerSimulation() {
        if (!targetPort) {
            // Fallback if we missed the log or it didn't print
            console.log("⚠️ Port not detected from logs, defaulting to 3001");
            targetPort = 3001;
        }

        // Wait a bit for server to settle
        await new Promise(r => setTimeout(r, 2000));

        const startTime = Date.now();
        console.log(`⚡ Sending request to http://localhost:${targetPort}/api/test/simulate-onboarding...`);

        try {
            const options = {
                hostname: 'localhost',
                port: targetPort,
                path: '/api/test/simulate-onboarding',
                method: 'GET',
                headers: {
                    'x-test-user': 'true'
                }
            };

            const req = http.request(options, (res) => {
                let data = '';
                res.on('data', (chunk) => data += chunk);
                res.on('end', () => {
                    const duration = Date.now() - startTime;
                    console.log("\n📊 --- RESULTS ---");
                    console.log("Note: These metrics track the activity TRIGGERED by the simulation request.");
                    console.log(`Status: ${res.statusCode}`);

                    if (res.statusCode !== 200) {
                        console.log("Response Body:", data);
                    } else {
                        try {
                            const json = JSON.parse(data);
                            console.log(`Server Duration: ${json.duration}ms`);
                        } catch (e) {
                            console.log("Could not parse server duration.");
                        }
                    }
                    console.log(`Client Duration: ${duration}ms`);
                    console.log(`Total DB Queries: ${dbQueries}`);
                    console.log(`Total Session Checks: ${sessionChecks}`);
                    console.log(`Total Requests (Middleware logged): ${requestCount}`);
                    console.log("-------------------");

                    cleanup();
                });
            });

            req.on('error', (e) => {
                console.error(`Problem with request: ${e.message}`);
                cleanup();
            });

            req.end();

        } catch (e) {
            console.error("Failed to trigger:", e);
            cleanup();
        }
    }

    function cleanup() {
        console.log("🛑 Stopping server...");
        if (process.platform === 'win32') {
            spawn("taskkill", ["/pid", server.pid, '/f', '/t']);
        } else {
            server.kill();
        }
        process.exit(0);
    }
}

runTest();
