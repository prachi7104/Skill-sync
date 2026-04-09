const fs = require('fs');

function refactorFile(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');

    // Remove backdrop-blur-*
    content = content.replace(/backdrop-blur-(sm|md|lg|xl|2xl|3xl)/g, '');

    // Backgrounds
    content = content.replace(/bg-slate-[789]00(?:\/[0-9]+)?/g, 'bg-card');
    content = content.replace(/bg-slate-950(?:\/[0-9]+)?/g, 'bg-muted/20');
    
    // Colored backgrounds/borders/text 
    // Emerald -> success
    content = content.replace(/bg-emerald-500(?:\/[0-9]+)?/g, 'bg-success/10');
    content = content.replace(/border-emerald-500(?:\/[0-9]+)?/g, 'border-success/20');
    content = content.replace(/text-emerald-[45]00/g, 'text-success');

    // Rose -> destructive
    content = content.replace(/bg-rose-500(?:\/[0-9]+)?/g, 'bg-destructive/10');
    content = content.replace(/border-rose-500(?:\/[0-9]+)?/g, 'border-destructive/20');
    content = content.replace(/text-rose-[45]00/g, 'text-destructive');

    // Amber -> warning
    content = content.replace(/bg-amber-500(?:\/[0-9]+)?/g, 'bg-warning/10');
    content = content.replace(/border-amber-500(?:\/[0-9]+)?/g, 'border-warning/20');
    content = content.replace(/text-amber-[45]00/g, 'text-warning');

    // Borders
    content = content.replace(/border-white\/[0-9]+/g, 'border-border');
    content = content.replace(/border-slate-[6789]00(?:\/[0-9]+)?/g, 'border-border');
    
    // Border Radius (avoid rounded-full, rounded-md, rounded-sm)
    content = content.replace(/rounded-(?:2xl|3xl|xl|lg|none)/g, 'rounded-md');
    // For bracket notation like rounded-[2rem]
    content = content.replace(/rounded-\[(?:[0-9.]+(?:rem|px|%))\]/g, 'rounded-md');
    
    // Typography Colors
    content = content.replace(/text-white/g, 'text-foreground');
    content = content.replace(/text-slate-[12]00/g, 'text-foreground');
    content = content.replace(/text-slate-[3456]00/g, 'text-muted-foreground');
    
    // Indigo -> Primary
    content = content.replace(/bg-indigo-[56]00/g, 'bg-primary');
    content = content.replace(/hover:bg-indigo-500/g, 'hover:bg-primary/90');
    content = content.replace(/text-indigo-[345]00/g, 'text-primary');
    content = content.replace(/hover:text-indigo-[34]00/g, 'hover:text-primary/80');

    // Dialog & Inputs & General Fixes
    content = content.replace(/focus:ring-indigo-[45]00/g, 'focus:ring-primary');

    fs.writeFileSync(filePath, content, 'utf8');
    console.log("Refactored " + filePath);
}

const files = [
    "app/(student)/student/profile/profile-view.tsx",
    "app/(student)/student/drives/page.tsx",
    "app/(student)/student/drives/[driveId]/ranking/page.tsx",
    "app/(student)/student/drives/[driveId]/ranking/analysis-panel.tsx",
    "app/(student)/student/onboarding/page.tsx",
    "app/(student)/student/onboarding/layout.tsx",
    "app/(student)/student/sandbox/page.tsx",
    "app/(student)/student/sandbox/quick-sandbox.tsx",
    "app/(student)/student/sandbox/detailed/page.tsx",
    "app/(student)/student/sandbox/detailed/client.tsx",
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
