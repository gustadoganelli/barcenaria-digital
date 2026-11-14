// Barcenaria — second beat of the opening ident (docs/cena-serrote.md): when the board parts after the saw, the
// house sign is there as a plate of glass in front of warm light — refraction with a little dispersion, lit
// bevels, the gold art raised on it, a light that sweeps across while the camera pulls back. Then the stage
// dissolves, the site shows behind, and the sign flies up to the corner and lands on the logo of the header.
// Same technique as the opening of the C41 site (a WebGL fragment shader; the look follows the in-camera glass
// intro Apple filmed for Apple TV in 2025), with the Barcenaria sign and palette.
// Decoration only: it joins the ident only if it is ready before the board parts; otherwise, without WebGL, or
// if the visitor dismisses the ident, the plain ending (the board opens straight onto the site) stays.
const root = document.documentElement;
const ident = window.__corte;                      // set by corte-boot.js when the ident plays
const canvas = document.querySelector('.corte__vidro');

// the ident's clock, in ms (the board parts at 1580; corte.css fades the layer out from 3950)
const INICIO = 1200;   // the lights start
const LIMITE = 1450;   // not ready by then: stay out
const FIM = 4200;      // the layer has faded: take it out
// the beat's own time, in s from INICIO
const VOO = 2.0;       // the stage starts to dissolve and the sign leaves for the header
const VOO_DUR = 0.8;
// share of the square mask the plate takes (printed by scripts/build-vidro.mjs)
const PLACA = { w: 0.7705, h: 0.8604 };

const VERT = 'attribute vec2 aPos; void main() { gl_Position = vec4(aPos, 0.0, 1.0); }';
const FRAG = `
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif
uniform vec2 uRes;
uniform float uT;
uniform sampler2D uLogo;   // r: the plate, g: relief height, b: the gold art
uniform vec4 uRect;        // the mask on screen: center xy, size zw (canvas px, origin bottom-left)
uniform vec2 uTexel;
uniform float uBeamX;
uniform float uBeamI;
uniform float uExp;
uniform float uVeu;        // 1: the stage is there; 0: only the sign is left, the page shows through

const vec3 BASE = vec3(0.043, 0.071, 0.027);
const vec3 GOLD = vec3(0.890, 0.812, 0.576);
const vec3 AMBER = vec3(0.930, 0.600, 0.200);
const vec3 GREEN = vec3(0.200, 0.450, 0.160);
const vec3 MOSS = vec3(0.360, 0.420, 0.140);
const vec3 COPPER = vec3(0.700, 0.360, 0.160);
const vec3 OURO = vec3(0.860, 0.690, 0.330);   // the gold of the art on the sign, deeper than the light

// a round pool of light; r is a fraction of the shorter side of the screen, so it stays round on phones too
float blob(vec2 q, vec2 c, float r, float asp) {
  vec2 d = (q - c) * vec2(max(asp, 1.0), max(1.0 / asp, 1.0));
  return exp(-dot(d, d) / (r * r));
}

// The light behind the glass: slow pools of bar light, plus the sweep. s > 1 softens it (frosted glass).
vec3 luz(vec2 q, float s, float asp) {
  float t = uT;
  vec3 c = vec3(0.0);
  c += GOLD * 0.95 * blob(q, vec2(0.52 + 0.08 * sin(t * 0.41), 0.56 + 0.07 * cos(t * 0.33)), 0.30 * s, asp);
  c += AMBER * 0.90 * blob(q, vec2(0.80 + 0.06 * cos(t * 0.27), 0.30 + 0.09 * sin(t * 0.37)), 0.25 * s, asp);
  c += GREEN * 1.10 * blob(q, vec2(0.24 + 0.09 * sin(t * 0.23 + 1.0), 0.74 + 0.05 * sin(t * 0.45)), 0.33 * s, asp);
  c += MOSS * 0.70 * blob(q, vec2(0.72 + 0.05 * sin(t * 0.51 + 2.0), 0.86), 0.20 * s, asp);
  c += COPPER * 0.80 * blob(q, vec2(0.18, 0.20 + 0.05 * sin(t * 0.29)), 0.34 * s, asp);
  float b = (q.x - uBeamX) * max(asp, 1.0) + (q.y - 0.5) * 0.35 * max(1.0 / asp, 1.0);
  c += vec3(1.0, 0.95, 0.82) * uBeamI * exp(-(b * b) / (0.012 * s * s));
  return c;
}

// exposure, stage vignette, film grain and a soft tone curve
vec3 acabar(vec3 c, float vig, float grao) {
  c *= mix(0.42, 1.0, vig) * uExp;
  c += (grao - 0.5) * 0.026;
  return 1.0 - exp(-c * 1.35);
}

void main() {
  vec2 q = gl_FragCoord.xy / uRes;
  float asp = uRes.x / uRes.y;
  vec3 fundo = BASE * 0.7 + luz(q, 1.0, asp) * 0.26;
  vec3 g = vec3(0.0);
  float sm = 0.0;   // how much of this pixel is the sign
  vec2 uv = (gl_FragCoord.xy - (uRect.xy - uRect.zw * 0.5)) / uRect.zw;
  if (uv.x > 0.0 && uv.x < 1.0 && uv.y > 0.0 && uv.y < 1.0) {
    vec2 tuv = vec2(uv.x, 1.0 - uv.y);
    vec3 tex = texture2D(uLogo, tuv).rgb;
    float m = tex.r;
    if (m > 0.002) {
      float hx = texture2D(uLogo, tuv + vec2(uTexel.x, 0.0)).g - texture2D(uLogo, tuv - vec2(uTexel.x, 0.0)).g;
      float hy = texture2D(uLogo, tuv + vec2(0.0, uTexel.y)).g - texture2D(uLogo, tuv - vec2(0.0, uTexel.y)).g;
      vec3 n = normalize(vec3(-hx * 22.0, hy * 22.0, 1.0));   // flat faces, slopes at the rim and around the art
      vec2 off = n.xy * 0.06;
      vec3 vidro;
      vidro.r = luz(q + off * 0.8, 1.35, asp).r;   // dispersion: each channel bends a little differently
      vidro.g = luz(q + off, 1.35, asp).g;
      vidro.b = luz(q + off * 1.25, 1.35, asp).b;
      float fres = pow(1.0 - n.z, 1.6);
      vec3 arco = 0.5 + 0.5 * cos(6.2832 * (fres * 1.4 + vec3(0.0, 0.33, 0.67)));   // thin-film fringe on the slopes
      vec3 borda = (mix(OURO, vec3(1.0), 0.28) + arco * 0.18) * fres * (0.6 + 1.6 * uBeamI);
      vec3 l = normalize(vec3((uBeamX - q.x) * asp, 0.25, 0.55));
      float spec = pow(max(dot(n, normalize(l + vec3(0.0, 0.0, 1.0))), 0.0), 36.0) * (0.3 + 1.6 * uBeamI);
      float claro = dot(vidro, vec3(0.34));
      vec3 corpo = BASE * 0.6 + vidro * vec3(0.17, 0.33, 0.15);                     // the plate: deep green glass
      vec3 arte = OURO * tex.b * (0.40 + 0.75 * claro + 0.8 * uBeamI * exp(-((q.x - uBeamX) * (q.x - uBeamX)) / 0.05)); // the gold art catches the light
      // away from the stage lights (in flight) the sign keeps a light of its own, so it does not go dark
      g = corpo * (1.0 - 0.55 * tex.b) + arte + borda + vec3(spec) + (1.0 - uVeu) * (vec3(0.03, 0.07, 0.03) + OURO * tex.b * 0.3);
      sm = smoothstep(0.0, 0.5, m);
    }
  }
  float vig = smoothstep(1.25, 0.25, length((q - vec2(0.5, 0.5)) * vec2(asp * 0.7, 1.0)));
  float grao = fract(sin(dot(gl_FragCoord.xy + uT * 61.0, vec2(12.9898, 78.233))) * 43758.5453);
  vec3 cf = acabar(fundo, vig, grao);
  vec3 cg = acabar(g, mix(1.0, vig, uVeu), grao);   // the stage vignette does not follow the sign to the corner
  float af = uVeu * (1.0 - sm);
  gl_FragColor = vec4(cf * af + cg * sm, af + sm);   // premultiplied: where the stage is gone, the page shows
}`;

