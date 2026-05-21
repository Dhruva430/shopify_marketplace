/**
 * Generates on-brand placeholder imagery (PNG) for the Aurelle skincare store:
 *  - product packaging shots (3 angles each) for product media uploads
 *  - collection tiles, hero, brand-story, logo and favicon
 * Run: pnpm gen:images   (requires the `sharp` dev dependency)
 *
 * These are clean vector mockups so the store looks designed out of the box.
 * Swap them for real product photography before going live.
 */
import sharp from 'sharp';
import { mkdir } from 'node:fs/promises';
import { dirname } from 'node:path';

const C = {
  ivory: '#F6F1EA',
  cream: '#EFE7DB',
  sage: '#9CAF95',
  sageSoft: '#DCE3D6',
  terracotta: '#BD6B4C',
  ink: '#2B2622',
  stone: '#8C857C',
  white: '#FFFDF9',
} as const;

type PackagingKind = 'dropper' | 'pump' | 'jar' | 'tube';

const esc = (s: string): string =>
  String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/* ---------- bottle / jar / tube vector builders (centered ~x=600) ---------- */
function packaging(kind: PackagingKind, accent: string): string {
  const glass = `${accent}`;
  switch (kind) {
    case 'dropper':
      return `
        <rect x="555" y="430" width="90" height="70" rx="10" fill="${C.ink}"/>
        <rect x="540" y="300" width="120" height="140" rx="14" fill="${C.ink}"/>
        <rect x="585" y="170" width="30" height="150" rx="12" fill="${C.ink}" opacity="0.85"/>
        <rect x="430" y="500" width="340" height="700" rx="46" fill="${glass}"/>
        <rect x="430" y="500" width="340" height="700" rx="46" fill="url(#sheen)"/>`;
    case 'pump':
      return `
        <rect x="568" y="170" width="64" height="120" rx="10" fill="${C.ink}"/>
        <rect x="520" y="250" width="160" height="60" rx="14" fill="${C.ink}"/>
        <rect x="640" y="200" width="90" height="22" rx="11" fill="${C.ink}"/>
        <rect x="430" y="310" width="340" height="890" rx="50" fill="${glass}"/>
        <rect x="430" y="310" width="340" height="890" rx="50" fill="url(#sheen)"/>`;
    case 'jar':
      return `
        <rect x="380" y="430" width="440" height="120" rx="26" fill="${C.ink}"/>
        <rect x="400" y="540" width="400" height="560" rx="40" fill="${glass}"/>
        <rect x="400" y="540" width="400" height="560" rx="40" fill="url(#sheen)"/>`;
    case 'tube':
    default:
      return `
        <rect x="556" y="190" width="88" height="80" rx="12" fill="${C.ink}"/>
        <path d="M450 300 H750 V1180 Q750 1210 720 1210 H480 Q450 1210 450 1180 Z" fill="${glass}"/>
        <path d="M450 300 H750 V1180 Q750 1210 720 1210 H480 Q450 1210 450 1180 Z" fill="url(#sheen)"/>
        <path d="M450 300 Q600 360 750 300 L750 270 Q600 330 450 270 Z" fill="${C.ink}" opacity="0.85"/>`;
  }
}

function labelBand(name: string, sub: string): string {
  return `
    <rect x="470" y="740" width="260" height="250" rx="18" fill="${C.white}"/>
    <text x="600" y="800" text-anchor="middle" font-family="Georgia, 'Times New Roman', serif" font-size="20" letter-spacing="4" fill="${C.stone}">AURELLE</text>
    <line x1="520" y1="820" x2="680" y2="820" stroke="${C.cream}" stroke-width="2"/>
    <text x="600" y="888" text-anchor="middle" font-family="Georgia, serif" font-weight="600" font-size="34" fill="${C.ink}">${esc(name)}</text>
    <text x="600" y="930" text-anchor="middle" font-family="Helvetica, Arial, sans-serif" font-size="19" letter-spacing="1" fill="${C.stone}">${esc(sub)}</text>`;
}

