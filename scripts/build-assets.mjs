// Generates every optimized asset in public/ from the raw material in referencias/.
// Re-run with `npm run assets` whenever a source image, crop or video cut changes.
import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, rmSync, existsSync, statSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import sharp from 'sharp';
import ffmpeg from 'ffmpeg-static';

const IG = 'referencias/instagram';
const OUT = 'public';
const REEL = {
  varanda: `${IG}/2026-09-29-reel-varanda.mp4`,
  rooftop: `${IG}/2026-09-24-reel-rooftop.mp4`,
  eventos: `${IG}/2026-09-27-reel-eventos.mp4`,
};
const PHOTO = {
  torresmoMesa: `${IG}/2026-09-24-torresmo-mesa.jpg`,
  sinuca: `${IG}/2026-09-17-quinta-sinuca-espetinho.jpg`,
  feijoada: `${IG}/2026-09-10-feijoada-sabado.jpg`,
  chopp: `${IG}/2026-09-09-chopp-double.jpg`,
  fraldinha: `${IG}/2026-09-04-fraldinha-na-chapa.jpg`,
  ipa: `${IG}/2026-09-04-barcenaipa.jpg`,
  linguica: `${IG}/2026-09-04-linguica-artesanal.jpg`,
  jorgeAmado: `${IG}/2026-08-30-drink-resina-jorge-amado.jpg`,
  bucha: `${IG}/2026-08-30-bucha-torresmo-de-rolo.jpg`,
};

const tmp = mkdtempSync(join(tmpdir(), 'barcenaria-'));
const frameCache = new Map();

function frame(video, t) {
  const key = `${video}@${t}`;
  if (frameCache.has(key)) return frameCache.get(key);
  const file = join(tmp, `f-${frameCache.size}.png`);
  execFileSync(ffmpeg, ['-hide_banner', '-loglevel', 'error', '-y', '-ss', String(t), '-i', video, '-frames:v', '1', file]);
  frameCache.set(key, file);
  return file;
}

