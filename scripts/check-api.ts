
const fetch = require('node-fetch'); // or native fetch in Node 18+

async function check() {
    try {
        console.log("Fetching http://localhost:3000/api/db-test...");
        const res = await fetch("http://localhost:3000/api/db-test", {
            redirect: 'manual'
        });
        console.log("Status:", res.status);
        console.log("Headers:", res.headers.raw());
        if (res.status === 200) {
            const text = await res.text();
            console.log("Body:", text.substring(0, 500));
        }
    } catch (e) {
        console.error("Error:", e.message);
    }
}

check();
