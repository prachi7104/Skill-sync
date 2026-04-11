const fs = require('fs');
let c = fs.readFileSync('app/(student)/student/career-coach/page.tsx', 'utf8');

const replacements = [
  [/text-zinc-900/g, 'text-foreground'],
  [/text-zinc-500/g, 'text-muted-foreground'],
  [/text-zinc-400/g, 'text-muted-foreground'],
  [/text-zinc-600/g, 'text-muted-foreground'],
  [/bg-white/g, 'bg-card'],
  [/border-zinc-200/g, 'border-border'],
  [/dark:bg-slate-900/g, ''],
  [/dark:text-slate-100/g, ''],
  [/dark:text-slate-400/g, ''],
  [/dark:text-slate-300/g, ''],
  [/dark:border-slate-800/g, ''],
  [/bg-zinc-50/g, 'bg-muted'],
  [/bg-zinc-100/g, 'bg-muted/80'],
  [/hover:bg-zinc-100/g, 'hover:bg-muted/80'],
  [/dark:bg-slate-950/g, ''],
  [/dark:hover:bg-slate-800/g, ''],
  [/dark:text-slate-500/g, ''],
  [/border border-zinc-200 bg-zinc-50 text-zinc-600/g, 'border-border bg-muted text-muted-foreground hover:bg-muted/80'],
  [/bg-zinc-100 dark:bg-slate-800/g, 'bg-muted text-foreground'],
  [/bg-zinc-200/g, 'bg-muted'],
  [/text-zinc-700/g, 'text-muted-foreground'],
  [/dark:text-slate-200/g, '']
];

for (const [r, target] of replacements) {
    c = c.replace(r, target);
}

// Clean up multiples spaces caused by removals
c = c.replace(/ +/g, ' ').replace(/ className=" /g, ' className="').replace(/ "/g, '"');

fs.writeFileSync('app/(student)/student/career-coach/page.tsx', c);
