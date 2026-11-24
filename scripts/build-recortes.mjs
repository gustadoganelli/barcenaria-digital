// Cuts dishes out of their photos for the "vitrine" (docs/roteiro-vitrine.md): the plate and what is on it stay,
// the table goes. Two parts, joined:
//  - the plate, by contrast: the largest light region from `plate.from` down (thin bits hanging off it are dropped
//    first), each of its rows closed from side to side so the food lying on it comes along;
//  - what stands above the plate (the top of a burger, the lid of a sandwich): a polygon drawn by hand around it,
//    in pixels of the source photo, minus whatever `notFood` recognises as background inside it.
// Holes are filled and the edge is softened. A plate cut by the frame keeps a straight edge on that side
// (`open`), so the page brings that dish in from the same side of the screen.
// A piece with no plate (a wooden board, a bottle and its glass) is cut by its outlines alone: `shapes`, one
// polygon per object, and no `plate`.
// Output: public/images/recortes/<id>.webp, with transparency. Run: `node scripts/build-recortes.mjs`.
import { mkdirSync } from 'node:fs';
import sharp from 'sharp';

const OUT = 'public/images/recortes';
const SCALE = 2;        // work at twice the photo's size: the outline comes out smoother
const MAX_WIDTH = 1200; // of the file that goes to the page
const REEL = 'referencias/instagram/2026-11-20-reel-cardapio-novo';
// outlines read on a print of the photo that starts at (ox, oy) and is reduced k times: back to source pixels
const fromPrint = (points, ox, oy, k) => points.map(([x, y]) => [Math.round(ox + x * k), Math.round(oy + y * k)]);
const ITEMS = [
  {
    id: 'burger-barcenaria', src: `${REEL}-burger.jpg`, area: [4, 470, 1006, 730],
    plate: { from: 785, luma: 0.4, sat: 0.72, open: 'left' },
    food: [[80, 820], [78, 735], [100, 690], [130, 640], [185, 598], [235, 560], [295, 535], [360, 522], [425, 532], [450, 548], [480, 520], [525, 498], [605, 503], [685, 545], [733, 618], [763, 700], [775, 770], [774, 835], [752, 905], [705, 948], [680, 940], [640, 880], [610, 820]],
    notFood: ({ r, luma }) => luma < 0.25 || r < 0.35,                                  // the dark leather sofa
  },
  {
    id: 'parmegiana', src: `${REEL}-parmegiana.jpg`, area: [4, 900, 1006, 800],
    plate: { from: 1125, luma: 0.6, sat: 0.7 },
    food: [[128, 1235], [126, 1150], [138, 1095], [143, 1090], [195, 1050], [250, 1019], [300, 994], [400, 969], [500, 952], [600, 944], [700, 959], [742, 985], [750, 1010], [744, 1040], [765, 1072], [775, 1100], [830, 1115], [862, 1140], [870, 1200], [860, 1235]],
    // the orange table top and the green place mat (the white card on the table is kept out by the polygon)
    notFood: ({ r, g, luma, sat }) => (sat > 0.88 && luma > 0.3 && g > r * 0.38 && g < r * 0.72) || (g > r * 1.15 && luma < 0.42),
  },
  {
    // the round wooden board with the torresmo, on the yellow table of the veranda (photo of 24/09, 3072 px wide)
    id: 'torresmo-de-rolo', src: 'referencias/instagram/2026-09-24-torresmo-mesa.jpg', area: [60, 2330, 2200, 1560], scale: 0.5,
    shapes: [fromPrint([[74, 700], [84, 600], [112, 520], [160, 430], [225, 365], [300, 318], [400, 262], [500, 226], [600, 202], [700, 182], [733, 160], [748, 120], [775, 100], [815, 98], [845, 118], [850, 150], [900, 140], [1000, 130], [1110, 135], [1200, 125], [1270, 140], [1300, 152], [1400, 166], [1500, 190], [1600, 236], [1700, 292], [1775, 355], [1835, 430], [1880, 520], [1903, 610], [1908, 700], [1895, 800], [1860, 890], [1810, 958], [1700, 1068], [1610, 1130], [1530, 1180], [1440, 1218], [1340, 1250], [1230, 1277], [1120, 1296], [1000, 1308], [900, 1312], [790, 1305], [680, 1290], [570, 1265], [480, 1238], [390, 1205], [300, 1160], [225, 1105], [165, 1045], [120, 975], [92, 900], [76, 800]], 60, 2330, 1.1)],
    notFood: ({ luma, sat }) => sat > 0.8 && luma > 0.55,                                // the yellow table top
  },
  {
    // the bottle and the glass of the house's own art of the beer (post of 04/09)
    id: 'barcenaipa', src: 'referencias/instagram/2026-09-04-barcenaipa.jpg', area: [0, 360, 560, 800],
    shapes: [
      fromPrint([[350, 34], [434, 34], [437, 52], [431, 62], [431, 128], [434, 165], [441, 205], [455, 250], [477, 292], [492, 335], [500, 362], [501, 715], [495, 738], [478, 750], [304, 750], [286, 738], [279, 715], [280, 362], [288, 335], [304, 292], [326, 250], [341, 205], [347, 165], [349, 128], [349, 62], [346, 52]], 0, 360, 1),
      fromPrint([[56, 262], [70, 252], [150, 247], [228, 252], [241, 262], [246, 300], [256, 360], [266, 420], [268, 470], [258, 510], [235, 545], [200, 570], [172, 582], [166, 600], [166, 650], [190, 668], [232, 685], [246, 702], [238, 720], [200, 732], [145, 736], [90, 732], [52, 720], [44, 702], [58, 685], [100, 668], [124, 650], [124, 600], [118, 582], [90, 570], [55, 545], [32, 510], [22, 470], [24, 420], [34, 360], [46, 300]], 0, 360, 1),
    ],
  },
];

