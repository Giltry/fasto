'use strict';

// ---------------------------------------------------------------------------
// Generación procedural de todos los gráficos (estilo pixel-art).
// Todo se dibuja en canvas pequeños que luego se escalan sin suavizado.
// ---------------------------------------------------------------------------
const Sprites = (() => {
  const cache = {};

  function mk(w, h) {
    const c = document.createElement('canvas');
    c.width = w; c.height = h;
    return c;
  }
  function rgb(hex) {
    hex = hex.replace('#', '');
    if (hex.length === 3) hex = hex.split('').map(ch => ch + ch).join('');
    const n = parseInt(hex, 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }
  function shade(hex, amt) {
    const [r, g, b] = rgb(hex);
    const f = v => Math.round(amt < 0 ? v * (1 + amt) : v + (255 - v) * amt);
    return `rgb(${f(r)},${f(g)},${f(b)})`;
  }
  function circle(g, x, y, r, col) {
    g.fillStyle = col; g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill();
  }
  function ellipse(g, x, y, rx, ry, col) {
    g.fillStyle = col; g.beginPath(); g.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2); g.fill();
  }
  function poly(g, pts, col) {
    g.fillStyle = col; g.beginPath(); g.moveTo(pts[0][0], pts[0][1]);
    for (let i = 1; i < pts.length; i++) g.lineTo(pts[i][0], pts[i][1]);
    g.closePath(); g.fill();
  }

  // -------------------------------------------------------------------------
  // AUTOS (vista trasera, 48x30)
  // -------------------------------------------------------------------------
  const SHAPES = {
    rayo:     { body: [12, 22], cabin: [4, 12, 20, 30], spoiler: 'wing' },
    titan:    { body: [11, 22], cabin: [3, 11, 24, 34], stripes: true },
    vibora:   { body: [13, 22], cabin: [7, 13, 14, 24], spoiler: 'big' },
    fantasma: { body: [13, 22], roadster: true },
    // vehículos civiles
    sedan:    { body: [11, 22], cabin: [2, 11, 26, 34] },
    hatch:    { body: [10, 22], cabin: [1, 10, 32, 38] },
    pickup:   { body: [13, 22], cabin: [4, 13, 20, 28] },
  };

  function drawCar(type, color, t) {
    const c = mk(48, 30), g = c.getContext('2d');
    const s = SHAPES[type];
    const R = (x, y, w, h, col) => { g.fillStyle = col; g.fillRect(x, y, w, h); };
    const lt = shade(color, 0.4), dk = shade(color, -0.3), dk2 = shade(color, -0.55);
    const [bt, bb] = s.body;

    ellipse(g, 24, 27, 23, 3, 'rgba(0,0,0,0.45)');
    // llantas
    R(3, 18, 8, 10, '#111'); R(37, 18, 8, 10, '#111');
    for (let y = 19; y < 28; y += 2) { R(4, y, 6, 1, '#2c2c2c'); R(38, y, 6, 1, '#2c2c2c'); }
    // carrocería
    R(2, bt, 44, bb - bt, color);
    R(2, bt, 44, 1, lt);
    R(2, bb - 3, 44, 3, dk);
    if (t < 0) R(43, bt + 1, 4, bb - bt, dk2);
    if (t > 0) R(1, bt + 1, 4, bb - bt, dk2);
    R(4, bb, 40, 3, dk2);
    // luces traseras
    R(4, bt + 3, 8, 4, '#8a0000'); R(5, bt + 4, 6, 2, '#ff3a3a');
    R(36, bt + 3, 8, 4, '#8a0000'); R(37, bt + 4, 6, 2, '#ff3a3a');
    // placa
    R(19, bb - 4, 10, 4, '#e8e8e8'); R(21, bb - 3, 2, 2, '#333'); R(25, bb - 3, 2, 2, '#333');
    // escapes
    R(13, bb + 1, 3, 2, '#777'); R(32, bb + 1, 3, 2, '#777');
    if (s.stripes) { R(19, bt, 3, bb - bt - 4, '#fff'); R(26, bt, 3, bb - bt - 4, '#fff'); }

    if (s.cabin) {
      const [ct, cb, wt, wb] = s.cabin;
      for (let y = ct; y < cb; y++) {
        const p = (y - ct) / (cb - ct - 1);
        const w = Math.round(wt + (wb - wt) * p);
        const off = Math.round(t * 2 * (1 - p));
        R(Math.round(24 - w / 2) + off, y, w, 1, y === ct ? lt : dk);
        if (y > ct && y < cb - 1) {
          R(Math.round(24 - w / 2) + off + 2, y, w - 4, 1, '#14203c');
        }
      }
      const off0 = t * 2;
      R(Math.round(24 - wt / 2) + 3 + off0, ct + 2, 3, 1, '#5577b0');
      R(Math.round(24 - wt / 2) + 4 + off0, ct + 3, 3, 1, '#5577b0');
      if (s.stripes) { R(19 + off0, ct, 3, 1, '#fff'); R(26 + off0, ct, 3, 1, '#fff'); }
    }
    if (s.roadster) {
      const o = t * 2;
      R(11 + o, bt - 6, 26, 6, 'rgba(150,200,255,0.45)');
      R(11 + o, bt - 6, 26, 1, '#ddd'); R(11 + o, bt - 6, 1, 6, '#ddd'); R(36 + o, bt - 6, 1, 6, '#ddd');
      circle(g, 24 + o, bt - 6, 4.5, '#ffcc00');
      R(20 + o, bt - 8, 9, 2, '#222');
      R(16 + Math.round(o / 2), bt - 3, 16, 3, dk2);
    }
    if (s.spoiler === 'wing') {
      R(3 + t, bt - 3, 42, 2, dk2); R(3 + t, bt - 3, 42, 1, color);
      R(10 + t, bt - 1, 2, 1, '#222'); R(36 + t, bt - 1, 2, 1, '#222');
    } else if (s.spoiler === 'big') {
      R(13 + t, 4, 2, bt - 4, '#222'); R(33 + t, 4, 2, bt - 4, '#222');
      R(0 + t, 2, 48, 3, dk2); R(0 + t, 2, 48, 1, color);
    }
    return c;
  }

  function car(type, color) {
    const key = 'car:' + type + ':' + color;
    if (!cache[key]) {
      const bt = SHAPES[type].body[0], bb = SHAPES[type].body[1];
      cache[key] = {
        straight: drawCar(type, color, 0),
        left: drawCar(type, color, -1),
        right: drawCar(type, color, 1),
        lights: [[4, bt + 3, 8, 4], [36, bt + 3, 8, 4]],
        exhaust: [[14.5, bb + 2], [33.5, bb + 2]],
      };
    }
    return cache[key];
  }

  // -------------------------------------------------------------------------
  // TRÁFICO (vehículos civiles, vista trasera)
  // -------------------------------------------------------------------------
  function wheels(R, y, xs, h) {
    for (const x of xs) { R(x, y, 7, h, '#111'); R(x + 1, y + 1, 5, 1, '#2c2c2c'); R(x + 1, y + 3, 5, 1, '#2c2c2c'); }
  }

  function drawVan(color) {
    const c = mk(44, 42), g = c.getContext('2d');
    const R = (x, y, w, h, col) => { g.fillStyle = col; g.fillRect(x, y, w, h); };
    ellipse(g, 22, 39, 21, 3, 'rgba(0,0,0,0.45)');
    wheels(R, 31, [3, 34], 9);
    R(2, 2, 40, 33, color);
    R(2, 2, 40, 2, shade(color, 0.4));
    R(2, 31, 40, 4, shade(color, -0.4));
    R(21, 4, 2, 27, shade(color, -0.3));
    R(5, 6, 14, 10, '#14203c'); R(25, 6, 14, 10, '#14203c');
    R(6, 7, 3, 1, '#5577b0'); R(26, 7, 3, 1, '#5577b0');
    R(3, 18, 3, 10, '#8a0000'); R(3, 19, 3, 6, '#ff3a3a');
    R(38, 18, 3, 10, '#8a0000'); R(38, 19, 3, 6, '#ff3a3a');
    R(17, 25, 10, 4, '#e8e8e8');
    R(4, 35, 36, 3, '#333');
    return c;
  }

  function drawTruck(color) {
    const c = mk(56, 72), g = c.getContext('2d');
    const R = (x, y, w, h, col) => { g.fillStyle = col; g.fillRect(x, y, w, h); };
    ellipse(g, 28, 69, 27, 3, 'rgba(0,0,0,0.5)');
    wheels(R, 58, [4, 12, 37, 45], 10);
    R(1, 0, 54, 56, color);
    R(1, 0, 54, 2, shade(color, 0.35));
    R(1, 52, 54, 4, shade(color, -0.35));
    R(27, 3, 2, 49, shade(color, -0.4));
    for (const x of [8, 18, 37, 47]) R(x, 3, 1, 49, shade(color, -0.2));
    R(22, 26, 2, 8, '#888'); R(32, 26, 2, 8, '#888');
    for (const x of [6, 18, 30, 42]) R(x, 1, 6, 2, '#ff9a00');
    R(6, 58, 44, 3, '#c8c8c8'); R(6, 61, 44, 1, '#777');
    R(2, 57, 6, 4, '#8a0000'); R(3, 58, 4, 2, '#ff3a3a');
    R(48, 57, 6, 4, '#8a0000'); R(49, 58, 4, 2, '#ff3a3a');
    R(23, 62, 10, 4, '#e8e8e8');
    return c;
  }

  function drawBus(color) {
    const c = mk(56, 62), g = c.getContext('2d');
    const R = (x, y, w, h, col) => { g.fillStyle = col; g.fillRect(x, y, w, h); };
    ellipse(g, 28, 59, 27, 3, 'rgba(0,0,0,0.5)');
    wheels(R, 49, [4, 45], 10);
    R(1, 1, 54, 50, color);
    R(1, 1, 54, 2, shade(color, 0.4));
    R(4, 5, 48, 16, '#14203c');
    R(6, 6, 10, 2, '#5577b0');
    R(1, 23, 54, 3, '#ffffff');
    for (let y = 32; y < 42; y += 2) R(14, y, 28, 1, shade(color, -0.45));
    R(3, 30, 6, 10, '#8a0000'); R(4, 31, 4, 7, '#ff3a3a');
    R(47, 30, 6, 10, '#8a0000'); R(48, 31, 4, 7, '#ff3a3a');
    R(22, 43, 12, 4, '#e8e8e8');
    R(2, 47, 52, 4, '#333');
    return c;
  }

  const VEHICLES = {
    sedan:  { w: 500, len: 1.1, draw: col => drawCar('sedan', col, 0), lights: [[4, 14, 8, 4], [36, 14, 8, 4]] },
    hatch:  { w: 470, len: 1.0, draw: col => drawCar('hatch', col, 0), lights: [[4, 13, 8, 4], [36, 13, 8, 4]] },
    pickup: { w: 530, len: 1.3, draw: col => drawCar('pickup', col, 0), lights: [[4, 16, 8, 4], [36, 16, 8, 4]] },
    van:    { w: 560, len: 1.4, draw: drawVan, lights: [[3, 18, 3, 10], [38, 18, 3, 10]] },
    truck:  { w: 800, len: 2.4, draw: drawTruck, lights: [[2, 57, 6, 4], [48, 57, 6, 4]] },
    bus:    { w: 800, len: 2.2, draw: drawBus, lights: [[3, 30, 6, 10], [47, 30, 6, 10]] },
  };

  function vehicle(kind, color) {
    const key = 'veh:' + kind + ':' + color;
    if (!cache[key]) {
      const v = VEHICLES[kind];
      const img = v.draw(color);
      cache[key] = { straight: img, left: img, right: img, lights: v.lights, exhaust: [], w: v.w, len: v.len };
    }
    return cache[key];
  }

  // -------------------------------------------------------------------------
  // ESCENARIO
  // -------------------------------------------------------------------------
  function palm(rng) {
    const c = mk(32, 52), g = c.getContext('2d');
    const lean = (rng() - 0.5) * 10;
    for (let y = 15; y < 52; y++) {
      const p = (52 - y) / 37;
      const x = Math.round(14.5 + lean * p * p);
      g.fillStyle = (y % 4 < 2) ? '#8a5a2c' : '#6a4320';
      g.fillRect(x, y, 3, 1);
    }
    const cx = Math.round(16 + lean), cy = 15;
    const greens = ['#1d6e27', '#2b9036', '#3db048'];
    for (let a = 0; a < 8; a++) {
      const ang = Math.PI * (1.0 + a / 7);
      for (let t = 0; t < 13; t++) {
        const x = cx + Math.cos(ang) * t;
        const y = cy + Math.sin(ang) * t * 0.65 + 0.07 * t * t;
        g.fillStyle = greens[(t + a) % 3];
        g.fillRect(Math.round(x), Math.round(y), 2, 2);
        if (t > 3 && t % 2 === 0) { g.fillStyle = greens[0]; g.fillRect(Math.round(x), Math.round(y) + 2, 1, 1); }
      }
    }
    g.fillStyle = '#5a3818'; g.fillRect(cx - 2, cy + 1, 2, 2); g.fillRect(cx + 1, cy + 2, 2, 2);
    return { img: c, w: 1500, coll: 0.12 };
  }

  function tree() {
    const c = mk(32, 40), g = c.getContext('2d');
    g.fillStyle = '#6b4423'; g.fillRect(14, 24, 4, 16);
    g.fillStyle = '#4e3018'; g.fillRect(14, 24, 1, 16);
    circle(g, 16, 16, 12, '#226b22');
    circle(g, 9, 20, 7, '#1d5e1d');
    circle(g, 23, 20, 7, '#1d5e1d');
    circle(g, 15, 11, 7, '#2f8a2f');
    circle(g, 12, 9, 3, '#45a845');
    circle(g, 21, 14, 3, '#3b9a3b');
    return { img: c, w: 1700, coll: 0.14 };
  }

  function pine() {
    const c = mk(28, 50), g = c.getContext('2d');
    g.fillStyle = '#4e3018'; g.fillRect(12, 42, 4, 8);
    for (let i = 0; i < 4; i++) {
      const top = 1 + i * 9, h = 16, hw = 5 + i * 2.6;
      poly(g, [[14, top], [14 + hw, top + h], [14 - hw, top + h]], i % 2 ? '#1a5230' : '#1f5e38');
      poly(g, [[14, top], [14 + hw * 0.35, top + h * 0.35], [14 - hw * 0.35, top + h * 0.35]], '#f4f8fc');
      g.fillStyle = '#e6eef6';
      g.fillRect(Math.round(14 - hw), top + h - 1, Math.round(hw * 0.7), 1);
      g.fillRect(Math.round(14 + hw * 0.3), top + h - 1, Math.round(hw * 0.7), 1);
    }
    return { img: c, w: 1300, coll: 0.12 };
  }

  function cactus() {
    const c = mk(22, 40), g = c.getContext('2d');
    const G = '#2f8f3a', L = '#56be60', D = '#1f6a28';
    g.fillStyle = G; g.fillRect(8, 4, 6, 36); g.fillRect(9, 3, 4, 1);
    g.fillRect(2, 18, 7, 4); g.fillRect(2, 9, 4, 11); g.fillRect(3, 8, 2, 1);
    g.fillRect(13, 22, 7, 4); g.fillRect(16, 12, 4, 12); g.fillRect(17, 11, 2, 1);
    g.fillStyle = L; g.fillRect(9, 5, 1, 34); g.fillRect(3, 10, 1, 9); g.fillRect(17, 13, 1, 9);
    g.fillStyle = D; g.fillRect(13, 5, 1, 34); g.fillRect(5, 10, 1, 8); g.fillRect(19, 13, 1, 9);
    return { img: c, w: 800, coll: 0.12 };
  }

  function rock(base, top) {
    const c = mk(32, 20), g = c.getContext('2d');
    poly(g, [[1, 19], [4, 9], [10, 4], [20, 2], [28, 7], [31, 19]], base);
    poly(g, [[5, 10], [10, 5], [20, 3], [26, 7], [18, 8], [10, 10]], top);
    g.fillStyle = 'rgba(0,0,0,0.25)'; g.fillRect(2, 16, 29, 3);
    return { img: c, w: 1300, coll: 0.3 };
  }

  function bush(col, col2) {
    const c = mk(24, 14), g = c.getContext('2d');
    circle(g, 7, 9, 5, col2); circle(g, 17, 9, 5, col2);
    circle(g, 12, 7, 6, col); circle(g, 10, 5, 2, shade(col, 0.3));
    return { img: c, w: 800, coll: 0 };
  }

  function building(rng) {
    const w = 36 + Math.floor(rng() * 20), h = 70 + Math.floor(rng() * 60);
    const c = mk(w, h), g = c.getContext('2d');
    const cols = ['#2b2440', '#1f2a44', '#3a2a3a', '#28303a', '#332848'];
    const col = cols[Math.floor(rng() * cols.length)];
    g.fillStyle = col; g.fillRect(0, 4, w, h - 4);
    g.fillStyle = shade(col, 0.2); g.fillRect(0, 4, w, 2);
    g.fillStyle = shade(col, -0.4); g.fillRect(w - 3, 4, 3, h - 4);
    for (let y = 10; y < h - 6; y += 6) {
      for (let x = 3; x < w - 5; x += 5) {
        g.fillStyle = rng() < 0.45 ? (rng() < 0.8 ? '#ffd86a' : '#8ae0ff') : '#14141f';
        g.fillRect(x, y, 3, 3);
      }
    }
    if (rng() < 0.6) {
      g.fillStyle = '#555'; g.fillRect(Math.floor(w / 2), 0, 1, 4);
      g.fillStyle = '#ff2020'; g.fillRect(Math.floor(w / 2) - 1, 0, 3, 1);
    }
    if (rng() < 0.5) {
      const neon = ['#ff2ad4', '#2ad4ff', '#ffe14a', '#4aff8a'][Math.floor(rng() * 4)];
      const ny = 14 + Math.floor(rng() * (h - 40));
      g.fillStyle = neon; g.fillRect(4, ny, w - 10, 6);
      g.fillStyle = '#fff'; g.fillRect(6, ny + 2, w - 14, 2);
    }
    return { img: c, w: w * 75, coll: 0 };
  }

  function lamp() {
    const c = mk(16, 64), g = c.getContext('2d');
    circle(g, 12, 10, 6, 'rgba(255,240,170,0.3)');
    g.fillStyle = '#777'; g.fillRect(6, 8, 2, 56); g.fillRect(6, 6, 7, 2);
    g.fillStyle = '#fff6c0'; g.fillRect(10, 8, 4, 2);
    return { img: c, w: 450, coll: 0.06 };
  }

  function billboard(rng, text) {
    const c = mk(64, 40), g = c.getContext('2d');
    const cols = ['#d01818', '#1840d0', '#18a040', '#e0a000', '#9020c0'];
    const col = cols[Math.floor(rng() * cols.length)];
    g.fillStyle = '#555'; g.fillRect(10, 22, 3, 18); g.fillRect(51, 22, 3, 18);
    g.fillStyle = '#222'; g.fillRect(0, 0, 64, 25);
    g.fillStyle = col; g.fillRect(2, 2, 60, 21);
    g.fillStyle = shade(col, 0.3); g.fillRect(2, 2, 60, 3);
    g.fillStyle = '#fff'; g.font = 'bold 11px monospace'; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillText(text, 32, 14);
    return { img: c, w: 2600, coll: 0.2 };
  }

  function chevron(dir) {
    const c = mk(16, 26), g = c.getContext('2d');
    g.fillStyle = '#999'; g.fillRect(7, 12, 2, 14);
    g.fillStyle = '#222'; g.fillRect(0, 0, 16, 13);
    g.fillStyle = '#ffd000'; g.fillRect(1, 1, 14, 11);
    g.fillStyle = '#111';
    for (let k = 0; k < 2; k++) {
      for (let i = 0; i < 4; i++) {
        const bx = dir > 0 ? 3 + k * 5 + i : 12 - k * 5 - i;
        g.fillRect(bx, 2 + i, 1, 1); g.fillRect(bx, 9 - i, 1, 1);
        g.fillRect(bx + (dir > 0 ? 1 : -1), 2 + i, 1, 1); g.fillRect(bx + (dir > 0 ? 1 : -1), 9 - i, 1, 1);
      }
    }
    return { img: c, w: 520, coll: 0.08 };
  }

  function snowman() {
    const c = mk(20, 30), g = c.getContext('2d');
    circle(g, 10, 22, 7, '#e6edf5'); circle(g, 10, 12, 5, '#f4f8fc');
    g.fillStyle = '#111'; g.fillRect(8, 11, 1, 1); g.fillRect(11, 11, 1, 1);
    g.fillStyle = '#ff8a00'; g.fillRect(10, 13, 3, 1);
    g.fillStyle = '#222'; g.fillRect(6, 7, 8, 1); g.fillRect(7, 2, 6, 5);
    g.fillStyle = '#c01818'; g.fillRect(6, 16, 8, 2);
    return { img: c, w: 700, coll: 0.15 };
  }

  function banner() {
    const c = mk(160, 64), g = c.getContext('2d');
    g.fillStyle = '#ddd'; g.fillRect(0, 0, 6, 64); g.fillRect(154, 0, 6, 64);
    g.fillStyle = '#999'; g.fillRect(4, 0, 2, 64); g.fillRect(158, 0, 2, 64);
    g.fillStyle = '#d01818'; g.fillRect(6, 4, 148, 22);
    for (let x = 6; x < 154; x += 4) {
      for (let r = 0; r < 2; r++) {
        g.fillStyle = ((x / 4 + r) % 2) ? '#111' : '#fff';
        g.fillRect(x, 4 + r * 3, 4, 3);
        g.fillStyle = ((x / 4 + r + 1) % 2) ? '#111' : '#fff';
        g.fillRect(x, 20 + r * 3, 4, 3);
      }
    }
    g.fillStyle = '#ffd23a'; g.font = 'bold 10px monospace'; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillText('FASTO  GP', 80, 15);
    return { img: c, w: C.ROAD_WIDTH * 2.5, coll: 0 };
  }

  // -------------------------------------------------------------------------
  // OBSTACULOS EN PISTA
  // -------------------------------------------------------------------------
  function cone() {
    const c = mk(14, 16), g = c.getContext('2d');
    poly(g, [[7, 0], [12, 14], [2, 14]], '#ff7a00');
    g.fillStyle = '#fff'; g.fillRect(4, 7, 6, 2);
    g.fillStyle = '#c04a00'; g.fillRect(0, 13, 14, 3);
    return { img: c, w: 230, coll: 0.13 };
  }
  function slick(col, sheen) {
    const c = mk(36, 10), g = c.getContext('2d');
    ellipse(g, 18, 5, 17, 4.5, col);
    ellipse(g, 9, 6, 7, 3, col);
    ellipse(g, 15, 4, 8, 1.5, sheen);
    return { img: c, w: 820, coll: 0.36 };
  }
  function boulder(base, top) {
    const c = mk(26, 20), g = c.getContext('2d');
    ellipse(g, 13, 18, 12, 2, 'rgba(0,0,0,0.35)');
    poly(g, [[1, 18], [3, 8], [9, 2], [18, 1], [24, 7], [25, 18]], base);
    poly(g, [[4, 8], [9, 3], [17, 2], [22, 6], [14, 7]], top);
    g.fillStyle = 'rgba(0,0,0,0.25)'; g.fillRect(3, 14, 21, 3);
    return { img: c, w: 540, coll: 0.25 };
  }
  function block() {
    const c = mk(30, 16), g = c.getContext('2d');
    g.fillStyle = '#bbb'; g.fillRect(0, 3, 30, 13);
    for (let x = 0; x < 30; x += 6) { g.fillStyle = '#d22'; g.fillRect(x, 6, 3, 8); }
    g.fillStyle = '#e8e8e8'; g.fillRect(0, 3, 30, 2);
    g.fillStyle = '#777'; g.fillRect(0, 14, 30, 2);
    return { img: c, w: 720, coll: 0.33 };
  }
  function mud(c1, c2) {
    const c = mk(40, 12), g = c.getContext('2d');
    ellipse(g, 20, 6, 19, 5, c1);
    ellipse(g, 10, 7, 8, 4, c2);
    ellipse(g, 28, 5, 9, 3, c2);
    return { img: c, w: 980, coll: 0.45 };
  }
  function snowpile() {
    const c = mk(36, 14), g = c.getContext('2d');
    ellipse(g, 18, 11, 17, 3, 'rgba(0,0,0,0.2)');
    ellipse(g, 18, 9, 16, 5, '#c9d4df');
    ellipse(g, 16, 7, 12, 5, '#eef3f8');
    ellipse(g, 13, 5, 4, 1.5, '#fff');
    return { img: c, w: 950, coll: 0.44 };
  }

  const OBSTACLE_MAKERS = {
    cone: cone,
    oil: () => slick('#111', 'rgba(140,90,220,0.45)'),
    ice: () => slick('rgba(170,230,255,0.9)', 'rgba(255,255,255,0.9)'),
    boulder: () => boulder('#7d776d', '#a39d92'),
    boulder_red: () => boulder('#94532f', '#b8744a'),
    boulder_snow: () => boulder('#6f7884', '#f2f6fa'),
    block: block,
    mud: () => mud('#5a3a1a', '#6e4a25'),
    sand: () => mud('#c8954a', '#b5823a'),
    snowpile: snowpile,
  };

  function obstacle(kind) {
    const key = 'ob:' + kind;
    if (!cache[key]) cache[key] = OBSTACLE_MAKERS[kind]();
    return cache[key];
  }

  // Sprite de escenario por nombre (con variaciones cacheadas)
  function scenery(kind, rng) {
    const variants = { palm: 4, building: 10, billboard: 4, tree: 1 };
    const n = variants[kind] || 1;
    const v = Math.floor(rng() * n);
    const key = 'sc:' + kind + ':' + v;
    if (cache[key]) return cache[key];
    const r = Util.rng(Util.hash(key));
    let s;
    switch (kind) {
      case 'palm': s = palm(r); break;
      case 'tree': s = tree(); break;
      case 'pine': s = pine(); break;
      case 'cactus': s = cactus(); break;
      case 'rock': s = rock('#837c71', '#a8a196'); break;
      case 'rock_red': s = rock('#9a5634', '#c07a4e'); break;
      case 'rock_snow': s = rock('#6f7884', '#f2f6fa'); break;
      case 'bush': s = bush('#2f8f2f', '#226b22'); break;
      case 'drybush': s = bush('#9a8a3a', '#7a6a2a'); break;
      case 'building': s = building(r); break;
      case 'lamp': s = lamp(); break;
      case 'billboard': s = billboard(r, ['FASTO', 'TURBO', 'NITRO', '¡GO!'][v]); break;
      case 'chevronL': s = chevron(-1); break;
      case 'chevronR': s = chevron(1); break;
      case 'snowman': s = snowman(); break;
      case 'banner': s = banner(); break;
      default: s = rock('#837c71', '#a8a196');
    }
    cache[key] = s;
    return s;
  }

  // -------------------------------------------------------------------------
  // FONDOS (capas panorámicas que se repiten cada 1280 px = una vuelta de 360°)
  // -------------------------------------------------------------------------
  const BG_W = 1280;

  function tileNoise(rng, terms) {
    const ph = terms.map(() => rng() * Math.PI * 2);
    return x => terms.reduce((s, [k, a], i) => s + a * Math.sin(2 * Math.PI * k * x / BG_W + ph[i]), 0);
  }

  function skyLayer(theme, rng) {
    const H = 200, c = mk(BG_W, H), g = c.getContext('2d');
    const grd = g.createLinearGradient(0, 0, 0, H);
    grd.addColorStop(0, theme.sky[0]); grd.addColorStop(1, theme.sky[1]);
    g.fillStyle = grd; g.fillRect(0, 0, BG_W, H);
    if (theme.stars) {
      for (let i = 0; i < 160; i++) {
        g.fillStyle = rng() < 0.7 ? 'rgba(255,255,255,0.8)' : 'rgba(255,230,160,0.9)';
        g.fillRect(Math.floor(rng() * BG_W), Math.floor(rng() * H * 0.75), 1, 1);
      }
    }
    if (theme.sun) {
      const s = theme.sun;
      for (let k = 3; k > 0; k--) circle(g, s.x, s.y, s.r + k * 6, `rgba(255,255,220,${0.06 * (4 - k)})`);
      circle(g, s.x, s.y, s.r, s.color);
      if (theme.moon) circle(g, s.x + 6, s.y - 4, s.r * 0.85, theme.sky[0]);
    }
    if (theme.clouds) {
      for (let i = 0; i < 14; i++) {
        const cx = rng() * BG_W, cy = 20 + rng() * 90, sz = 8 + rng() * 14;
        for (const ox of [-BG_W, 0, BG_W]) {
          g.fillStyle = theme.clouds;
          for (let j = 0; j < 5; j++) {
            g.beginPath();
            g.ellipse(cx + ox + (j - 2) * sz * 0.9, cy + (j % 2) * 2, sz, sz * 0.55, 0, 0, Math.PI * 2);
            g.fill();
          }
        }
      }
    }
    return c;
  }

  function silhouette(g, H, f, colorFn) {
    for (let x = 0; x < BG_W; x++) {
      const h = Math.max(0, Math.round(f(x)));
      for (let y = H - h; y < H; y++) {
        g.fillStyle = colorFn(x, y, H - y, h);
        g.fillRect(x, y, 1, 1);
      }
    }
  }
  // Versión rápida por columnas (bandas de color)
  function columns(g, H, f, bands) {
    for (let x = 0; x < BG_W; x++) {
      const h = Math.max(0, Math.round(f(x)));
      let top = H - h;
      for (const b of bands) {
        const bh = b.h === undefined ? h : Math.min(h, Math.round(b.h(x, h)));
        g.fillStyle = b.color;
        if (b.fromTop) { g.fillRect(x, top, 1, Math.min(bh, h)); }
        else g.fillRect(x, H - bh, 1, bh);
      }
    }
  }

  function background(themeId) {
    const key = 'bg:' + themeId;
    if (cache[key]) return cache[key];
    const theme = THEMES[themeId];
    const rng = Util.rng(Util.hash(key));
    const sky = skyLayer(theme, rng);
    const FAR_H = 120, NEAR_H = 80;
    const far = mk(BG_W, FAR_H), fg = far.getContext('2d');
    const near = mk(BG_W, NEAR_H), ng = near.getContext('2d');

    if (themeId === 'coast') {
      const f = tileNoise(rng, [[2, 14], [5, 9], [11, 4]]);
      columns(fg, FAR_H, x => 34 + f(x), [
        { color: '#6f86c0' },
        { color: '#8fa3d6', fromTop: true, h: () => 3 },
      ]);
      fg.fillStyle = '#2a6fbf'; fg.fillRect(0, FAR_H - 14, BG_W, 14);
      for (let i = 0; i < 120; i++) { fg.fillStyle = 'rgba(255,255,255,0.6)'; fg.fillRect(Math.floor(rng() * BG_W), FAR_H - 13 + Math.floor(rng() * 12), 3 + Math.floor(rng() * 5), 1); }
      const n = tileNoise(rng, [[3, 10], [7, 6], [13, 3]]);
      columns(ng, NEAR_H, x => 26 + n(x), [{ color: '#2e8a3a' }, { color: '#47a852', fromTop: true, h: () => 2 }]);
      for (let i = 0; i < 40; i++) {
        const x = rng() * BG_W, y = NEAR_H - 26 - n(x) + 4;
        for (const ox of [-BG_W, 0, BG_W]) { circle(ng, x + ox, y, 3 + rng() * 2, '#1e6a28'); }
      }
    } else if (themeId === 'desert') {
      fg.fillStyle = '#b8603a';
      for (let i = 0; i < 9; i++) {
        const x = rng() * BG_W, w = 60 + rng() * 120, h = 40 + rng() * 55, tw = w * (0.5 + rng() * 0.3);
        for (const ox of [-BG_W, 0, BG_W]) {
          poly(fg, [[x + ox - w / 2, FAR_H], [x + ox - tw / 2, FAR_H - h], [x + ox + tw / 2, FAR_H - h], [x + ox + w / 2, FAR_H]], i % 2 ? '#b0583a' : '#c46a40');
          fg.fillStyle = 'rgba(80,20,10,0.25)';
          for (let s = 1; s < 4; s++) fg.fillRect(x + ox - w / 2 + s * 4, FAR_H - h + s * 10, w - s * 8, 2);
          fg.fillStyle = 'rgba(255,200,140,0.35)'; fg.fillRect(x + ox - tw / 2, FAR_H - h, tw, 2);
        }
      }
      const n = tileNoise(rng, [[2, 8], [5, 5], [9, 3]]);
      columns(ng, NEAR_H, x => 22 + n(x), [{ color: '#d9a35c' }, { color: '#f0c27a', fromTop: true, h: () => 2 }]);
    } else if (themeId === 'city') {
      let x = 0;
      while (x < BG_W) {
        const bw = 18 + Math.floor(rng() * 36), bh = 30 + Math.floor(rng() * 80);
        for (const ox of [0, -BG_W]) {
          fg.fillStyle = '#241a3e'; fg.fillRect(x + ox, FAR_H - bh, bw, bh);
          for (let wy = FAR_H - bh + 4; wy < FAR_H - 2; wy += 4) for (let wx = x + ox + 2; wx < x + ox + bw - 2; wx += 3) {
            if (rng() < 0.25) { fg.fillStyle = rng() < 0.8 ? '#e8c060' : '#80d0ff'; fg.fillRect(wx, wy, 1, 2); }
          }
        }
        x += bw + Math.floor(rng() * 3);
      }
      x = 0;
      while (x < BG_W) {
        const bw = 24 + Math.floor(rng() * 40), bh = 25 + Math.floor(rng() * 45);
        for (const ox of [0, -BG_W]) {
          ng.fillStyle = '#130f22'; ng.fillRect(x + ox, NEAR_H - bh, bw, bh);
          for (let wy = NEAR_H - bh + 3; wy < NEAR_H - 2; wy += 5) for (let wx = x + ox + 2; wx < x + ox + bw - 3; wx += 4) {
            if (rng() < 0.35) { ng.fillStyle = '#ffd86a'; ng.fillRect(wx, wy, 2, 2); }
          }
          if (rng() < 0.3) { ng.fillStyle = ['#ff2ad4', '#2ad4ff', '#4aff8a'][Math.floor(rng() * 3)]; ng.fillRect(x + ox + 3, NEAR_H - bh + 6, bw - 6, 3); }
        }
        x += bw + Math.floor(rng() * 6);
      }
    } else if (themeId === 'snow') {
      const f = tileNoise(rng, [[2, 22], [3, 16], [7, 10], [13, 6], [23, 3]]);
      silhouette(fg, FAR_H, x => 62 + f(x), (x, y, hy, h) => {
        if (hy > 70 || hy > h - 10) return (x + y) % 7 === 0 ? '#d8e4f0' : '#f4f8fc';
        return (x % 9 < 4) ? '#5d6f8c' : '#687b99';
      });
      ng.fillStyle = '#e8eff6'; ng.fillRect(0, NEAR_H - 10, BG_W, 10);
      for (let i = 0; i < 160; i++) {
        const x = rng() * BG_W, h = 12 + rng() * 22, w = h * 0.45;
        for (const ox of [-BG_W, 0, BG_W]) {
          poly(ng, [[x + ox, NEAR_H - 8 - h], [x + ox + w, NEAR_H - 6], [x + ox - w, NEAR_H - 6]], i % 2 ? '#1b4a32' : '#215a3c');
          poly(ng, [[x + ox, NEAR_H - 8 - h], [x + ox + w * 0.3, NEAR_H - 8 - h * 0.7], [x + ox - w * 0.3, NEAR_H - 8 - h * 0.7]], '#f4f8fc');
        }
      }
    }
    const bg = { sky, far, near, ground: theme.ground, top: theme.sky[0] };
    cache[key] = bg;
    return bg;
  }

  return { car, vehicle, scenery, obstacle, background, shade, SHAPES };
})();
