const fs = require('fs');

try {
    const content = fs.readFileSync('tsc_output.txt', 'utf16le'); // Try utf16le as indicated by previous error
    console.log(content);
} catch (err) {
    console.error(err);
}
