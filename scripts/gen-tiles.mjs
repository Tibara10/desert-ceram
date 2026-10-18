// Génère les visuels SVG originaux du site (aucune photo externe) :
//  - un aperçu de carreau par produit, à partir de src/data/products.json
//  - l'illustration du hero (dunes) et celle de la section « À propos » (arches)
// Déterministe : même produit → même image (générateur pseudo-aléatoire graine).
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';

const products = JSON.parse(readFileSync(new URL('../src/data/products.json', import.meta.url), 'utf8'));
const OUT = new URL('../public/tiles/', import.meta.url);
const IMG = new URL('../public/img/', import.meta.url);
mkdirSync(OUT, { recursive: true });
mkdirSync(IMG, { recursive: true });

// ── Aléatoire graine (mulberry32) ─────────────────────────
function rng(seedStr) {
  let h = 1779033703 ^ seedStr.length;
  for (let i = 0; i < seedStr.length; i++) h = Math.imul(h ^ seedStr.charCodeAt(i), 3432918353), (h = (h << 13) | (h >>> 19));
  let a = h >>> 0;
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const r1 = (n) => Math.round(n * 10) / 10;
const S = 600; // taille de l'aperçu

// Grain fin commun à toutes les matières
const grain = (id, seed, opacity = 0.18, freq = 0.85) => `
  <filter id="${id}" x="0" y="0" width="100%" height="100%">
    <feTurbulence type="fractalNoise" baseFrequency="${freq}" numOctaves="2" seed="${seed}" stitchTiles="stitch"/>
    <feColorMatrix type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 ${opacity} 0"/>
  </filter>`;

function marble(p, rand) {
  const seed = Math.floor(rand() * 999);
  let veins = '';
  for (let i = 0; i < 7; i++) {
    let x = rand() * S * 0.4 - 60, y = rand() * S;
    let d = `M${r1(x)} ${r1(y)}`;
    for (let k = 0; k < 5; k++) {
      const nx = x + 120 + rand() * 80, ny = y + (rand() - 0.45) * 220;
      d += ` Q${r1(x + 60 + rand() * 60)} ${r1(y + (rand() - 0.5) * 200)} ${r1(nx)} ${r1(ny)}`;
      x = nx; y = ny;
    }
    const w = i < 3 ? 3 + rand() * 3 : 0.8 + rand() * 1.4;
    veins += `<path d="${d}" fill="none" stroke="${p.accent}" stroke-width="${r1(w)}" stroke-opacity="${r1(0.35 + rand() * 0.5)}"/>`;
  }
  return `
  <defs>
    <filter id="wobble"><feTurbulence type="fractalNoise" baseFrequency="0.012" numOctaves="3" seed="${seed}"/><feDisplacementMap in="SourceGraphic" scale="40"/><feGaussianBlur stdDeviation="0.6"/></filter>
    <filter id="cloud" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency="0.006" numOctaves="4" seed="${seed + 7}"/><feColorMatrix type="matrix" values="0 0 0 0 0.5  0 0 0 0 0.45  0 0 0 0 0.4  0 0 0 0.22 0"/></filter>
    ${grain('g', seed, 0.06)}
    <linearGradient id="sheen" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".22"/><stop offset=".5" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#fff" stop-opacity=".08"/></linearGradient>
  </defs>
  <rect width="${S}" height="${S}" fill="${p.base}"/>
  <rect width="${S}" height="${S}" filter="url(#cloud)"/>
  <g filter="url(#wobble)">${veins}</g>
  <rect width="${S}" height="${S}" filter="url(#g)"/>
  <rect width="${S}" height="${S}" fill="url(#sheen)"/>`;
}

function stone(p, rand) {
  const seed = Math.floor(rand() * 999);
  return `
  <defs>
    <filter id="blot" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency="0.018" numOctaves="4" seed="${seed}"/><feColorMatrix type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -2.4 1.25"/><feComposite operator="in" in2="SourceGraphic"/></filter>
    ${grain('g', seed + 3, 0.22, 0.9)}
    ${grain('g2', seed + 9, 0.1, 0.25)}
  </defs>
  <rect width="${S}" height="${S}" fill="${p.base}"/>
  <rect width="${S}" height="${S}" fill="${p.accent}" filter="url(#blot)" opacity=".3"/>
  <rect width="${S}" height="${S}" filter="url(#g2)"/>
  <rect width="${S}" height="${S}" filter="url(#g)"/>`;
}

function wood(p, rand) {
  const seed = Math.floor(rand() * 999);
  let lines = '';
  for (let y = -20; y < S + 20; y += 4 + rand() * 9) {
    const amp = 6 + rand() * 14;
    lines += `<path d="M-20 ${r1(y)} C150 ${r1(y + amp)} 300 ${r1(y - amp)} 620 ${r1(y + amp / 2)}" fill="none" stroke="${p.accent}" stroke-width="${r1(0.6 + rand() * 2.2)}" stroke-opacity="${r1(0.15 + rand() * 0.45)}"/>`;
  }
  // nœuds
  let knots = '';
  for (let i = 0; i < 2; i++) {
    const cx = 80 + rand() * 440, cy = 80 + rand() * 440;
    for (let k = 0; k < 4; k++) knots += `<ellipse cx="${r1(cx)}" cy="${r1(cy)}" rx="${r1(30 - k * 6)}" ry="${r1(9 - k * 2)}" fill="none" stroke="${p.accent}" stroke-opacity=".5" stroke-width="1.4"/>`;
  }
  return `
  <defs>
    <filter id="warp"><feTurbulence type="fractalNoise" baseFrequency="0.004 0.03" numOctaves="3" seed="${seed}"/><feDisplacementMap in="SourceGraphic" scale="26"/></filter>
    ${grain('g', seed, 0.12, 0.6)}
  </defs>
  <rect width="${S}" height="${S}" fill="${p.base}"/>
  <g filter="url(#warp)">${lines}${knots}</g>
  <rect width="${S}" height="${S}" filter="url(#g)"/>`;
}

function terrazzo(p, rand) {
  const seed = Math.floor(rand() * 999);
  const palette = [p.accent, '#8a8178', '#c98a3b', '#3d3935', '#d6c4a4', '#9e5a3a'];
  let chips = '';
  for (let i = 0; i < 210; i++) {
    const cx = rand() * S, cy = rand() * S;
    const big = rand() < 0.12;
    const rad = big ? 14 + rand() * 18 : 3 + rand() * 8;
    const n = 4 + Math.floor(rand() * 4);
    let pts = [];
    for (let k = 0; k < n; k++) {
      const a = (k / n) * Math.PI * 2 + rand() * 0.6;
      const rr = rad * (0.55 + rand() * 0.6);
      pts.push(`${r1(cx + Math.cos(a) * rr)},${r1(cy + Math.sin(a) * rr)}`);
    }
    chips += `<polygon points="${pts.join(' ')}" fill="${palette[Math.floor(rand() * palette.length)]}" opacity="${r1(0.75 + rand() * 0.25)}"/>`;
  }
  return `
  <defs>${grain('g', seed, 0.16, 0.8)}</defs>
  <rect width="${S}" height="${S}" fill="${p.base}"/>
  ${chips}
  <rect width="${S}" height="${S}" filter="url(#g)"/>`;
}

function zellige(p, rand) {
  const seed = Math.floor(rand() * 999);
  const T = 100, h = T / 2;
  // étoile à 8 branches = deux carrés superposés, l'un tourné de 45°
  const sq = 30;
  const star = `
    <rect x="${h - sq}" y="${h - sq}" width="${sq * 2}" height="${sq * 2}"/>
    <rect x="${h - sq}" y="${h - sq}" width="${sq * 2}" height="${sq * 2}" transform="rotate(45 ${h} ${h})"/>`;
  // légères variations d'émail cellule par cellule
  let glaze = '';
  for (let y = 0; y < S; y += T) for (let x = 0; x < S; x += T) {
    glaze += `<rect x="${x}" y="${y}" width="${T}" height="${T}" fill="#fff" opacity="${r1(rand() * 0.12)}"/>`;
  }
  return `
  <defs>
    <pattern id="z" width="${T}" height="${T}" patternUnits="userSpaceOnUse">
      <rect width="${T}" height="${T}" fill="${p.base}"/>
      <g fill="${p.accent}" opacity=".9">${star}</g>
      <circle cx="${h}" cy="${h}" r="12" fill="${p.base}"/>
      <g fill="${p.accent}" opacity=".9">
        <path d="M0 0 L14 0 L0 14 Z"/><path d="M${T} 0 L${T - 14} 0 L${T} 14 Z"/>
        <path d="M0 ${T} L14 ${T} L0 ${T - 14} Z"/><path d="M${T} ${T} L${T - 14} ${T} L${T} ${T - 14} Z"/>
      </g>
    </pattern>
    ${grain('g', seed, 0.1, 0.7)}
    <radialGradient id="shine" cx=".3" cy=".25" r=".9"><stop offset="0" stop-color="#fff" stop-opacity=".28"/><stop offset=".6" stop-color="#fff" stop-opacity="0"/></radialGradient>
  </defs>
  <rect width="${S}" height="${S}" fill="url(#z)"/>
  ${glaze}
  <rect width="${S}" height="${S}" filter="url(#g)"/>
  <rect width="${S}" height="${S}" fill="url(#shine)"/>`;
}

function dunes(p, rand) {
  const seed = Math.floor(rand() * 999);
  let waves = '';
  for (let y = 10; y < S + 40; y += 22) {
    const ph = rand() * 120;
    let d = `M-20 ${y}`;
    for (let x = -20; x <= S + 40; x += 60) d += ` Q${r1(x + 30)} ${r1(y + Math.sin((x + ph) / 70) * 14 - 8)} ${r1(x + 60)} ${r1(y + Math.sin((x + ph + 60) / 70) * 10)}`;
    waves += `<path d="${d}" fill="none" stroke="${p.accent}" stroke-width="5" stroke-opacity=".55"/><path d="${d}" transform="translate(0 4)" fill="none" stroke="#fff" stroke-width="3" stroke-opacity=".5"/>`;
  }
  return `
  <defs>
    <filter id="soft"><feGaussianBlur stdDeviation="1.6"/></filter>
    ${grain('g', seed, 0.08, 0.8)}
  </defs>
  <rect width="${S}" height="${S}" fill="${p.base}"/>
  <g filter="url(#soft)">${waves}</g>
  <rect width="${S}" height="${S}" filter="url(#g)"/>`;
}

const painters = { marble, stone, wood, terrazzo, zellige, dunes };
for (const prod of products) {
  const fn = painters[prod.pattern.type];
  if (!fn) throw new Error(`Motif inconnu : ${prod.pattern.type}`);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${S} ${S}" width="${S}" height="${S}" preserveAspectRatio="xMidYMid slice">${fn(prod.pattern, rng(prod.slug))}</svg>\n`;
  writeFileSync(new URL(`${prod.slug}.svg`, OUT), svg);
}

// ── Illustration du hero : dunes au coucher du soleil ─────────
{
  const W = 1600, H = 900, rand = rng('hero');
  const layers = [
    ['#e9b98a', 520], ['#d99a68', 600], ['#c47a4c', 680], ['#a85c37', 760], ['#7d4025', 840],
  ];
  let dunesSvg = '';
  layers.forEach(([c, base], i) => {
    let d = `M0 ${base}`;
    let x = 0;
    while (x < W) {
      const w = 260 + rand() * 340, peak = base - 60 - rand() * (120 - i * 12);
      d += ` C${r1(x + w * 0.35)} ${r1(peak)} ${r1(x + w * 0.55)} ${r1(peak)} ${r1(x + w)} ${r1(base + (rand() - 0.5) * 40)}`;
      x += w;
    }
    d += ` L${W} ${H} L0 ${H} Z`;
    dunesSvg += `<path d="${d}" fill="${c}"/>`;
  });
  const hero = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid slice">
  <defs>
    <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3a2a3f"/><stop offset=".45" stop-color="#b8644a"/><stop offset=".75" stop-color="#f0b77c"/></linearGradient>
    <radialGradient id="sun" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#fff2d6"/><stop offset=".55" stop-color="#ffd59a" stop-opacity=".9"/><stop offset="1" stop-color="#ffd59a" stop-opacity="0"/></radialGradient>
    <filter id="g" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency=".8" numOctaves="2" seed="4"/><feColorMatrix type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 .12 0"/></filter>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#sky)"/>
  <circle cx="1120" cy="470" r="260" fill="url(#sun)"/>
  <circle cx="1120" cy="470" r="70" fill="#fff4dc"/>
  ${dunesSvg}
  <rect width="${W}" height="${H}" filter="url(#g)"/>
</svg>\n`;
  writeFileSync(new URL('hero-dunes.svg', IMG), hero);
}

// ── Illustration « À propos » : arches de ksar ─────────
{
  const W = 900, H = 700;
  let arches = '';
  for (let i = 0; i < 4; i++) {
    const x = 70 + i * 200;
    arches += `<path d="M${x} 640 V330 a80 80 0 0 1 160 0 V640 Z" fill="#7d4025" opacity="${0.55 + i * 0.1}"/>`;
    arches += `<path d="M${x + 22} 640 V340 a58 58 0 0 1 116 0 V640 Z" fill="#f0c48f"/>`;
  }
  const about = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}">
  <defs>
    <linearGradient id="wall" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#c98a5a"/><stop offset="1" stop-color="#a85c37"/></linearGradient>
    <linearGradient id="light" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#ffe7c0" stop-opacity=".0"/><stop offset=".6" stop-color="#ffe7c0" stop-opacity=".35"/><stop offset="1" stop-color="#ffe7c0" stop-opacity="0"/></linearGradient>
    <filter id="g" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency=".7" numOctaves="2" seed="11"/><feColorMatrix type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 .18 0"/></filter>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#wall)"/>
  <rect y="640" width="${W}" height="60" fill="#5e3019"/>
  ${arches}
  <rect width="${W}" height="${H}" fill="url(#light)"/>
  <rect width="${W}" height="${H}" filter="url(#g)"/>
</svg>\n`;
  writeFileSync(new URL('about-arches.svg', IMG), about);
}

console.log(`✓ ${products.length} carreaux + 2 illustrations générés`);