const ease = (x) => 1 - Math.pow(1 - x, 3);
const easeInOut = (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
const clamp01 = (x) => Math.min(1, Math.max(0, x));

// Timeline of the beat (seconds): the lights warm up with a small flicker, the sweep crosses the glass, the
// camera pulls back with anticipation and a slight overshoot; then the stage dissolves and the sign leaves.
function cena(t) {
  const aceso = ease(clamp01(t / 0.5)) * (1 - 0.2 * Math.exp(-(((t - 0.16) / 0.035) ** 2)));
  let beamX = -1, beamI = 0;
  if (t >= 0.35 && t <= 1.75) {
    const p = easeInOut((t - 0.35) / 1.4);
    beamX = -0.25 + 1.5 * p;
    beamI = Math.sin(Math.PI * p);
  }
  let escala;
  if (t < 0.15) escala = 1.3 + 0.02 * ease(clamp01(t / 0.15));               // anticipation: leans in first
  else if (t < 2.1) escala = 1.32 + (0.985 - 1.32) * ease((t - 0.15) / 1.95);  // pulls back, a little past
  else escala = 0.985 + 0.015 * ease(clamp01((t - 2.1) / 0.6));                // settles
  const veu = 1 - easeInOut(clamp01((t - VOO) / 0.5));
  const voo = easeInOut(clamp01((t - VOO) / VOO_DUR));
  return { aceso, beamX, beamI, escala, veu, voo };
}

function compilar(gl, tipo, fonte) {
  const s = gl.createShader(tipo);
  gl.shaderSource(s, fonte);
  gl.compileShader(s);
  return gl.getShaderParameter(s, gl.COMPILE_STATUS) ? s : null;
}

async function iniciar() {
  const img = new Image();
  img.src = '/images/brand/logo-vidro.webp';
  await img.decode();
  const gl = canvas.getContext('webgl', { antialias: false, alpha: true, premultipliedAlpha: true, depth: false, powerPreference: 'high-performance' });
  if (!gl) return;
  const vs = compilar(gl, gl.VERTEX_SHADER, VERT);
  const fs = compilar(gl, gl.FRAGMENT_SHADER, FRAG);
  if (!vs || !fs) return;
  const prog = gl.createProgram();
  gl.attachShader(prog, vs);
  gl.attachShader(prog, fs);
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return;
  gl.useProgram(prog);
  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const aPos = gl.getAttribLocation(prog, 'aPos');
  gl.enableVertexAttribArray(aPos);
  gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);
  const tex = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, img);
  gl.generateMipmap(gl.TEXTURE_2D);                 // the mask is 1024 × 1024: the sign stays clean when it gets small
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  const U = Object.fromEntries(['uRes', 'uT', 'uLogo', 'uRect', 'uTexel', 'uBeamX', 'uBeamI', 'uExp', 'uVeu'].map((n) => [n, gl.getUniformLocation(prog, n)]));
  gl.uniform1i(U.uLogo, 0);
  gl.uniform2f(U.uTexel, 1.5 / img.naturalWidth, 1.5 / img.naturalHeight);
  gl.clearColor(0, 0, 0, 0);

  // The ident's own clock: the CSS animation of the upper half of the board. Reading it keeps this beat in step
  // with the board, whatever the page was doing while it loaded.
  const anim = document.querySelector('.corte__cima')?.getAnimations?.()[0];
  const t0 = performance.now();
  const relogio = () => {
    if (!anim) return performance.now() - t0 + 300;
    return anim.startTime != null && document.timeline.currentTime != null ? document.timeline.currentTime - anim.startTime : Number(anim.currentTime);
  };
  // too late to join (the board is about to part) or already dismissed: the plain ending stays
  if (relogio() > LIMITE || root.classList.contains('corte-pula') || root.classList.contains('corte-fim')) return;
  root.style.setProperty('--corte-vidro-t', `${-Math.round(relogio())}ms`); // lines the fade-out up with the ident (corte.css)
  root.classList.add('corte-vidro');
  clearTimeout(ident.fim);
  // from here on this beat ends the ident; if drawing ever stops (lost context, an error), the layer still leaves
  setTimeout(() => { if (relogio() >= FIM) ident.acabar(); }, FIM - relogio() + 600);

  const marca = document.querySelector('.brand__logo');   // where the sign lands: the logo of the header
  const medir = (fino) => {
    // the stage is drawn below screen resolution (it is soft light anyway); the flight, when the sign gets
    // small, at full resolution
    const fator = fino ? Math.min(devicePixelRatio || 1, 2) : Math.min(devicePixelRatio || 1, 1.5) * (innerWidth < 900 ? 0.6 : 0.75);
    const w = Math.max(2, Math.round(canvas.clientWidth * fator)), h = Math.max(2, Math.round(canvas.clientHeight * fator));
    if (w === canvas.width && h === canvas.height) return;
    canvas.width = w; canvas.height = h;
    gl.viewport(0, 0, w, h);
    gl.uniform2f(U.uRes, w, h);
  };
  const desenhar = (t) => {
    const s = cena(t);
    medir(s.voo > 0);
    const W = canvas.width, H = canvas.height;
    // on stage: the mask sized so the plate takes 70% of the width on phones (46% on wide screens), and never
    // more than 60% of the height (a phone lying down)
    let lado = Math.min((W * (innerWidth < 900 ? 0.7 : 0.46)) / PLACA.w, (H * 0.6) / PLACA.h) * s.escala;
    let cx = W * 0.5, cy = H * 0.5;
    const alvo = s.voo > 0 && marca ? marca.getBoundingClientRect() : null;
    if (alvo && alvo.width > 0) {
      const k = W / canvas.clientWidth;                                    // canvas px per CSS px
      const fim = (alvo.width * k) / PLACA.w;
      lado *= Math.pow(fim / lado, s.voo);                                 // shrinks at a steady rate, like a camera pulling away
      cx += ((alvo.left + alvo.width / 2) * k - cx) * s.voo;
      cy += (H - (alvo.top + alvo.height / 2) * k - cy) * s.voo;
    }
    gl.uniform1f(U.uT, t);
    gl.uniform4f(U.uRect, cx, cy, lado, lado);
    gl.uniform1f(U.uBeamX, s.beamX);
    gl.uniform1f(U.uBeamI, s.beamI);
    gl.uniform1f(U.uExp, s.aceso);
    gl.uniform1f(U.uVeu, s.veu);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  };
  const quadro = () => {
    if (root.classList.contains('corte-pula')) return;      // dismissed by the visitor: stop drawing
    const agora = relogio();
    if (agora >= FIM) { ident.acabar(); return; }
    desenhar(Math.max(0, (agora - INICIO) / 1000));
    requestAnimationFrame(quadro);
  };
  requestAnimationFrame(quadro);
}

if (ident && canvas) iniciar().catch(() => {});
