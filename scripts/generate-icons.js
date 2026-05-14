const sharp = require('sharp');
const path = require('path');

const PUBLIC = path.join(__dirname, '..', 'public', 'icons');

// SVG design: dark rounded square with white "PG" text
function svgIcon(size) {
  const fontSize = Math.round(size * 0.5);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#1a1a2e"/>
      <stop offset="100%" style="stop-color:#030303"/>
    </linearGradient>
  </defs>
  <rect width="${size}" height="${size}" rx="${Math.round(size * 0.18)}" fill="url(#bg)" stroke="#333" stroke-width="${Math.round(size * 0.01)}"/>
  <text x="50%" y="54%" dominant-baseline="middle" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif" font-weight="800" font-size="${fontSize}" fill="#ffffff">PG</text>
</svg>`;
}

async function generate() {
  const sizes = [192, 512];
  for (const size of sizes) {
    const svg = svgIcon(size);
    const outPath = path.join(PUBLIC, `icon-${size}.png`);
    await sharp(Buffer.from(svg)).resize(size, size).png().toFile(outPath);
    console.log(`Generated ${outPath}`);
  }
  // Also generate a favicon-like 48x48
  const svg48 = svgIcon(48);
  const outPath48 = path.join(PUBLIC, 'icon-48.png');
  await sharp(Buffer.from(svg48)).resize(48, 48).png().toFile(outPath48);
  console.log(`Generated ${outPath48}`);
}

generate().catch(console.error);
