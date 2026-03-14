const fs = require('fs');
['app/(student)/student/dashboard/page.tsx', 'app/(student)/student/sandbox/quick-sandbox.tsx', 'app/(student)/student/profile/profile-view.tsx'].forEach(filePath => {
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  let lastIndex = -1;
  for (let i = lines.length - 1; i >= 0; i--) {
    if (lines[i].trim() === '"use client";') {
      lastIndex = i;
      break;
    }
  }
  if (lastIndex !== -1) {
    fs.writeFileSync(filePath, lines.slice(lastIndex).join('\n'));
    console.log('Cleaned ' + filePath + ', kept from line ' + (lastIndex + 1));
  } else {
    console.log('"use client"; not found in ' + filePath);
  }
});
