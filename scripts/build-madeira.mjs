// Generates the procedural wood texture of the bench pieces (public/images/brand/madeira-clara.webp).
// Drawn with SVG turbulence stretched along the grain, so no photo is needed and the tile repeats horizontally.
// Run with `node scripts/build-madeira.mjs`.
import sharp from 'sharp';

function wood({ w, h, base, dark, light, seed, freqX = 0.004, freqY = 0.11, knots = [] }) {
  const knotSvg = knots.map(([x, y, r]) => `
    <ellipse cx="${x}" cy="${y}" rx="${r * 1.9}" ry="${r}" fill="${dark}" opacity=".55" filter="url(#soft)"/>
    <ellipse cx="${x}" cy="${y}" rx="${r * 0.9}" ry="${r * 0.45}" fill="#1c0e05" opacity=".7" filter="url(#soft)"/>`).join('');
  return Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}">
  <defs>
    <filter id="grain" x="0" y="0" width="100%" height="100%">
      <feTurbulence type="fractalNoise" baseFrequency="${freqX} ${freqY}" numOctaves="4" seed="${seed}" stitchTiles="stitch" result="n"/>
      <feColorMatrix in="n" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  1.6 0 0 0 -0.45"/>
    </filter>
    <filter id="fine" x="0" y="0" width="100%" height="100%">
      <feTurbulence type="fractalNoise" baseFrequency="0.02 0.9" numOctaves="2" seed="${seed + 7}" stitchTiles="stitch" result="n"/>
      <feColorMatrix in="n" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0.9 0 0 0 -0.3"/>
    </filter>
    <filter id="soft"><feGaussianBlur stdDeviation="6"/></filter>
    <linearGradient id="tone" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${light}"/><stop offset=".5" stop-color="${base}"/><stop offset="1" stop-color="${dark}"/>
    </linearGradient>
  </defs>
  <rect width="100%" height="100%" fill="url(#tone)"/>
  <rect width="100%" height="100%" fill="${dark}" filter="url(#grain)"/>
  <rect width="100%" height="100%" fill="${light}" filter="url(#fine)" opacity=".5"/>
  ${knotSvg}
</svg>`);
}

const OUT = 'public/images/brand';
// the boards with the dish names: light wood, so the dark letters read well
const info = await sharp(wood({ w: 900, h: 220, base: '#c79a5f', dark: '#a87a42', light: '#dcb47c', seed: 23, freqX: 0.006, freqY: 0.16 }))
  .webp({ quality: 74 }).toFile(`${OUT}/madeira-clara.webp`);
console.log('madeira-clara', `${info.width}x${info.height}`, `${Math.round(info.size / 1024)} KB`);
