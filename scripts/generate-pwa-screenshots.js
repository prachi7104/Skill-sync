/**
 * Generates placeholder PWA screenshot PNGs for the SkillSync manifest.
 * Replace these with real screenshots before production launch.
 * Run: node scripts/generate-pwa-screenshots.js
 */

const sharp = require('sharp');
const path = require('path');

const DESKTOP = { width: 1280, height: 800 };
const MOBILE  = { width: 390,  height: 844 };

// Background: #08112F (dark navy — app brand color)
// Text rendered as SVG overlay
const BG = Buffer.from([0x08, 0x11, 0x2F]);

async function makeScreenshot(w, h, label, outPath) {
  // Create a solid navy rectangle with centered brand text as SVG
  const svg = `
    <svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">
      <rect width="${w}" height="${h}" fill="#08112F"/>
      <rect x="${w/2 - 120}" y="${h/2 - 60}" width="240" height="80" rx="12" fill="#1e2a4a"/>
      <text x="${w/2}" y="${h/2 - 16}" text-anchor="middle" font-family="system-ui, sans-serif"
            font-size="28" font-weight="900" fill="#5A77DF" letter-spacing="-0.5">
        SkillSync
      </text>
      <text x="${w/2}" y="${h/2 + 18}" text-anchor="middle" font-family="system-ui, sans-serif"
            font-size="13" fill="#CCD4DE">
        ${label}
      </text>
    </svg>
  `;

  await sharp(Buffer.from(svg))
    .png()
    .toFile(outPath);

  console.log(`Generated: ${outPath}`);
}

async function main() {
  const iconsDir = path.join(__dirname, '../public/icons');

  await makeScreenshot(
    DESKTOP.width,
    DESKTOP.height,
    'Placement Intelligence Hub',
    path.join(iconsDir, 'screenshot-desktop.png')
  );

  await makeScreenshot(
    MOBILE.width,
    MOBILE.height,
    'Student Dashboard',
    path.join(iconsDir, 'screenshot-mobile.png')
  );

  console.log('PWA screenshots generated successfully.');
  console.log('Replace with real screenshots before final production deploy.');
}

main().catch(console.error);
