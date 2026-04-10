/**
 * PWA Icon Generator for SkillSync
 * Run: node scripts/generate-pwa-icons.js
 * Requires: npm install sharp (dev dependency only)
 *
 * If sharp is not available, manually export the SVG at 192x192 and 512x512
 * from Figma/Inkscape and place in public/icons/
 */
const fs = require('fs');
const path = require('path');

const ICON_DIR = path.join(__dirname, '../public/icons');

// Ensure directory exists
if (!fs.existsSync(ICON_DIR)) {
  fs.mkdirSync(ICON_DIR, { recursive: true });
}

try {
  const sharp = require('sharp');
  const svgBuffer = fs.readFileSync(path.join(ICON_DIR, 'icon.svg'));

  Promise.all([
    sharp(svgBuffer).resize(192, 192).png().toFile(path.join(ICON_DIR, 'icon-192.png')),
    sharp(svgBuffer).resize(512, 512).png().toFile(path.join(ICON_DIR, 'icon-512.png')),
  ]).then(() => {
    console.log('PWA icons generated successfully:');
    console.log('  public/icons/icon-192.png');
    console.log('  public/icons/icon-512.png');
  }).catch(err => {
    console.error('Icon generation failed:', err.message);
  });
} catch {
  console.log('sharp not installed. Install with: npm install --save-dev sharp');
  console.log('Then re-run: node scripts/generate-pwa-icons.js');
  console.log('Alternatively, manually export public/icons/icon.svg at 192x192 and 512x512 as PNG.');
}
