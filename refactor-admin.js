const fs = require('fs');

function refactorFile(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');

    // Remove backdrop-blur-*
    content = content.replace(/backdrop-blur-(sm|md|lg|xl|2xl|3xl)/g, '');

    // Container shadows -> shadow-sm
    content = content.replace(/shadow-\[.*?\]/g, 'shadow-sm');
    content = content.replace(/shadow-2xl/g, 'shadow-sm');
    content = content.replace(/drop-shadow-sm/g, '');

    // Backgrounds
    content = content.replace(/bg-slate-[789]00(?:\/[0-9]+)?/g, 'bg-card');
    content = content.replace(/bg-slate-950(?:\/[0-9]+)?/g, 'bg-muted/20');

    // Borders
    content = content.replace(/border-white\/[0-9]+/g, 'border-border');
    content = content.replace(/border-slate-[5678]00(?:\/[0-9]+)?/g, 'border-border');

    // Border Radius
    content = content.replace(/rounded-(?:2xl|3xl|xl)/g, 'rounded-md');
    content = content.replace(/rounded-\[(?:[0-9.]+(?:rem|px|%))\]/g, 'rounded-md');

    // Typography Colors
    content = content.replace(/text-white/g, 'text-foreground');
    content = content.replace(/text-slate-[12]00/g, 'text-foreground');
    content = content.replace(/text-slate-[3456]00/g, 'text-muted-foreground');

    // Indigo -> Primary
    content = content.replace(/bg-indigo-[5678]00/g, 'bg-primary');
    content = content.replace(/hover:bg-indigo-[4567]00/g, 'hover:bg-primary/90');
    content = content.replace(/text-indigo-[345]00/g, 'text-primary');
    content = content.replace(/hover:text-indigo-[34]00/g, 'hover:text-primary/80');
    content = content.replace(/border-indigo-[45]00(?:\/[0-9]+)?/g, 'border-primary/30');
    content = content.replace(/ring-indigo-[45]00/g, 'ring-primary');
    content = content.replace(/focus:ring-indigo-[45]00/g, 'focus:ring-primary');

    // Emerald -> success
    content = content.replace(/bg-emerald-[456]00(?:\/[0-9]+)?/g, 'bg-success/10');
    content = content.replace(/border-emerald-[456]00(?:\/[0-9]+)?/g, 'border-success/20');
    content = content.replace(/text-emerald-[345]00/g, 'text-success');

    // Rose -> destructive
    content = content.replace(/bg-rose-[456]00(?:\/[0-9]+)?/g, 'bg-destructive/10');
    content = content.replace(/border-rose-[456]00(?:\/[0-9]+)?/g, 'border-destructive/20');
    content = content.replace(/text-rose-[345]00/g, 'text-destructive');

    // Amber -> warning
    content = content.replace(/bg-amber-[456]00(?:\/[0-9]+)?/g, 'bg-warning/10');
    content = content.replace(/border-amber-[456]00(?:\/[0-9]+)?/g, 'border-warning/20');
    content = content.replace(/text-amber-[345]00/g, 'text-warning');

    // white/5, white/10 bg -> transparent muted
    content = content.replace(/bg-white\/5/g, 'bg-muted/10');
    content = content.replace(/bg-white\/10/g, 'bg-muted/20');

    // hover states on slate
    content = content.replace(/hover:bg-slate-[789]00/g, 'hover:bg-muted');

    // disabled:bg-slate
    content = content.replace(/disabled:bg-slate-[789]00/g, 'disabled:bg-muted');

    fs.writeFileSync(filePath, content, 'utf8');
    console.log("Refactored " + filePath);
}

const files = [
    "app/(admin)/admin/page.tsx",
    "app/(admin)/admin/health/page.tsx",
    "app/(admin)/admin/experiences/page.tsx",
    "app/(admin)/admin/settings/page.tsx",
    "app/(admin)/admin/users/page.tsx",
    "app/(admin)/admin/seasons/page.tsx",
    "app/(admin)/admin/sandbox/page.tsx",
    "app/(admin)/admin/drives/page.tsx",
    "app/(admin)/admin/drives/drive-action-buttons.tsx",
    "app/(admin)/admin/drives/new/page.tsx",
    "app/(admin)/admin/ai-models/page.tsx",
    "app/(admin)/admin/amcat/page.tsx",
];

for (const file of files) {
    if (fs.existsSync(file)) {
        refactorFile(file);
    } else {
        console.log("Not found: " + file);
    }
}