interface ProductSVGOpts {
  kind: PackagingKind;
  accent: string;
  name: string;
  sub: string;
  bg: string;
  w?: number;
  h?: number;
}
function productSVG({ kind, accent, name, sub, bg, w = 1200, h = 1500 }: ProductSVGOpts): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 1200 1500">
    <defs>
      <linearGradient id="sheen" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stop-color="#ffffff" stop-opacity="0.28"/>
        <stop offset="0.25" stop-color="#ffffff" stop-opacity="0"/>
        <stop offset="1" stop-color="#000000" stop-opacity="0.10"/>
      </linearGradient>
    </defs>
    <rect width="1200" height="1500" fill="${bg}"/>
    <circle cx="600" cy="720" r="430" fill="#ffffff" opacity="0.35"/>
    <ellipse cx="600" cy="1230" rx="250" ry="36" fill="${C.ink}" opacity="0.10"/>
    ${packaging(kind, accent)}
    ${labelBand(name, sub)}
  </svg>`;
}

interface TextureSVGOpts {
  accent: string;
  name: string;
  w?: number;
  h?: number;
}
function textureSVG({ accent, name }: TextureSVGOpts): string {
  const blob = (cx: number, cy: number, r: number, fill: string, op: number): string =>
    `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${fill}" opacity="${op}"/>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="1500" viewBox="0 0 1200 1500">
    <rect width="1200" height="1500" fill="${C.cream}"/>
    ${blob(600, 700, 360, accent, 0.16)}
    ${blob(470, 560, 120, accent, 0.55)}
    ${blob(740, 640, 90, accent, 0.4)}
    ${blob(560, 860, 150, accent, 0.7)}
    ${blob(720, 900, 70, C.sage, 0.5)}
    <path d="M600 470 q70 120 70 200 a70 80 0 1 1 -140 0 q0 -80 70 -200 Z" fill="${C.white}" opacity="0.9"/>
    <text x="600" y="1230" text-anchor="middle" font-family="Georgia, serif" font-weight="600" font-size="60" fill="${C.ink}">${esc(name)}</text>
    <text x="600" y="1290" text-anchor="middle" font-family="Helvetica, Arial, sans-serif" font-size="26" letter-spacing="6" fill="${C.stone}">TEXTURE</text>
  </svg>`;
}

interface CollectionSVGOpts {
  title: string;
  accent: string;
  kind: PackagingKind;
}
function collectionSVG({ title, accent, kind }: CollectionSVGOpts): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="1000" viewBox="0 0 1200 1500">
    <defs><linearGradient id="sheen" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#fff" stop-opacity="0.25"/><stop offset="1" stop-color="#000" stop-opacity="0.1"/></linearGradient></defs>
    <rect width="1200" height="1500" fill="${C.sageSoft}"/>
    <circle cx="600" cy="700" r="420" fill="#ffffff" opacity="0.4"/>
    ${packaging(kind, accent)}
    ${labelBand(title, 'Collection')}
  </svg>`;
}

function kitSVG(bg: string): string {
  const mini = (tx: number, ty: number, sc: number, kind: PackagingKind, accent: string): string =>
    `<g transform="translate(${tx},${ty}) scale(${sc})">${packaging(kind, accent)}</g>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="1500" viewBox="0 0 1200 1500">
    <defs><linearGradient id="sheen" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#fff" stop-opacity="0.28"/><stop offset="0.25" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity="0.1"/></linearGradient></defs>
    <rect width="1200" height="1500" fill="${bg}"/>
    <circle cx="600" cy="640" r="430" fill="#ffffff" opacity="0.4"/>
    <ellipse cx="600" cy="990" rx="380" ry="30" fill="${C.ink}" opacity="0.08"/>
    ${mini(104, 408, 0.46, 'pump', '#9CAF95')}
    ${mini(300, 355, 0.5, 'dropper', '#BD6B4C')}
    ${mini(556, 476, 0.44, 'jar', '#B98B6E')}
    <text x="600" y="1300" text-anchor="middle" font-family="Georgia, serif" font-weight="600" font-size="56" fill="${C.ink}">The Complete Routine Kit</text>
    <text x="600" y="1356" text-anchor="middle" font-family="Helvetica, Arial, sans-serif" font-size="24" letter-spacing="5" fill="${C.stone}">CLEANSE · TREAT · MOISTURISE</text>
  </svg>`;
}

function heroSVG(): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="1500" viewBox="0 0 1200 1500">
    <defs>
      <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${C.cream}"/><stop offset="1" stop-color="${C.sageSoft}"/></linearGradient>
      <linearGradient id="sheen" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#fff" stop-opacity="0.3"/><stop offset="1" stop-color="#000" stop-opacity="0.1"/></linearGradient>
    </defs>
    <rect width="1200" height="1500" fill="url(#bg)"/>
    <circle cx="600" cy="720" r="460" fill="#ffffff" opacity="0.45"/>
    ${packaging('dropper', C.terracotta)}
    ${labelBand('Hydrating Serum', 'Hyaluronic + B5')}
  </svg>`;
}

function storySVG(): string {
  return textureSVG({ accent: C.sage, name: 'Clean Science' })
    .replace('1200" height="1500"', '1200" height="1200"')
    .replace('viewBox="0 0 1200 1500"', 'viewBox="0 0 1200 1200"')
    .replace(/cy="700"/, 'cy="560"')
    .replace(/y="1230"/, 'y="1000"')
    .replace(/y="1290"/, 'y="1060"');
}

function logoSVG({ light = false }: { light?: boolean } = {}): string {
  const fg = light ? C.ivory : C.ink;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="720" height="220" viewBox="0 0 720 220">
    <g transform="translate(60,40)">
      <path d="M70 130 A60 60 0 0 1 10 70 C10 30 40 0 110 0 C110 60 80 100 40 110 Z" fill="${C.sage}"/>
      <path d="M20 130 C45 95 75 70 105 55" stroke="${light ? C.ivory : C.ink}" stroke-width="4" fill="none" stroke-linecap="round" opacity="0.6"/>
    </g>
    <text x="200" y="135" font-family="Georgia, 'Times New Roman', serif" font-weight="600" font-size="96" letter-spacing="6" fill="${fg}">Aurelle</text>
    <text x="206" y="178" font-family="Helvetica, Arial, sans-serif" font-size="22" letter-spacing="11" fill="${C.stone}">CLEAN SKINCARE</text>
  </svg>`;
}

