'use strict';

// ---------------------------------------------------------------------------
// Constantes globales del motor pseudo-3D
// ---------------------------------------------------------------------------
const C = {
  W: 640,
  H: 360,
  STEP: 1 / 60,
  SEGMENT_LENGTH: 200,
  RUMBLE_LENGTH: 3,
  ROAD_WIDTH: 2000,
  LANES: 3,
  FOV: 100,
  CAMERA_HEIGHT: 1000,
  DRAW_DISTANCE: 300,
  FOG_DENSITY: 5,
  LAPS: 3,
  RACERS: 8,
  CAR_WORLD_W: 500,
};
C.MAX_SPEED = C.SEGMENT_LENGTH / C.STEP;               // 12000 unidades/s
C.CAMERA_DEPTH = 1 / Math.tan((C.FOV / 2) * Math.PI / 180);
C.PLAYER_Z = C.CAMERA_HEIGHT * C.CAMERA_DEPTH;         // distancia cámara -> auto
C.CAR_W = C.CAR_WORLD_W / C.ROAD_WIDTH;                // ancho del auto en unidades de pista
C.CAR_LEN = C.SEGMENT_LENGTH * 1.1;

const Util = {
  limit(v, min, max) { return Math.max(min, Math.min(v, max)); },
  interpolate(a, b, p) { return a + (b - a) * p; },
  easeIn(a, b, p) { return a + (b - a) * Math.pow(p, 2); },
  easeOut(a, b, p) { return a + (b - a) * (1 - Math.pow(1 - p, 2)); },
  easeInOut(a, b, p) { return a + (b - a) * ((-Math.cos(p * Math.PI) / 2) + 0.5); },
  percentRemaining(n, total) { return (n % total) / total; },
  mod(v, m) { return ((v % m) + m) % m; },
  overlap(x1, w1, x2, w2, percent) {
    const half = (percent || 1) / 2;
    const min1 = x1 - w1 * half, max1 = x1 + w1 * half;
    const min2 = x2 - w2 * half, max2 = x2 + w2 * half;
    return !(max1 < min2 || min1 > max2);
  },
  project(p, camX, camY, camZ, camDepth, w, h, roadW) {
    p.camera.x = (p.world.x || 0) - camX;
    p.camera.y = (p.world.y || 0) - camY;
    p.camera.z = (p.world.z || 0) - camZ;
    p.screen.scale = camDepth / p.camera.z;
    p.screen.x = Math.round(w / 2 + p.screen.scale * p.camera.x * w / 2);
    p.screen.y = Math.round(h / 2 - p.screen.scale * p.camera.y * h / 2);
    p.screen.w = Math.round(p.screen.scale * roadW * w / 2);
  },
  exponentialFog(distance, density) {
    return 1 / Math.pow(Math.E, distance * distance * density);
  },
  rng(seed) {
    let a = seed >>> 0;
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  },
  hash(str) {
    let h = 2166136261;
    for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
    return h >>> 0;
  },
  shuffle(arr, rnd) {
    const a = arr.slice();
    rnd = rnd || Math.random;
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(rnd() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  },
  formatTime(t) {
    if (t == null || !isFinite(t)) return "--'--\"--";
    const m = Math.floor(t / 60);
    const s = Math.floor(t % 60);
    const cs = Math.floor((t * 100) % 100);
    return m + "'" + String(s).padStart(2, '0') + '"' + String(cs).padStart(2, '0');
  },
  ordinal(n) { return n + '°'; },
};
