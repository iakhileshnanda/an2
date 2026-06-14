import { Resvg } from '@resvg/resvg-js';
import { writeFileSync, readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dirname, '../public/og-image.png');

// Embed the local font as base64 so the SVG is self-contained
const fontPath = join(__dirname, '../src/assets/fonts/Pastor_of_Muppets.TTF');
const fontBase64 = readFileSync(fontPath).toString('base64');

const svg = `<svg width="1200" height="630" viewBox="0 0 1200 630" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <style>
      @font-face {
        font-family: 'PastorOfMuppets';
        src: url('data:font/truetype;base64,${fontBase64}') format('truetype');
      }
      .name  { font-family: 'PastorOfMuppets', sans-serif; fill: #ffffff; }
      .mono  { font-family: monospace; }
    </style>
  </defs>

  <!-- Background -->
  <rect width="1200" height="630" fill="#000000"/>

  <!-- Left accent bar -->
  <rect x="80" y="72" width="2" height="486" fill="#222222"/>

  <!-- Top: green dot + domain -->
  <circle cx="112" cy="88" r="5" fill="#00FF41"/>
  <text x="130" y="94" class="mono" font-size="14" fill="#555555" letter-spacing="3">
    AKHILESHNANDA.MAYA-AI.DEV
  </text>

  <!-- Name — big -->
  <text x="112" y="260" class="name" font-size="130" letter-spacing="-2">AKHILESH</text>
  <text x="112" y="390" class="name" font-size="130" letter-spacing="-2">NANDA</text>

  <!-- Role -->
  <text x="112" y="440" class="mono" font-size="20" fill="#666666" letter-spacing="4">
    FRONTEND LEAD  ·  AI SYSTEMS BUILDER  ·  BANGALORE
  </text>

  <!-- Divider -->
  <line x1="112" y1="468" x2="500" y2="468" stroke="#222222" stroke-width="1"/>

  <!-- Tags -->
  <g class="mono" font-size="13" fill="#888888" letter-spacing="2">
    <rect x="112" y="480" width="90" height="28" fill="none" stroke="#333333" stroke-width="1"/>
    <text x="125" y="499">ANGULAR</text>

    <rect x="216" y="480" width="76" height="28" fill="none" stroke="#333333" stroke-width="1"/>
    <text x="229" y="499">REACT</text>

    <rect x="306" y="480" width="112" height="28" fill="none" stroke="#333333" stroke-width="1"/>
    <text x="319" y="499">TYPESCRIPT</text>

    <rect x="432" y="480" width="102" height="28" fill="none" stroke="#333333" stroke-width="1"/>
    <text x="445" y="499">AI AGENTS</text>

    <rect x="548" y="480" width="56" height="28" fill="none" stroke="#333333" stroke-width="1"/>
    <text x="561" y="499">MCP</text>

    <rect x="618" y="480" width="82" height="28" fill="none" stroke="#333333" stroke-width="1"/>
    <text x="631" y="499">6 YRS</text>
  </g>
</svg>`;

const resvg = new Resvg(svg, { fitTo: { mode: 'width', value: 1200 } });
const png = resvg.render().asPng();
writeFileSync(OUT, png);
console.log(`✓ og-image.png written → public/og-image.png`);
