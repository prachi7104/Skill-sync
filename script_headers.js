const fs = require('fs');
const path = require('path');

// 1. Fix Button in onboarding
let onboardFile = 'app/(student)/student/onboarding/page.tsx';
let onboardTxt = fs.readFileSync(onboardFile, 'utf8');

// The `<button` element comes with `<Button` sometimes, so regex replace is straightforward but let's avoid messing up any <Button we already have, which is capitalized.
onboardTxt = onboardTxt.replace(/<button(?=[\s>])/g, '<Button');
onboardTxt = onboardTxt.replace(/<\/button>/g, '</Button>');

if (!onboardTxt.includes('import { Button } from "@/components/ui/button"')) {
    // If not imported, we would import, but it is imported as seen in the code.
}

fs.writeFileSync(onboardFile, onboardTxt);
console.log('Fixed buttons in', onboardFile);


// 2. Fix PageHeader in other files
const filesWithHeader = [
  'app/(admin)/admin/health/page.tsx',
  'app/(admin)/admin/users/page.tsx',
  'app/(admin)/admin/amcat/page.tsx',
  'app/(admin)/admin/seasons/page.tsx',
  'app/(admin)/admin/ai-models/page.tsx',
  'app/(admin)/admin/experiences/page.tsx',
  'app/(admin)/admin/drives/page.tsx',
  'app/(faculty)/faculty/drives/page.tsx',
  'app/(faculty)/faculty/settings/page.tsx'
];

filesWithHeader.forEach(f => {
  if (!fs.existsSync(f)) {
      console.log('Skipping', f, 'not found');
      return;
  }
  let txt = fs.readFileSync(f, 'utf8');
  
  // Find <header ...> ... </header>
  // A regex to capture the title, description, and actions
  let headerMatch = txt.match(/<header[^>]*>([\s\S]*?)<\/header>/);
  if (!headerMatch) {
      console.log('No <header> found in', f);
      return;
  }
  
  let headerInner = headerMatch[1];
  
  // Extract h1 and p
  let titleMatch = headerInner.match(/<h1[^>]*>([\s\S]*?)<\/h1>/);
  let descMatch = headerInner.match(/<p[^>]*>([\s\S]*?)<\/p>/);
  
  let title = titleMatch ? titleMatch[1].trim() : 'Title';
  let desc = descMatch ? descMatch[1].trim() : '';

  // To find eyebrow, check if filename implies Faculty or Admin
  let eyebrow = f.includes('admin') ? 'Admin' : 'Faculty';

  // Now, we need to extract actions if they exist.
  // We'll look for another div within the header that holds buttons or links.
  // There is usually <div className="max-w-2xl space-y-2"> containing h1 and p.
  // If there's another sibling div inside flex-row, that's actions!
  let actions = '';
  // Let's do a loose extraction: remove the max-w-2xl div, and what's left the "actions" div.
  let headerContentMatch = headerInner.match(/<div[^>]*>([\s\S]*)<\/div>\s*$/);
  if (headerContentMatch) {
     let innerMost = headerContentMatch[1];
     // innerMost often has <div className="max-w-x ... h1 and p ... </div> <div className="flex ..."> actions </div>
     let actionDivMatch = innerMost.match(/<\/div>\s*(<div[^>]*flex[^>]*>[\s\S]*<\/div>)\s*$/);
     if (actionDivMatch) {
         actions = actionDivMatch[1];
     } else {
         // Maybe the h1 and p are direct children of the flex container?
         // Let's just strip out the h1 and p tags and their immediate wrapper if any
         let noH1P = innerMost.replace(/<div[^>]*>\s*<h1[\s\S]*?<\/p>\s*<\/div>/, '');
         if (noH1P.trim()) {
           // check if there's any tags
           if (noH1P.includes('<')) {
               // actions = noH1P.trim();
           }
         }
     }

     // Better heuristic: match <div className="max-w-2xl ..."> ... </div>
     // Everything *after* it inside the header is actions.
     let splitAtH1PDiv = innerMost.split(/<div[^>]*max-w-[^>]*>[\s\S]*?<\/div>/);
     if (splitAtH1PDiv.length > 1 && splitAtH1PDiv[1].trim()) {
         let possibleActions = splitAtH1PDiv[1].trim();
         // If wrapped in <div className="flex ..."> 
         if (possibleActions.startsWith('<div')) {
           // We might want to remove the outer div if it just wraps buttons, 
           // but `actions={<> ... </>}` is enough. wait, maybe keep the div but inside `<>`
           // Let's actually just use the inner content of that div or the div itself.
           // actions = \`\n        <>\n          \${possibleActions}\n        </>\`;
           
           // Actually, the PageHeader accepts actions ReactNode. 
           // We can just keep the whole thing!
           actions = `actions={\n        <>\n${possibleActions}\n        </>\n      }`;
         }
     }
  }

  let repHeader = `      <PageHeader
        eyebrow="${eyebrow}"
        title="${title}"
        description="${desc}"
        ${actions}
      />`;

  txt = txt.replace(headerMatch[0], repHeader);

  if (!txt.includes('import PageHeader')) {
      // add import after the first import or right at the top
      if (txt.includes('import ')) {
         txt = txt.replace(/import [^\n]+;/, match => match + '\nimport PageHeader from "@/components/shared/page-header";');
      } else {
         txt = `import PageHeader from "@/components/shared/page-header";\n` + txt;
      }
  }

  fs.writeFileSync(f, txt);
  console.log('Fixed PageHeader in', f);

});