function faviconSVG(): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
    <rect width="512" height="512" rx="110" fill="${C.ink}"/>
    <path d="M300 360 A130 130 0 0 1 170 230 C170 140 230 90 360 90 C360 220 300 320 200 340 Z" fill="${C.sage}"/>
    <text x="256" y="430" text-anchor="middle" font-family="Georgia, serif" font-weight="600" font-size="120" fill="${C.ivory}">A</text>
  </svg>`;
}

/* ---------- product catalogue ---------- */
interface ProductSpec {
  handle: string;
  name: string;
  sub: string;
  kind: PackagingKind;
  accent: string;
  collection: string;
}
const products: ProductSpec[] = [
  { handle: 'hydrating-hyaluronic-serum', name: 'Hydrating Serum', sub: 'Hyaluronic + B5', kind: 'dropper', accent: '#BD6B4C', collection: 'hydration' },
  { handle: 'vitamin-c-brightening-serum', name: 'Vitamin C Serum', sub: '15% Brightening', kind: 'dropper', accent: '#D98E3A', collection: 'brightening' },
  { handle: 'gentle-gel-cleanser', name: 'Gentle Cleanser', sub: 'Daily Gel Wash', kind: 'pump', accent: '#9CAF95', collection: 'hydration' },
  { handle: 'barrier-repair-moisturizer', name: 'Barrier Cream', sub: 'Ceramide Repair', kind: 'jar', accent: '#B98B6E', collection: 'barrier-repair' },
  { handle: 'spf-50-mineral-sunscreen', name: 'Mineral SPF 50', sub: 'Daily Defense', kind: 'tube', accent: '#6E8FB9', collection: 'barrier-repair' },
];

async function write(path: string, svg: string, w: number, h: number): Promise<void> {
  await mkdir(dirname(path), { recursive: true });
  await sharp(Buffer.from(svg)).resize(w, h).png({ quality: 90 }).toFile(path);
  console.log('✓', path);
}
async function writePng(path: string, svg: string, _w: number, _h: number, transparent = false): Promise<void> {
  await mkdir(dirname(path), { recursive: true });
  let img = sharp(Buffer.from(svg));
  if (!transparent) img = img.flatten({ background: C.ivory });
  await img.png().toFile(path);
  console.log('✓', path);
}

const BASE = 'brand/images';

async function main(): Promise<void> {
  // products: 3 images each
  for (const p of products) {
    await write(`${BASE}/products/${p.handle}-1.png`, productSVG({ ...p, bg: C.cream }), 1200, 1500);
    await write(`${BASE}/products/${p.handle}-2.png`, productSVG({ ...p, bg: C.sageSoft }), 1200, 1500);
    await write(`${BASE}/products/${p.handle}-3.png`, textureSVG({ accent: p.accent, name: p.name }), 1200, 1500);
  }
  // bundle / kit
  await write(`${BASE}/products/the-complete-routine-kit-1.png`, kitSVG(C.cream), 1200, 1500);
  await write(`${BASE}/products/the-complete-routine-kit-2.png`, kitSVG(C.sageSoft), 1200, 1500);
  await write(`${BASE}/products/the-complete-routine-kit-3.png`, textureSVG({ accent: '#BD6B4C', name: 'Routine Kit' }), 1200, 1500);
  // collections
  await write(`${BASE}/collection-hydration.png`, collectionSVG({ title: 'Hydration', accent: '#BD6B4C', kind: 'dropper' }), 800, 1000);
  await write(`${BASE}/collection-brightening.png`, collectionSVG({ title: 'Brightening', accent: '#D98E3A', kind: 'dropper' }), 800, 1000);
  await write(`${BASE}/collection-barrier-repair.png`, collectionSVG({ title: 'Barrier Repair', accent: '#B98B6E', kind: 'jar' }), 800, 1000);
  // hero / story
  await write(`${BASE}/hero.png`, heroSVG(), 1200, 1500);
  await write(`${BASE}/brand-story.png`, storySVG(), 1200, 1200);
  // brand
  await writePng(`${BASE}/logo.png`, logoSVG(), 720, 220, true);
  await writePng(`${BASE}/logo-light.png`, logoSVG({ light: true }), 720, 220, true);
  await writePng(`${BASE}/favicon.png`, faviconSVG(), 512, 512, true);
  console.log('\nAll imagery generated in', BASE);
}
main().catch((e) => {
  console.error(e);
  process.exit(1);
});
