const fs = require('fs');

function refactorFile(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');

    // Container / Drop shadows
    content = content.replace(/shadow-\[.*?\]/g, 'shadow-sm');
    content = content.replace(/shadow-2xl/g, 'shadow-sm');
    content = content.replace(/drop-shadow-sm/g, '');
    
    // Backgrounds
    content = content.replace(/bg-slate-900(?:\/50|\/60|\/80)?/g, 'bg-card');
    content = content.replace(/bg-slate-950(?:\/40|\/50)?/g, 'bg-muted/20');
    content = content.replace(/bg-slate-800(?:\/50)?/g, 'bg-muted/50');
    
    // Borders
    content = content.replace(/border-white\/[0-9]+/g, 'border-border');
    content = content.replace(/border-slate-[678]00(?:\/50)?/g, 'border-border');
    
    // Border Radius
    content = content.replace(/rounded-(?:2xl|3xl|xl)/g, 'rounded-md');
    content = content.replace(/rounded-\[(?:\d+(?:\.\d+)?rem)\]/g, 'rounded-md');
    
    // Typography Colors
    content = content.replace(/text-white/g, 'text-foreground');
    content = content.replace(/text-slate-[12]00/g, 'text-foreground');
    content = content.replace(/text-slate-[3456]00/g, 'text-muted-foreground');
    
    // Indigo -> Primary
    content = content.replace(/bg-indigo-[56]00/g, 'bg-primary');
    content = content.replace(/hover:bg-indigo-500/g, 'hover:bg-primary/90');
    content = content.replace(/text-indigo-[34]00/g, 'text-primary');
    content = content.replace(/hover:text-indigo-300/g, 'hover:text-primary/80');

    // Dialog & Inputs & General Fixes
    content = content.replace(/bg-background border-input border-slate-800/g, 'bg-background border-input');
    content = content.replace(/bg-background border-input border-slate-700/g, 'bg-background border-input');
    content = content.replace(/focus:ring-indigo-500/g, 'focus:ring-primary');

    fs.writeFileSync(filePath, content, 'utf8');
    console.log("Refactored " + filePath);
}

const files = [
    "app/(student)/student/profile/profile-view.tsx",
    "app/(student)/student/drives/page.tsx",
    "app/(student)/student/drives/[driveId]/ranking/page.tsx",
    "app/(student)/student/onboarding/page.tsx",
    "app/(student)/student/onboarding/layout.tsx",
    "app/(student)/student/sandbox/page.tsx",
    "app/(student)/student/sandbox/detailed/page.tsx",
    "app/(student)/student/career-coach/page.tsx",
    "app/(student)/student/leaderboard/page.tsx",
    "app/(student)/student/companies/page.tsx",
    "app/(student)/student/companies/submit/page.tsx",
    "app/(student)/student/companies/[company]/page.tsx",
    "app/(student)/student/resources/page.tsx",
    "app/(student)/student/settings/page.tsx"
];

for (const file of files) {
    if (fs.existsSync(file)) {
        refactorFile(file);
    } else {
        console.log("Not found: " + file);
    }
}
