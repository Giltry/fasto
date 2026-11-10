'use strict';

// ---------------------------------------------------------------------------
// Temas visuales
// ---------------------------------------------------------------------------
const THEMES = {
  coast: {
    label: 'COSTA',
    sky: ['#2f6fd6', '#a8dcff'],
    fog: '#a8dcff',
    sun: { x: 900, y: 50, r: 16, color: '#fff7c0' },
    clouds: 'rgba(255,255,255,0.85)',
    ground: '#3c9c3c',
    colors: {
      light: { road: '#707070', grass: '#46b046', rumble: '#ffffff', lane: '#f0f0f0' },
      dark:  { road: '#686868', grass: '#3c9c3c', rumble: '#e02020' },
    },
    scenery: [['palm', 6], ['bush', 3], ['tree', 2], ['rock', 1]],
    density: 0.11,
    obstacles: { slow: 'cone', slip: 'oil', stop: 'boulder', mud: 'mud' },
    dust: '#8a6a3a',
  },
  desert: {
    label: 'DESIERTO',
    sky: ['#e8743b', '#ffd28a'],
    fog: '#ffd28a',
    sun: { x: 300, y: 95, r: 26, color: '#ff9a3a' },
    ground: '#d6a85e',
    colors: {
      light: { road: '#7a6a5a', grass: '#e2b56b', rumble: '#ffffff', lane: '#f5f0e0' },
      dark:  { road: '#726252', grass: '#d6a85e', rumble: '#e02020' },
    },
    scenery: [['cactus', 6], ['rock_red', 3], ['drybush', 2]],
    density: 0.07,
    obstacles: { slow: 'cone', slip: 'oil', stop: 'boulder_red', mud: 'sand' },
    dust: '#c89a55',
  },
  city: {
    label: 'CIUDAD',
    sky: ['#0b0b2a', '#3a1d5c'],
    fog: '#3a1d5c',
    sun: { x: 700, y: 45, r: 12, color: '#f4f0d8' },
    moon: true,
    stars: true,
    ground: '#24242e',
    colors: {
      light: { road: '#3a3a46', grass: '#2a2a35', rumble: '#ff2ad4', lane: '#ffe14a' },
      dark:  { road: '#34343f', grass: '#24242e', rumble: '#2ad4ff' },
    },
    scenery: [],
    density: 0,
    obstacles: { slow: 'cone', slip: 'oil', stop: 'block', mud: 'mud' },
    dust: '#555566',
  },
  snow: {
    label: 'NIEVE',
    sky: ['#6a8fc7', '#dfeaf5'],
    fog: '#dfeaf5',
    sun: { x: 1100, y: 40, r: 14, color: '#ffffff' },
    clouds: 'rgba(240,244,250,0.8)',
    ground: '#e2e9f0',
    colors: {
      light: { road: '#8a8f98', grass: '#f2f6fa', rumble: '#ffffff', lane: '#ffffff' },
      dark:  { road: '#82878f', grass: '#e2e9f0', rumble: '#2050e0' },
    },
    scenery: [['pine', 8], ['rock_snow', 1], ['snowman', 1]],
    density: 0.14,
    obstacles: { slow: 'cone', slip: 'ice', stop: 'boulder_snow', mud: 'snowpile' },
    dust: '#ffffff',
  },
};

