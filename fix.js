const fs = require('fs');
const path = require('path');

const files = [
  "app/(admin)/admin/seasons/page.tsx",
  "app/(faculty)/faculty/settings/page.tsx",
  "app/(admin)/admin/experiences/page.tsx",
  "app/page.tsx",
  "app/unauthorized/page.tsx",
  "app/login/page.tsx",
  "app/(student)/student/sandbox/quick-sandbox.tsx",
  "app/(student)/student/onboarding/page.tsx",
  "app/(admin)/admin/sandbox/page.tsx",
  "app/(admin)/admin/drives/drive-action-buttons.tsx",
  "components/ui/tag-input.tsx",
  "components/faculty/trigger-ranking-button.tsx",
  "components/faculty/drive-conflicts-button.tsx",
  "components/shared/student-search-view.tsx"
];

for (const file of files) {
  const fullPath = path.join("d:\\Skillsync v2", file);
  if (!fs.existsSync(fullPath)) continue;
  let content = fs.readFileSync(fullPath, 'utf8');

  // 1. Shadows & blurs
  content = content.replace(/shadow-\[[^\]]+\]/g, '');
  content = content.replace(/blur-\[[^\]]+\]/g, '');
  content = content.replace(/mix-blend-[a-z-]+/g, '');
  content = content.replace(/backdrop-blur(?:-[a-z0-9]+)?/g, '');
  
  // 2. rounded
  content = content.replace(/rounded-2xl/g, 'rounded-md');
  content = content.replace(/rounded-3xl/g, 'rounded-md');
  content = content.replace(/rounded-\[[^\]]+\]/g, 'rounded-md');

  // 3. font-black
  content = content.replace(/font-black/g, 'font-semibold');

  // 4. colors context
  // Slate backgrounds
  content = content.replace(/bg-slate-900\/[0-9]+/g, 'bg-card');
  content = content.replace(/bg-slate-900/g, 'bg-card');
  content = content.replace(/bg-slate-950/g, 'bg-background');
  content = content.replace(/bg-slate-800/g, 'bg-secondary');
  content = content.replace(/bg-slate-700/g, 'bg-muted');

  // Slate text
  content = content.replace(/text-slate-[345]00/g, 'text-muted-foreground');
  content = content.replace(/text-slate-[12]00/g, 'text-foreground');

  // Slate border
  content = content.replace(/border-slate-[0-9]+/g, 'border-border');

  // White text / borders
  content = content.replace(/text-white/g, 'text-foreground');
  content = content.replace(/border-white\/[0-9]+/g, 'border-border');

  // Indigo to Primary
  content = content.replace(/bg-indigo-[0-9]+/g, 'bg-primary');
  content = content.replace(/text-indigo-[34]00/g, 'text-foreground'); 
  content = content.replace(/text-indigo-[0-9]+/g, 'text-primary');
  content = content.replace(/border-indigo-[0-9]+/g, 'border-primary');

  fs.writeFileSync(fullPath, content, 'utf8');
}
console.log("Done global replacements.");
