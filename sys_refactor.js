const fs = require('fs');
const path = require('path');

function walk(dir) {
    let results = [];
    if (!fs.existsSync(dir)) return results;
    const list = fs.readdirSync(dir);
    list.forEach((file) => {
        file = path.join(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) { 
            results = results.concat(walk(file));
        } else if (file.endsWith('.tsx')) {
            results.push(file);
        }
    });
    return results;
}

const adminFiles = walk('./app/(admin)/admin');
const facultyFiles = walk('./app/(faculty)/faculty');
const allFiles = [...adminFiles, ...facultyFiles];

let changedCount = 0;
allFiles.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    let orig = content;
    
    // 3xl -> xl
    content = content.replace(/rounded-3xl/g, 'rounded-xl');
    
    // 2xl -> xl (admin/faculty only)
    content = content.replace(/rounded-2xl/g, 'rounded-xl');

    // rounded-md -> rounded-lg on cards
    // Regex matches className="..." containing bg-card and rounded-md
    // We do a simple fallback: replace rounded-md with rounded-lg only if the file is an admin/faculty file, 
    // BUT Wait, the user said "No rounded-md used for card containers... Do NOT change rounded-md on buttons"
    // So we replace rounded-md with rounded-[lg] if it's accompanied by bg-card, border, p-6, p-4, p-5, shadow-sm, bg-muted/30, etc.
    
    const lines = content.split('\n');
    for (let i = 0; i < lines.length; i++) {
        let line = lines[i];
        if (line.includes('rounded-md') && (line.includes('bg-card') || line.includes('bg-muted/30') || line.includes('shadow-sm') || line.includes('border') || line.includes('bg-background'))) {
            // But exclude buttons, inputs, etc.
            if (!line.includes('<button') && !line.includes('ring-offset') && !line.includes('focus') && !line.includes('rounded-md p-3 text-')) {
                // heuristic: if it looks like a card (p-4/p-5/p-6, shadow, bg-card)
                if (line.includes('p-4') || line.includes('p-5') || line.includes('p-6') || line.includes('p-8') || line.includes('shadow-sm') || line.includes('bg-card')) {
                   lines[i] = line.replace(/rounded-md/g, 'rounded-lg');
                }
            }
        }
    }
    content = lines.join('\n');

    if (content !== orig) {
        fs.writeFileSync(file, content);
        changedCount++;
        console.log('Updated borders:', file);
    }
});
console.log('Changed', changedCount, 'files borders');
