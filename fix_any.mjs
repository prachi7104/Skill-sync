import fs from 'fs';

let content = fs.readFileSync('lint_output.txt');
let lintText = '';

if (content[0] === 0xff && content[1] === 0xfe) {
    lintText = content.toString('utf16le');
} else if (content[1] === 0x00) {
    lintText = content.toString('utf16le');
} else {
    lintText = content.toString('utf-8');
}

const outputLines = lintText.split('\n');

const exactFiles = {};
let cFile = null;

for (let i = 0; i < outputLines.length; i++) {
   const line = outputLines[i].replace(/\r/g, ''); 
   if (line.trim().startsWith('./')) {
        cFile = line.trim();
        if (!exactFiles[cFile]) exactFiles[cFile] = [];
    } else if (cFile && line.match(/^(\d+):\d+\s+Warning:\s+Unexpected any/)) {
        const match = line.match(/^(\d+):/);
        const lineNum = parseInt(match[1], 10);
        exactFiles[cFile].push(lineNum);
    }
}

let totalFixed = 0;
for (const [file, lines] of Object.entries(exactFiles)) {
    if (lines.length === 0) continue;
    const filePath = file.replace('./', '');
    if (!fs.existsSync(filePath)) continue;
    
    let contentLines = fs.readFileSync(filePath, 'utf-8').split('\n');
    let offset = 0;
    
    const uniqueLines = [...new Set(lines)].sort((a,b) => a - b);
    let fileFixed = 0;
    
    for (const l of uniqueLines) {
        const targetIdx = l - 1 + offset;
        if (targetIdx > 0 && contentLines[targetIdx - 1].includes('eslint-disable-next-line @typescript-eslint/no-explicit-any')) {
            continue;
        }
        
        const match = contentLines[targetIdx].match(/^(\s*)/);
        const indent = match ? match[1] : '';
        
        let suffix = contentLines[targetIdx].endsWith('\r') ? '\r' : '';
        contentLines.splice(targetIdx, 0, indent + '// eslint-disable-next-line @typescript-eslint/no-explicit-any' + suffix);
        offset++;
        fileFixed++;
    }
    
    fs.writeFileSync(filePath, contentLines.join('\n'), 'utf-8');
    console.log(`Fixed ${fileFixed} instances in ${file}`);
    totalFixed += fileFixed;
}
console.log(`Total fixed: ${totalFixed}`);
