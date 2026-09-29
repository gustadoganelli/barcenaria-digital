import sharp from 'sharp';
const dir = process.argv[2];
const ids = [12,13,14,15,16,17,18,19];
const box = { left: 180, top: 340, width: 720, height: 800 };
const frames = [];
for (const i of ids) {
  const { data, info } = await sharp(`${dir}/f-${String(i).padStart(2,'0')}.png`).extract(box).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  frames.push(data); var W = info.width, H = info.height;
}
const N = W * H, n = frames.length;
const med = Buffer.alloc(N * 3), std = new Float32Array(N);
for (let p = 0; p < N; p++) {
  let s = 0;
  for (let c = 0; c < 3; c++) {
    const vals = frames.map(f => f[p*3+c]).sort((a,b)=>a-b);
    med[p*3+c] = vals[n>>1];
    const mean = vals.reduce((a,b)=>a+b,0)/n;
    s += vals.reduce((a,b)=>a+(b-mean)**2,0)/n;
  }
  std[p] = Math.sqrt(s/3);
}
// static mask
let mask = new Uint8Array(N);
for (let p = 0; p < N; p++) {
  const r = med[p*3], g = med[p*3+1], b = med[p*3+2];
  const mx = Math.max(r, g, b), mn = Math.min(r, g, b);
  const sat = mx === 0 ? 0 : (mx - mn) / mx;
  // plaque pixels are saturated green or bright gold; the static ceiling is dark gray
  mask[p] = std[p] < Number(process.argv[3] || 6) && (sat > 0.28 || mx > 120) ? 1 : 0;
}
// largest connected component from center
const seen = new Uint8Array(N); const comp = new Uint8Array(N);
const start = (H>>1) * W + (W>>1);
const q = [start]; seen[start] = 1;
while (q.length) { const p = q.pop(); comp[p] = 1; const x = p % W, y = (p / W) | 0;
  for (const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]) { const nx=x+dx, ny=y+dy; if (nx<0||ny<0||nx>=W||ny>=H) continue; const np=ny*W+nx; if (!seen[np] && mask[np]) { seen[np]=1; q.push(np); } } }
// fill holes: background = flood from border over non-comp
const bg = new Uint8Array(N); const q2 = [];
for (let x=0;x<W;x++){ for (const y of [0,H-1]) { const p=y*W+x; if(!comp[p]&&!bg[p]){bg[p]=1;q2.push(p);} } }
for (let y=0;y<H;y++){ for (const x of [0,W-1]) { const p=y*W+x; if(!comp[p]&&!bg[p]){bg[p]=1;q2.push(p);} } }
while (q2.length) { const p=q2.pop(); const x=p%W, y=(p/W)|0; for (const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]) { const nx=x+dx, ny=y+dy; if (nx<0||ny<0||nx>=W||ny>=H) continue; const np=ny*W+nx; if(!bg[np]&&!comp[np]){bg[np]=1;q2.push(np);} } }
const alpha = Buffer.alloc(N); let cnt=0;
for (let p=0;p<N;p++){ alpha[p] = bg[p] ? 0 : 255; if(!bg[p]) cnt++; }
console.log('W,H', W, H, 'fg ratio', (cnt/N).toFixed(3));
// soften edges
const a = await sharp(alpha, { raw: { width: W, height: H, channels: 1 } }).blur(1.2).extractChannel(0).raw().toBuffer();
const rgba = Buffer.alloc(N*4);
for (let p=0;p<N;p++){ rgba[p*4]=med[p*3]; rgba[p*4+1]=med[p*3+1]; rgba[p*4+2]=med[p*3+2]; rgba[p*4+3]=a[p]; }
await sharp(rgba, { raw: { width: W, height: H, channels: 4 } }).trim({ threshold: 1 }).png().toFile(`${dir}/logo-iso.png`);
await sharp(`${dir}/logo-iso.png`).flatten({ background: '#ff00ff' }).toFile(`${dir}/logo-check.png`);