// ---------------------------------------------------------------------------
// Trazados. ['s', largo, colina] recta / ['c', largo, curva, colina] curva
// curva > 0 = derecha. colina en múltiplos de segmento (+ sube / - baja)
// ---------------------------------------------------------------------------
const TRACKS = [
  {
    id: 'costa', name: 'COSTA VERDE', theme: 'coast', desc: 'Curvas suaves junto al mar',
    def: [
      ['s', 60, 0], ['c', 120, 3, 20], ['s', 80, -20], ['c', 100, -2, 0], ['s', 60, 0],
      ['c', 150, 4, 0], ['s', 120, 30], ['c', 80, -3, -30], ['c', 80, 3, 0], ['s', 100, 0],
      ['c', 160, 5, 10], ['s', 100, -10], ['c', 120, 2, 20], ['c', 100, -3, -20], ['s', 80, 0],
      ['c', 140, 4, 0], ['s', 80, 0],
    ],
  },
  {
    id: 'desierto', name: 'DESIERTO ROJO', theme: 'desert', desc: 'Rectas largas y veloces',
    def: [
      ['s', 160, 0], ['c', 200, 2, 0], ['s', 150, 40], ['s', 100, -40], ['c', 150, 3, 0],
      ['s', 200, 0], ['c', 100, -2, 20], ['c', 200, 3, -20], ['s', 250, 0], ['c', 150, 4, 0],
      ['s', 100, 0], ['c', 100, -3, 0], ['c', 150, 2, 0], ['s', 100, 0],
    ],
  },
  {
    id: 'ciudad', name: 'CIUDAD NEON', theme: 'city', desc: 'Esquinas cerradas y chicanas',
    def: [
      ['s', 100, 0], ['c', 60, 6, 0], ['s', 100, 0], ['c', 60, 6, 0], ['s', 60, 0],
      ['c', 40, -5, 0], ['c', 40, 5, 0], ['s', 120, 0], ['c', 60, 6, 0], ['s', 80, 10],
      ['c', 80, -4, -10], ['s', 100, 0], ['c', 60, 6, 0], ['s', 140, 0], ['c', 40, 5, 0],
      ['c', 40, -5, 0], ['c', 40, 5, 0], ['s', 100, 0], ['c', 60, 6, 0], ['s', 80, 0],
      ['c', 60, -6, 0], ['c', 80, 6, 0], ['s', 80, 0],
    ],
  },
  {
    id: 'montana', name: 'MONTAÑA NEVADA', theme: 'snow', desc: 'Colinas enormes y zigzag',
    def: [
      ['s', 60, 0], ['c', 100, 3, 40], ['c', 100, -4, 20], ['s', 60, -20], ['c', 120, 5, -40],
      ['s', 100, 30], ['c', 80, -3, 30], ['c', 80, 4, -30], ['c', 100, 5, -30], ['s', 80, 0],
      ['c', 120, -4, 40], ['c', 120, 6, 0], ['s', 100, -40], ['c', 80, 3, 20], ['c', 80, -3, -20],
      ['c', 140, 5, 0], ['s', 120, 0], ['c', 100, 4, 20], ['s', 80, -20],
    ],
  },
  // Autopistas: trazado lineal (de A a B), 4 carriles y tráfico civil
  {
    id: 'autopista', name: 'AUTOPISTA NEON', theme: 'city', desc: 'Autopista nocturna con trafico',
    linear: true, lanes: 4, roadWidth: 2600, traffic: 1.0, obstScale: 0.5,
    def: [
      ['s', 200, 0], ['c', 200, 2, 0], ['s', 150, 0], ['c', 150, -2, 10], ['s', 200, -10],
      ['c', 250, 3, 0], ['s', 300, 0], ['c', 150, -3, 20], ['c', 150, 2, -20], ['s', 250, 0],
      ['c', 200, -2, 0], ['s', 200, 15], ['c', 200, 3, -15], ['s', 250, 0], ['c', 150, -2, 0],
      ['c', 150, 2, 0], ['s', 300, 0], ['c', 200, -3, 0], ['s', 150, 0],
    ],
  },
  {
    id: 'ruta', name: 'RUTA DEL SOL', theme: 'desert', desc: 'Carretera federal con camiones',
    linear: true, lanes: 4, roadWidth: 2600, traffic: 0.9, obstScale: 0.5,
    def: [
      ['s', 300, 0], ['c', 200, 1.5, 30], ['s', 250, -30], ['c', 250, -2, 0], ['s', 400, 40],
      ['s', 200, -40], ['c', 300, 2.5, 0], ['s', 350, 0], ['c', 200, -1.5, 20], ['s', 300, -20],
      ['c', 250, 2, 0], ['s', 400, 0], ['c', 150, -3, 0], ['s', 200, 0],
    ],
  },
];