function largestRegion(on, w, h) {
  const label = new Int32Array(w * h).fill(-1);
  const stack = new Int32Array(w * h);
  let best = -1, bestSize = 0, id = 0;
  for (let s = 0; s < w * h; s++) {
    if (!on[s] || label[s] >= 0) continue;
    let top = 0, size = 0;
    stack[top++] = s; label[s] = id;
    while (top) {
      const p = stack[--top]; size++;
      const x = p % w, y = (p / w) | 0;
      if (x > 0 && on[p - 1] && label[p - 1] < 0) { label[p - 1] = id; stack[top++] = p - 1; }
      if (x < w - 1 && on[p + 1] && label[p + 1] < 0) { label[p + 1] = id; stack[top++] = p + 1; }
      if (y > 0 && on[p - w] && label[p - w] < 0) { label[p - w] = id; stack[top++] = p - w; }
      if (y < h - 1 && on[p + w] && label[p + w] < 0) { label[p + w] = id; stack[top++] = p + w; }
    }
    if (size > bestSize) { bestSize = size; best = id; }
    id++;
  }
  const out = new Uint8Array(w * h);
  for (let i = 0; i < w * h; i++) out[i] = label[i] === best ? 1 : 0;
  return out;
}

// what the region encloses becomes part of it: flood the outside from the border, the rest is inside
function fillHoles(region, w, h) {
  const outside = new Uint8Array(w * h);
  const stack = [];
  const push = (p) => { if (!region[p] && !outside[p]) { outside[p] = 1; stack.push(p); } };
  for (let x = 0; x < w; x++) { push(x); push((h - 1) * w + x); }
  for (let y = 0; y < h; y++) { push(y * w); push(y * w + w - 1); }
  while (stack.length) {
    const p = stack.pop(), x = p % w, y = (p / w) | 0;
    if (x > 0) push(p - 1);
    if (x < w - 1) push(p + 1);
    if (y > 0) push(p - w);
    if (y < h - 1) push(p + w);
  }
  const out = new Uint8Array(w * h);
  for (let i = 0; i < w * h; i++) out[i] = outside[i] ? 0 : 255;
  return out;
}