// crop: [left, top, width, height] in source pixels; widths: output widths (never upscaled)
const IMAGES = [
  // A casa — ambiente (quadros dos reels e fotos do feed)
  { id: 'casa/fachada', src: () => frame(REEL.varanda, 32.5), widths: [480, 720] },
  { id: 'casa/deck', src: () => frame(REEL.varanda, 34.5), widths: [480, 720] },
  { id: 'casa/deck-sol', src: () => frame(REEL.varanda, 10.5), widths: [480, 720] },
  { id: 'casa/bar', src: () => frame(REEL.varanda, 26.5), widths: [480, 720] },
  { id: 'casa/salao', src: () => frame(REEL.varanda, 16.5), widths: [480, 720] },
  { id: 'casa/janela', src: () => frame(REEL.varanda, 18.5), widths: [480, 720] },
  { id: 'casa/telao', src: () => frame(REEL.varanda, 4.5), crop: [0, 0, 720, 760], widths: [480, 720] },
  { id: 'casa/sinuca', src: () => PHOTO.sinuca, widths: [640, 1200] },
  { id: 'casa/sinuca-tv', src: () => frame(REEL.varanda, 20.5), widths: [480, 720] },
  { id: 'casa/varanda-noite', src: () => PHOTO.torresmoMesa, crop: [0, 0, 3072, 2350], widths: [800, 1600] },
  { id: 'casa/rooftop', src: () => frame(REEL.rooftop, 14.5), crop: [0, 0, 1080, 1300], widths: [540, 1080] },
  { id: 'casa/rooftop-mesas', src: () => frame(REEL.rooftop, 18.5), crop: [0, 0, 1080, 1300], widths: [540, 1080] },
  { id: 'casa/churrasqueira', src: () => frame(REEL.rooftop, 4.5), crop: [0, 0, 1080, 1300], widths: [540, 1080] },
  { id: 'eventos/mesa-posta', src: () => frame(REEL.eventos, 2.5), widths: [540, 1080] },
  { id: 'eventos/mesa-longa', src: () => frame(REEL.eventos, 8.5), widths: [540, 1080] },
  { id: 'eventos/mesa-tijolo', src: () => frame(REEL.eventos, 0.5), widths: [540, 1080] },
  // Bebidas e drinks
  { id: 'bar/drink-spritz', src: () => frame(REEL.varanda, 14.5), widths: [480, 720] },
  { id: 'bar/bartender', src: () => frame(REEL.varanda, 30.5), widths: [480, 720] },
  { id: 'bar/drink-escuro', src: () => frame(REEL.varanda, 24.5), widths: [480, 720] },
  { id: 'bar/chopp-brahma', src: () => PHOTO.chopp, crop: [560, 310, 400, 750], widths: [400] },
  { id: 'bar/barcenaipa', src: () => PHOTO.ipa, crop: [10, 370, 500, 780], widths: [500] },
  { id: 'bar/resina-jorge-amado', src: () => PHOTO.jorgeAmado, crop: [560, 380, 694, 660], widths: [480, 694] },
  // Pratos (recortes sem texto dos flyers + foto real da mesa)
  { id: 'pratos/bucha-torresmo-de-rolo', src: () => PHOTO.bucha, crop: [462, 340, 746, 674], widths: [480, 746] },
  { id: 'pratos/torresmo-na-mesa', src: () => PHOTO.torresmoMesa, crop: [0, 2050, 2800, 1850], widths: [800, 1400] },
  { id: 'pratos/fraldinha-na-chapa', src: () => PHOTO.fraldinha, crop: [585, 535, 650, 475], widths: [480, 650] },
  { id: 'pratos/linguica-artesanal', src: () => PHOTO.linguica, crop: [385, 560, 785, 525], widths: [480, 785] },
  { id: 'pratos/feijoada', src: () => PHOTO.feijoada, crop: [460, 500, 700, 600], widths: [480, 700] },
  // Promoções (artes completas publicadas pela casa)
  { id: 'promos/chopp-double', src: () => PHOTO.chopp, widths: [640, 1080] },
  { id: 'promos/feijoada-sabado', src: () => PHOTO.feijoada, widths: [640, 1080] },
  { id: 'promos/resina-jorge-amado', src: () => PHOTO.jorgeAmado, widths: [640, 1080] },
  { id: 'promos/bucha-torresmo', src: () => PHOTO.bucha, widths: [640, 1080] },
  { id: 'promos/fraldinha', src: () => PHOTO.fraldinha, widths: [640, 1080] },
  { id: 'promos/linguica', src: () => PHOTO.linguica, widths: [640, 1080] },
  { id: 'promos/barcenaipa', src: () => PHOTO.ipa, widths: [640, 1080] },
  { id: 'promos/quinta-sinuca', src: () => PHOTO.sinuca, widths: [640, 1080] },
];

// Hero: short loop of the best shots of the "varanda" reel (no captions in these ranges)
const HERO_CUTS = [[32.0, 35.8], [10.0, 12.0], [26.0, 28.8], [14.0, 16.4], [20.0, 22.0]];

const kb = (f) => `${Math.round(statSync(f).size / 1024)}KB`;
const ensureDir = (f) => mkdirSync(f.slice(0, f.lastIndexOf('/')), { recursive: true });

async function buildImages() {
  for (const img of IMAGES) {
    const src = img.src();
    const meta = await sharp(src).metadata();
    for (const w of img.widths) {
      let pipe = sharp(src);
      if (img.crop) {
        const [left, top, width, height] = img.crop;
        pipe = pipe.extract({ left, top, width: Math.min(width, meta.width - left), height: Math.min(height, meta.height - top) });
      }
      const out = `${OUT}/images/${img.id}-${w}.webp`;
      ensureDir(out);
      await pipe.resize({ width: w, withoutEnlargement: true }).webp({ quality: 74, effort: 5 }).toFile(out);
      console.log('img ', out, kb(out));
    }
  }
}