// ---------------------------------------------------------------------------
// Construcción de la pista (segmentos), decoración y minimapa
// ---------------------------------------------------------------------------
function buildTrack(t) {
  const SL = C.SEGMENT_LENGTH;
  const segments = [];
  const lastY = () => segments.length ? segments[segments.length - 1].p2.world.y : 0;

  function addSegment(curve, y) {
    const n = segments.length;
    segments.push({
      index: n,
      p1: { world: { y: lastY(), z: n * SL }, camera: {}, screen: {} },
      p2: { world: { y: y, z: (n + 1) * SL }, camera: {}, screen: {} },
      curve: curve,
      sprites: [], obstacles: [], cars: [],
      dark: Math.floor(n / C.RUMBLE_LENGTH) % 2 === 1,
      clip: 0,
    });
  }
  function addRoad(enter, hold, leave, curve, y) {
    const startY = lastY(), endY = startY + y * SL, total = enter + hold + leave;
    for (let n = 0; n < enter; n++) addSegment(Util.easeIn(0, curve, n / enter), Util.easeInOut(startY, endY, (n + 1) / total));
    for (let n = 0; n < hold; n++) addSegment(curve, Util.easeInOut(startY, endY, (enter + n + 1) / total));
    for (let n = 0; n < leave; n++) addSegment(Util.easeInOut(curve, 0, n / leave), Util.easeInOut(startY, endY, (enter + hold + n + 1) / total));
  }

  let startSeg = 0, finishSeg = 0;
  if (t.linear) { addRoad(0, 25, 0, 0, 0); startSeg = 25; }
  for (const d of t.def) {
    const len = d[1], q = Math.floor(len / 4);
    if (d[0] === 's') addRoad(q, len - 2 * q, q, 0, d[2] || 0);
    else addRoad(q, len - 2 * q, q, d[2], d[3] || 0);
  }
  if (t.linear) {
    // Meta y zona de frenado después de la meta
    finishSeg = segments.length;
    addRoad(40, 380, 40, 0, -lastY() / SL);
  } else {
    // Recta final que regresa a la altura 0 (zona de parrilla de salida)
    addRoad(30, 60, 30, 0, -lastY() / SL);
    segments[segments.length - 1].p2.world.y = 0;
  }
  for (const i of t.linear ? [startSeg, startSeg + 1, finishSeg, finishSeg + 1] : [0, 1]) segments[i].checker = true;

  const track = {
    id: t.id, name: t.name, theme: t.theme, desc: t.desc,
    segments, length: segments.length * SL,
    linear: !!t.linear, lanes: t.lanes || C.LANES, roadWidth: t.roadWidth || C.ROAD_WIDTH,
    traffic: t.traffic || 0, obstScale: t.obstScale || 1,
    startSeg, finishSeg, startZ: startSeg * SL, finishZ: finishSeg * SL,
  };
  computeMap(track);
  decorate(track);
  return track;
}

function computeMap(track) {
  const segs = track.segments, N = segs.length;
  let S = 0;
  for (const s of segs) S += s.curve;
  const k = track.linear ? 0.0035 : (S >= 0 ? 1 : -1) * Math.PI * 2 / Math.max(Math.abs(S), 1e-6);
  const heading = new Float32Array(N + 1);
  const pts = [];
  let h = 0, px = 0, py = 0;
  for (let i = 0; i < N; i++) {
    heading[i] = h;
    pts.push({ x: px, y: py });
    h += segs[i].curve * k;
    px += Math.sin(h);
    py -= Math.cos(h);
  }
  heading[N] = h;
  if (!track.linear) for (let i = 0; i < N; i++) { pts[i].x -= px * i / N; pts[i].y -= py * i / N; }
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  const last = track.linear ? track.finishSeg : N - 1;
  for (const p of pts.slice(0, last + 1)) { minX = Math.min(minX, p.x); maxX = Math.max(maxX, p.x); minY = Math.min(minY, p.y); maxY = Math.max(maxY, p.y); }
  const span = Math.max(maxX - minX, maxY - minY);
  const ox = (span - (maxX - minX)) / 2, oy = (span - (maxY - minY)) / 2;
  for (const p of pts) { p.x = (p.x - minX + ox) / span; p.y = (p.y - minY + oy) / span; }
  track.map = pts;
  track.heading = heading;
}

function decorate(track) {
  const segs = track.segments, N = segs.length;
  const theme = THEMES[track.theme];
  const rng = Util.rng(Util.hash('deco:' + track.id));
  const add = (i, spr, offset) => segs[Util.mod(i, N)].sprites.push({ img: spr.img, w: spr.w, coll: spr.coll, offset });
  const pick = list => {
    const tot = list.reduce((s, e) => s + e[1], 0);
    let r = rng() * tot;
    for (const e of list) { r -= e[1]; if (r <= 0) return e[0]; }
    return list[0][0];
  };

  if (track.linear) {
    add(track.startSeg + 1, Sprites.scenery('banner', rng), 0);
    add(track.finishSeg + 1, Sprites.scenery('banner', rng), 0);
  } else {
    add(1, Sprites.scenery('banner', rng), 0);
  }
  const rwk = C.ROAD_WIDTH / track.roadWidth;   // escala de offsets en pistas anchas

  // Señales de curva (chevrones) en el exterior de las curvas fuertes
  let lastSign = -100;
  for (let i = 1; i < N; i++) {
    const c = segs[i].curve, pc = segs[i - 1].curve;
    if (Math.abs(c) >= 3 && Math.abs(pc) < 3 && i - lastSign > 30) {
      const kind = c > 0 ? 'chevronR' : 'chevronL';
      const side = c > 0 ? -1 : 1;
      for (let j = 0; j < 4; j++) add(i - 6 + j * 6, Sprites.scenery(kind, rng), side * 1.3);
      lastSign = i;
    }
  }

  if (track.theme === 'city') {
    for (let i = 8; i < N - 2; i += 6) {
      for (const side of [-1, 1]) {
        const b = Sprites.scenery('building', rng);
        add(i + Math.floor(rng() * 3), b, side * (1.6 + rwk * 0.4 + b.w / track.roadWidth / 2 + rng() * 0.6));
      }
    }
    for (let i = 4; i < N; i += 16) { add(i, Sprites.scenery('lamp', rng), -1.12); add(i + 8, Sprites.scenery('lamp', rng), 1.12); }
  } else {
    for (let i = 6; i < N - 2; i++) {
      for (const side of [-1, 1]) {
        if (rng() < theme.density) {
          const kind = pick(theme.scenery);
          const s = Sprites.scenery(kind, rng);
          add(i, s, side * (1.2 + s.w / track.roadWidth / 2 + rng() * 2.2 * rwk));
        }
      }
    }
  }
  for (let i = 60; i < N - 40; i += 140 + Math.floor(rng() * 120)) {
    const side = rng() < 0.5 ? -1 : 1;
    add(i, Sprites.scenery('billboard', rng), side * (1.2 + 0.75 * rwk));
  }
}