mkdirSync(OUT, { recursive: true });
for (const it of ITEMS) {
  const [left, top, aw, ah] = it.area;
  const S = it.scale ?? SCALE;
  const w = Math.round(aw * S), h = Math.round(ah * S);
  const rgb = await sharp(it.src).extract({ left, top, width: aw, height: ah }).resize({ width: w, height: h, kernel: 'lanczos3' }).removeAlpha().raw().toBuffer();
  // one-channel mask in, one-channel mask out: blurred, then cut at a level (above 128 wears it down, below grows it)
  const morph = async (bytes, blur, cut) => {
    const out = await sharp(Buffer.from(bytes), { raw: { width: w, height: h, channels: 1 } })
      .blur(blur).threshold(cut).extractChannel(0).raw().toBuffer();
    if (out.length !== w * h) throw new Error(`mask of ${it.id}: ${out.length} bytes for ${w * h} pixels`);
    return out;
  };
  const polygons = (it.shapes ?? [it.food]).map((shape) => `<polygon points="${shape.map(([x, y]) => `${(x - left) * S},${(y - top) * S}`).join(' ')}" fill="#fff"/>`).join('');
  const inPoly = await sharp(Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}"><rect width="100%" height="100%" fill="#000"/>${polygons}</svg>`))
    .extractChannel(0).raw().toBuffer();
  if (inPoly.length !== w * h) throw new Error(`polygon of ${it.id}: ${inPoly.length} bytes for ${w * h} pixels`);
  const plateFrom = it.plate ? (it.plate.from - top) * S : 0;
  const plateOn = new Uint8Array(w * h), foodOn = new Uint8Array(w * h);
  for (let i = 0; i < w * h; i++) {
    const r = rgb[i * 3] / 255, g = rgb[i * 3 + 1] / 255, b = rgb[i * 3 + 2] / 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    const px = { r, g, b, luma: 0.299 * r + 0.587 * g + 0.114 * b, sat: max === 0 ? 0 : (max - min) / max };
    if (it.plate && ((i / w) | 0) >= plateFrom && px.luma > it.plate.luma && px.sat < it.plate.sat) plateOn[i] = 255;
    if (inPoly[i] > 127 && !it.notFood?.(px)) foodOn[i] = 255;
  }
  // the plate — opening: wear the light region down so napkins and reflections touching it let go, pick the
  // largest piece, then grow it back (never beyond what was light)
  const region = new Uint8Array(w * h);
  if (it.plate) {
    const core = largestRegion(await morph(plateOn, 5, 215), w, h);
    const grown = await morph(core.map((v) => v * 255), 5, 40);
    for (let i = 0; i < w * h; i++) region[i] = grown[i] && plateOn[i] ? 1 : 0;
  }
  // close each row from the first to the last pixel of the plate (the food can reach the rim)
  for (let y = 0; y < h; y++) {
    let a = -1, b = -1;
    for (let x = 0; x < w; x++) if (region[y * w + x]) { if (a < 0) a = x; b = x; }
    if (a < 0) continue;
    // only the rows where the plate does reach the frame
    if (it.plate.open === 'left' && a < 16 * S) a = 0;
    if (it.plate.open === 'right' && b > w - 16 * S) b = w - 1;
    for (let x = a; x <= b; x++) region[y * w + x] = 1;
  }
  // what stands above the plate: worn a little (its edge picks up the background), and only the piece that is
  // one with the plate
  const food = await morph(await morph(foodOn, 4, 185), 3, 110);
  for (let i = 0; i < w * h; i++) if (food[i]) region[i] = 1;
  const whole = it.plate ? largestRegion(region, w, h) : region; // separate objects (bottle, glass) all stay
  // pull the outline in a little (the rim picks up the colour of the table) and soften it
  const alpha = await sharp(Buffer.from(await morph(fillHoles(whole, w, h), 3, 170)), { raw: { width: w, height: h, channels: 1 } })
    .blur(1.2).extractChannel(0).raw().toBuffer();
  const rgba = Buffer.alloc(w * h * 4);
  for (let i = 0; i < w * h; i++) { rgba[i * 4] = rgb[i * 3]; rgba[i * 4 + 1] = rgb[i * 3 + 1]; rgba[i * 4 + 2] = rgb[i * 3 + 2]; rgba[i * 4 + 3] = alpha[i]; }
  const cut = await sharp(rgba, { raw: { width: w, height: h, channels: 4 } }).trim().png().toBuffer();
  const res = await sharp(cut).resize({ width: MAX_WIDTH, withoutEnlargement: true }).webp({ quality: 86, alphaQuality: 90 }).toFile(`${OUT}/${it.id}.webp`);
  console.log(it.id, `${res.width}x${res.height}`, `${Math.round(res.size / 1024)} KB`);
}
