// Extracts the frame sequences of the saw scenes (docs/cena-serrote.md) from the stock footage in
// referencias/serra/ (Pexels license: free commercial use, no attribution; sources in referencias/fontes-serra.md).
// The page scrubs these frames with the scroll, like a film advanced by hand. Run: `node scripts/build-serra.mjs`.
import { execFileSync } from 'node:child_process';
import { mkdirSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import ffmpeg from 'ffmpeg-static';

const OUT = 'public/video/serra';
const SETS = [
  // the opening, phone: a 9:16 window of the 4K frame around the saw, the hand and the spot where the block lands
  { id: 'p', src: 'referencias/serra/pexels-5972630-uhd.mp4', fps: 10, vf: 'crop=1215:2160:1080:0,scale=720:1280', q: 64 },
  // the opening, wide screens: the whole frame
  { id: 'l', src: 'referencias/serra/pexels-5972630-uhd.mp4', fps: 10, vf: 'scale=1280:720', q: 64 },
  // the bench: the back saw on the workbench, 16:10 (the page crops it to the box it has)
  { id: 'b', src: 'referencias/serra/pexels-5973239-hd.mp4', fps: 8, vf: 'crop=1728:1080:96:0,scale=800:500', q: 58 },
];

// frames are overwritten in place (removing the folder fails while OneDrive is syncing it)
mkdirSync(OUT, { recursive: true });
const manifest = {};
for (const s of SETS) {
  execFileSync(ffmpeg, ['-nostdin', '-loglevel', 'error', '-y', '-i', s.src, '-vf', `fps=${s.fps},${s.vf}`,
    '-c:v', 'libwebp', '-quality', String(s.q), '-compression_level', '6', '-start_number', '0', `${OUT}/${s.id}-%03d.webp`]);
  const files = readdirSync(OUT).filter((f) => f.startsWith(`${s.id}-`));
  const bytes = files.reduce((n, f) => n + statSync(`${OUT}/${f}`).size, 0);
  const [w, h] = s.vf.match(/scale=(\d+):(\d+)/).slice(1).map(Number);
  manifest[s.id] = { frames: files.length, width: w, height: h };
  console.log(s.id, files.length, 'quadros', `${w}x${h}`, `${Math.round(bytes / 1024)} KB`);
}
writeFileSync(`${OUT}/serra.json`, JSON.stringify(manifest) + '\n');
