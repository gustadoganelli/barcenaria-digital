// Builds the mask the glass beat of the opening reads (public/assets/js/vidro.js) from the house sign:
//   R = the plate (its outline), G = relief height (the plate with the gold art raised on it, blurred — the shader
//   takes its slope as the glass surface), B = the gold art alone (mug, lettering, rules and scrolls).
// The mask is a square with a power-of-two side, the plate centred in it, so WebGL can build mipmaps: the sign
// ends the ident shrinking to the size of the header logo and must stay clean when small.
// Source: referencias/brand/logo-placa.png. Run: `node scripts/build-vidro.mjs`.
// The script prints the share of the square the plate takes; vidro.js has the same two numbers (PLACA).
import sharp from 'sharp';

const SRC = 'referencias/brand/logo-placa.png';
const OUT = 'public/images/brand/logo-vidro.webp';
const S = 1024;      // side of the mask
const FIT = 0.86;    // the plate's height as a share of the side (the rest is room for the bevel)

const { data, info } = await sharp(SRC).resize({ height: Math.round(S * FIT) }).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
const ox = Math.round((S - info.width) / 2), oy = Math.round((S - info.height) / 2);
const n = S * S;
const plate = new Float32Array(n), gold = new Float32Array(n);
for (let y = 0; y < info.height; y++) {
  for (let x = 0; x < info.width; x++) {
    const i = (y * info.width + x) * 4, o = (y + oy) * S + (x + ox);
    const a = data[i + 3] / 255;
    const luma = (0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]) / 255;
    plate[o] = a;
    gold[o] = a * Math.min(1, Math.max(0, (luma - 0.3) / 0.22)); // the art is gold on dark green
  }
}

// separable box blur, three passes (close to a gaussian)
function blur(src, r) {
  let a = Float32Array.from(src), b = new Float32Array(n);
  const at = (v) => Math.min(S - 1, Math.max(0, v));
  for (let pass = 0; pass < 3; pass++) {
    for (let y = 0; y < S; y++) {
      let s = 0;
      for (let x = -r; x <= r; x++) s += a[y * S + at(x)];
      for (let x = 0; x < S; x++) { b[y * S + x] = s / (2 * r + 1); s += a[y * S + at(x + r + 1)] - a[y * S + at(x - r)]; }
    }
    for (let x = 0; x < S; x++) {
      let s = 0;
      for (let y = -r; y <= r; y++) s += b[at(y) * S + x];
      for (let y = 0; y < S; y++) { a[y * S + x] = s / (2 * r + 1); s += b[at(y + r + 1) * S + x] - b[at(y - r) * S + x]; }
    }
  }
  return a;
}
const edge = blur(plate, Math.round(info.width / 95));               // the bevel of the plate
const art = blur(gold, Math.max(1, Math.round(info.width / 275)));   // the raised art: a tighter slope
const crisp = blur(plate, 2);                                        // the cut-out of the source is a little rough: soften it

const out = Buffer.alloc(n * 3);
for (let i = 0; i < n; i++) {
  out[i * 3] = Math.round(crisp[i] * 255);
  out[i * 3 + 1] = Math.round(Math.min(1, edge[i] * 0.62 + art[i] * 0.38) * 255);
  out[i * 3 + 2] = Math.round(gold[i] * 255);
}
const res = await sharp(out, { raw: { width: S, height: S, channels: 3 } }).webp({ lossless: true, effort: 6 }).toFile(OUT);
console.log('logo-vidro', `${res.width}x${res.height}`, `${Math.round(res.size / 1024)} KB`, 'PLACA', { w: +(info.width / S).toFixed(4), h: +(info.height / S).toFixed(4) });