async function buildBrand() {
  const logo = 'referencias/brand/logo-placa.png';
  const dir = `${OUT}/images/brand`;
  mkdirSync(dir, { recursive: true });
  for (const w of [160, 320, 640]) {
    await sharp(logo).resize({ width: w }).webp({ quality: 88, alphaQuality: 90 }).toFile(`${dir}/logo-placa-${w}.webp`);
  }
  await sharp(logo).resize({ width: 320 }).png({ compressionLevel: 9 }).toFile(`${dir}/logo-placa-320.png`);
  // App icon: plaque centered on brand green
  const icon = await sharp(logo).resize({ height: 150 }).toBuffer();
  await sharp({ create: { width: 180, height: 180, channels: 4, background: '#0d1508' } })
    .composite([{ input: icon, gravity: 'center' }]).png().toFile(`${dir}/apple-touch-icon.png`);
  // Social preview 1200x630: darkened deck photo + plaque
  const bg = await sharp(frame(REEL.varanda, 34.5)).resize(1200, 630, { fit: 'cover', position: 'centre' })
    .modulate({ brightness: 0.45, saturation: 0.8 }).toBuffer();
  const plaque = await sharp(logo).resize({ height: 520 }).toBuffer();
  await sharp(bg).composite([{ input: plaque, gravity: 'center' }]).jpeg({ quality: 82, mozjpeg: true }).toFile(`${dir}/og-image.jpg`);
  console.log('brand', dir);
}

function buildVideos() {
  const dir = `${OUT}/video`;
  mkdirSync(dir, { recursive: true });
  const trims = HERO_CUTS.map(([a, b], i) => `[0:v]trim=${a}:${b},setpts=PTS-STARTPTS,scale=720:1280,fps=30[v${i}]`).join(';');
  const concat = HERO_CUTS.map((_, i) => `[v${i}]`).join('') + `concat=n=${HERO_CUTS.length}:v=1:a=0[out]`;
  const x264 = ['-c:v', 'libx264', '-profile:v', 'high', '-pix_fmt', 'yuv420p', '-preset', 'slow', '-movflags', '+faststart', '-an'];
  execFileSync(ffmpeg, ['-hide_banner', '-loglevel', 'error', '-y', '-i', REEL.varanda, '-filter_complex', `${trims};${concat}`, '-map', '[out]', '-crf', '27', ...x264, `${dir}/hero.mp4`]);
  execFileSync(ffmpeg, ['-hide_banner', '-loglevel', 'error', '-y', '-i', REEL.eventos, '-vf', 'scale=720:1280,fps=30', '-crf', '28', ...x264, `${dir}/eventos.mp4`]);
}

async function buildPosters() {
  const dir = `${OUT}/video`;
  for (const name of ['hero', 'eventos']) {
    const png = join(tmp, `${name}-poster.png`);
    execFileSync(ffmpeg, ['-hide_banner', '-loglevel', 'error', '-y', '-ss', '0.1', '-i', `${dir}/${name}.mp4`, '-frames:v', '1', png]);
    await sharp(png).webp({ quality: 70 }).toFile(`${dir}/${name}-poster.webp`);
    console.log('video', `${dir}/${name}.mp4`, kb(`${dir}/${name}.mp4`), 'poster', kb(`${dir}/${name}-poster.webp`));
  }
}

// public/data/imagens.json: id -> { widths, ratio } so pages can build srcset without guessing file names
async function writeManifest() {
  const manifest = {};
  for (const img of IMAGES) {
    const largest = `${OUT}/images/${img.id}-${img.widths.at(-1)}.webp`;
    const { width, height } = await sharp(largest).metadata();
    manifest[img.id] = { widths: img.widths, ratio: Number((width / height).toFixed(4)) };
  }
  writeFileSync(`${OUT}/data/imagens.json`, JSON.stringify(manifest, null, 2) + '\n');
  console.log('manifest', `${OUT}/data/imagens.json`, Object.keys(manifest).length, 'imagens');
}

try {
  if (!existsSync(IG)) throw new Error(`Pasta ${IG} não encontrada — rode a partir da raiz do projeto.`);
  if (process.argv.includes('--manifest-only')) { await writeManifest(); process.exit(0); }
  await buildImages();
  await buildBrand();
  buildVideos();
  await buildPosters();
  await writeManifest();
} finally {
  rmSync(tmp, { recursive: true, force: true });
}