// Coloca obstáculos sobre la pista según la densidad de la dificultad
function placeObstacles(track, density, rng) {
  const segs = track.segments, N = segs.length;
  const theme = THEMES[track.theme];
  for (const s of segs) s.obstacles.length = 0;
  if (density <= 0) return;
  let id = 0;
  let i = track.linear ? track.startSeg + 60 : 100;
  const end = track.linear ? track.finishSeg - 30 : N - 50;
  while (true) {
    i += Math.floor((60 + rng() * 75) / density);
    if (i >= end) break;
    const r = rng();
    const type = r < 0.32 ? 'slow' : r < 0.57 ? 'slip' : r < 0.77 ? 'stop' : 'mud';
    const kind = theme.obstacles[type];
    const spr = Sprites.obstacle(kind);
    const off = rng() * 1.4 - 0.7;
    const gid = id;
    const make = (seg, offset) => segs[seg].obstacles.push({
      id: id++, gid, type, kind, img: spr.img, w: spr.w, coll: spr.coll, offset, hiddenUntil: 0,
    });
    if (type === 'slow') {
      const n = 2 + Math.floor(rng() * 2);
      for (let k = 0; k < n; k++) make(i + k * 2, Util.limit(off + (k - (n - 1) / 2) * 0.22, -0.9, 0.9));
    } else if (type === 'mud') {
      for (let k = 0; k < 6; k++) make(i + k, off);
    } else {
      make(i, off);
    }
  }
}

// Dibuja el trazo de la pista en un canvas (para minimapa y menús)
function drawTrackMap(track, size, opts) {
  opts = opts || {};
  const c = document.createElement('canvas');
  c.width = size; c.height = size;
  const g = c.getContext('2d');
  const pad = opts.pad != null ? opts.pad : 8;
  const s = size - pad * 2;
  const pts = track.map;
  const last = track.linear ? track.finishSeg : pts.length - 1;
  const path = () => {
    g.beginPath();
    for (let i = 0; i <= last; i += 2) {
      const x = pad + pts[i].x * s, y = pad + pts[i].y * s;
      if (i === 0) g.moveTo(x, y); else g.lineTo(x, y);
    }
    if (track.linear) g.lineTo(pad + pts[last].x * s, pad + pts[last].y * s);
    else g.closePath();
  };
  g.lineJoin = 'round'; g.lineCap = 'round';
  path(); g.strokeStyle = opts.outline || '#000'; g.lineWidth = opts.width ? opts.width + 3 : 6; g.stroke();
  path(); g.strokeStyle = opts.color || '#e8e8e8'; g.lineWidth = opts.width || 3; g.stroke();
  const p0 = pts[track.linear ? track.startSeg : 0];
  g.fillStyle = '#ffd23a';
  g.fillRect(Math.round(pad + p0.x * s) - 2, Math.round(pad + p0.y * s) - 2, 5, 5);
  if (track.linear) {
    const pf = pts[last], fx = Math.round(pad + pf.x * s) - 3, fy = Math.round(pad + pf.y * s) - 3;
    for (let a = 0; a < 3; a++) for (let b = 0; b < 3; b++) {
      g.fillStyle = (a + b) % 2 ? '#111' : '#fff';
      g.fillRect(fx + a * 2, fy + b * 2, 2, 2);
    }
  }
  return c;
}
