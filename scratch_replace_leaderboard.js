const fs = require('fs');
let c = fs.readFileSync('app/(student)/student/leaderboard/page.tsx', 'utf8');

const replacements = [
  [/text-zinc-900/g, 'text-foreground'],
  [/text-zinc-500/g, 'text-muted-foreground'],
  [/bg-white/g, 'bg-card'],
  [/border-zinc-200/g, 'border-border'],
  [/dark:bg-slate-900/g, ''],
  [/dark:text-slate-100/g, ''],
  [/dark:text-slate-400/g, ''],
  [/dark:text-slate-300/g, ''],
  [/dark:border-slate-800/g, ''],
  [/bg-zinc-50/g, 'bg-muted'],
  [/bg-zinc-100/g, 'bg-muted/80'],
  [/dark:bg-slate-950/g, ''],
  [/dark:hover:bg-slate-800/g, '']
];

for (const [r, target] of replacements) {
    c = c.replace(r, target);
}

c = c.replace(/ +/g, ' ').replace(/ className=" /g, ' className="').replace(/ "/g, '"');

fs.writeFileSync('app/(student)/student/leaderboard/page.tsx', c);
