'use strict';

// ---------------------------------------------------------------------------
// Datos de autos y dificultades
// ---------------------------------------------------------------------------
const CARS = [
  { id: 'rayo',     name: 'RAYO',     color: '#e02828', top: 1.00, accel: 1.00, handling: 1.00, grip: 1.00, desc: 'EQUILIBRADO' },
  { id: 'titan',    name: 'TITAN',    color: '#2a5cff', top: 1.07, accel: 0.82, handling: 0.90, grip: 0.95, desc: 'VELOCIDAD PURA' },
  { id: 'vibora',   name: 'VIBORA',   color: '#22b84a', top: 0.96, accel: 1.25, handling: 1.05, grip: 1.00, desc: 'ACELERACION' },
  { id: 'fantasma', name: 'FANTASMA', color: '#f0f0f0', top: 0.98, accel: 0.95, handling: 1.22, grip: 1.20, desc: 'MANEJO PRECISO' },
];

const DIFFICULTIES = [
  // ai: velocidad punta de los rivales · skill: curvas y reflejos · avoid: prob. de esquivar obstáculos
  // recover: cuánto les afecta chocar con un obstáculo (1 = igual que al jugador)
  { name: 'FACIL',   ai: 0.80, skill: 0.35, avoid: 0.60, recover: 1.00, obst: 0.5, rubber: 0.00, desc: 'Rivales tranquilos, pocos obstáculos' },
  { name: 'NORMAL',  ai: 0.90, skill: 0.60, avoid: 0.82, recover: 0.75, obst: 0.9, rubber: 0.03, desc: 'Un reto equilibrado' },
  { name: 'DIFICIL', ai: 0.96, skill: 0.82, avoid: 0.94, recover: 0.55, obst: 1.2, rubber: 0.06, desc: 'Rivales agresivos, más obstáculos' },
  { name: 'LEYENDA', ai: 1.02, skill: 0.97, avoid: 0.99, recover: 0.40, obst: 1.5, rubber: 0.09, desc: 'Sólo para pilotos de élite' },
];

const CPU_NAMES = ['MAX', 'LUNA', 'TURBO', 'KAI', 'LOLA', 'DRAKO', 'NINA', 'ZETA', 'BRUNO', 'VERA', 'RIKI', 'SOL'];
const TRAFFIC_COLORS = ['#c8c8c8', '#5a6a7a', '#8a2a2a', '#2a4a7a', '#d8d0b0', '#3a5a3a', '#e8e8e8', '#6a4a8a', '#b07030', '#202830'];
const AI_COLORS = ['#ff8a00', '#a040ff', '#00c8d0', '#ff5fa8', '#ffd400', '#8a8a8a', '#8b4a1a', '#e02828', '#2a5cff', '#22b84a', '#f0f0f0', '#40ff90'];

const FONT = '"Press Start 2P", monospace';

// ---------------------------------------------------------------------------
// Carrera: simulación + render pseudo-3D
// ---------------------------------------------------------------------------
class Race {
  constructor(opts) {
    const track = this.track = opts.track;
    this.theme = THEMES[track.theme];
    this.bg = Sprites.background(track.theme);
    this.segments = track.segments;
    this.N = this.segments.length;
    this.length = track.length;
    this.demo = !!opts.demo;
    this.diffIndex = opts.difficulty || 0;
    this.diff = DIFFICULTIES[this.diffIndex];
    this.onFinish = opts.onFinish || null;
    this.xLimit = track.theme === 'city' ? 1.8 : 2.5;
    this.RW = track.roadWidth;                    // medio ancho de la carretera
    this.CW = C.CAR_WORLD_W / this.RW;            // ancho de un auto en unidades de carril
    this.lanes = track.lanes;
    this.linear = track.linear;
    this.startZ = track.startZ;
    this.raceDist = this.linear ? track.finishZ - track.startZ : C.LAPS * this.length;
    this.scaleLen = this.linear ? this.raceDist / 3 : this.length;
    this.endZ = this.length - 330 * C.SEGMENT_LENGTH;   // fin físico de las pistas lineales
    this.time = 0;
    this.state = this.demo ? 'racing' : 'countdown';
    this.countdown = 3;
    this.lastCount = 4;
    this.showHUD = !this.demo;
    this.msg = null;
    this.particles = [];
    this.finishTimer = 0;
    this.focusScreen = null;

    for (const s of this.segments) s.cars.length = 0;
    // Obstáculos en posiciones distintas en cada carrera
    placeObstacles(track, this.diff.obst * track.obstScale * (this.demo ? 0.6 : 1), Util.rng((Math.random() * 4294967296) >>> 0));

    const playerSpec = this.demo ? null : CARS[opts.car || 0];
    const colors = Util.shuffle(AI_COLORS.filter(c => !playerSpec || c !== playerSpec.color));
    const names = Util.shuffle(CPU_NAMES);
    this.cars = [];
    for (let i = 0; i < C.RACERS; i++) {
      const row = Math.floor(i / 2), col = i % 2;
      const isPlayer = !this.demo && i === C.RACERS - 1;
      const spec = isPlayer ? playerSpec : CARS[Math.floor(Math.random() * CARS.length)];
      const color = isPlayer ? spec.color : colors[i % colors.length];
      const travel = -(row * 4 + 2) * C.SEGMENT_LENGTH - col * C.SEGMENT_LENGTH * 2;
      const x = (col ? 0.4 : -0.4) * (C.ROAD_WIDTH / this.RW);
      this.cars.push({
        id: i, name: isPlayer ? 'TU' : names[i % names.length], spec, color, isPlayer,
        sprites: Sprites.car(spec.id, color),
        x, travel, z: Util.mod(travel + this.startZ, this.length), speed: 0,
        lapsDone: 0, lapStart: 0, bestLap: null, lastLap: null,
        finished: false, finishTime: 0, pos: i + 1,
        steer: 0, slip: 0, slipDir: 0, stun: 0, spin: 0, mud: 0, hitCd: 0, bumpCd: 0, shake: 0,
        nitros: isPlayer ? 3 : 2, nitroTime: 0, nitroHeld: false, braking: false, offroad: false,
        lane: x, laneTimer: 2 + Math.random() * 4, aiFactor: 0.93 + Math.random() * 0.07,
        react: 0.05 + Math.random() * 0.5 * (1 - this.diff.skill),
        decisions: {}, segIndex: -1,
      });
    }
    this.player = this.cars.find(c => c.isPlayer) || null;
    this.focus = this.player || this.cars[C.RACERS - 1];
    for (const c of this.cars) this.placeInSegment(c);
    this.traffic = [];
    if (track.traffic && !this.demo) this.spawnTraffic(track.traffic);
    this.updatePositions();
    this.minimap = drawTrackMap(track, 104, { pad: 7, width: 3 });
  }

  // -------------------------------------------------------------------------
  // Utilidades
  // -------------------------------------------------------------------------
  segAt(z) { return this.segments[Math.floor(z / C.SEGMENT_LENGTH) % this.N]; }

  placeInSegment(car) {
    const idx = Math.floor(car.z / C.SEGMENT_LENGTH) % this.N;
    if (idx === car.segIndex) return;
    if (car.segIndex >= 0) {
      const arr = this.segments[car.segIndex].cars;
      const k = arr.indexOf(car);
      if (k >= 0) arr.splice(k, 1);
    }
    this.segments[idx].cars.push(car);
    car.segIndex = idx;
  }

  message(text, t) { this.msg = { text, t, max: t }; }

  zOf(car) { return Util.mod(car.travel + this.startZ, this.length); }

  // -------------------------------------------------------------------------
  // Tráfico civil (sólo autopistas)
  // -------------------------------------------------------------------------
  spawnTraffic(density) {
    const SL = C.SEGMENT_LENGTH, MAX = C.MAX_SPEED;
    const laneSpeed = [0.50, 0.44, 0.38, 0.32];   // carril izquierdo = rápido
    let z = this.startZ + 45 * SL;
    while (true) {
      z += (12 + Math.random() * 22) * SL / density;
      if (z >= this.endZ) break;
      const lane = Math.floor(Math.random() * this.lanes);
      const heavy = lane >= 2 && Math.random() < 0.45;
      const kind = heavy ? (Math.random() < 0.6 ? 'truck' : 'bus')
        : ['sedan', 'sedan', 'hatch', 'pickup', 'van'][Math.floor(Math.random() * 5)];
      const color = kind === 'bus' ? ['#e0b020', '#2a6ad0', '#d03030'][Math.floor(Math.random() * 3)]
        : TRAFFIC_COLORS[Math.floor(Math.random() * TRAFFIC_COLORS.length)];
      const spr = Sprites.vehicle(kind, color);
      const laneX = -1 + (2 * lane + 1) / this.lanes;
      const base = MAX * laneSpeed[Math.min(lane, 3)] * (heavy ? 0.85 : 1) * (0.95 + Math.random() * 0.1);
      this.traffic.push({
        isTraffic: true, kind, sprites: spr, worldW: spr.w, w: spr.w / this.RW, len: spr.len * SL,
        x: laneX + (Math.random() - 0.5) * 0.06, travel: z - this.startZ, z, speed: base, baseSpeed: base,
        steer: 0, stun: 0, braking: false, nitroTime: 0, segIndex: -1,
      });
    }
    for (const t of this.traffic) this.placeInSegment(t);
  }

  updateTraffic(dt) {
    const SL = C.SEGMENT_LENGTH, MAX = C.MAX_SPEED;
    let removed = false;
    for (const t of this.traffic) {
      let target = t.baseSpeed;
      for (const c of this.cars) {
        const dz = c.z - t.z;
        if (dz > 0 && dz < (t.len + C.CAR_LEN) / 2 + SL * 2 && Math.abs(c.x - t.x) < (t.w + this.CW) / 2) target = Math.min(target, c.speed * 0.9);
      }
      t.braking = target < t.speed - 50;
      t.speed = target > t.speed ? Math.min(target, t.speed + MAX * 0.15 * dt) : Math.max(target, t.speed - MAX * 0.8 * dt);
      t.travel += t.speed * dt;
      t.z = this.zOf(t);
      if (t.z >= this.endZ) {
        t.dead = removed = true;
        const arr = this.segments[t.segIndex].cars, k = arr.indexOf(t);
        if (k >= 0) arr.splice(k, 1);
        continue;
      }
      this.placeInSegment(t);
    }
    if (removed) this.traffic = this.traffic.filter(t => !t.dead);
  }

  // -------------------------------------------------------------------------
  // Actualización
  // -------------------------------------------------------------------------
  update(dt, input) {
    input = input || {};
    if (this.msg) { this.msg.t -= dt; if (this.msg.t <= 0) this.msg = null; }
    this.updateParticles(dt);

    if (this.traffic.length) this.updateTraffic(dt);

    if (this.state === 'countdown') {
      this.countdown -= dt;
      const now = Math.ceil(this.countdown);
      if (now !== this.lastCount && now > 0) { Sound.beep(); this.lastCount = now; }
      if (this.countdown <= 0) {
        this.state = 'racing';
        Sound.go();
        this.message('¡YA!', 1.2);
      }
      return;
    }

    this.time += dt;
    for (const car of this.cars) {
      const prevTravel = car.travel;
      if (car.isPlayer && !car.finished) this.updatePlayer(car, dt, input);
      else this.updateAI(car, dt);
      if (this.linear && car.travel + this.startZ > this.endZ) { car.travel = this.endZ - this.startZ; car.speed = 0; }
      car.z = this.zOf(car);
      this.checkHazards(car, prevTravel);
      this.tickTimers(car, dt);
    }
    this.collideCars();
    if (this.traffic.length) this.collideTraffic();
    for (const car of this.cars) {
      car.z = this.zOf(car);
      this.placeInSegment(car);
      if (!this.demo) this.checkLap(car);
    }
    this.updatePositions();

    if (this.justFinished) {
      this.justFinished = false;
      this.message('¡META!  ' + this.player.pos + '° LUGAR', 4);
    }
    if (this.state === 'finished') {
      this.finishTimer -= dt;
      if (this.finishTimer <= 0) this.end();
    }
    this.spawnFocusParticles();
  }

  updatePlayer(car, dt, input) {
    const spec = car.spec, MAX = C.MAX_SPEED;
    const seg = this.segAt(car.z);
    const sp = car.speed / MAX;
    let top = MAX * spec.top;

    if (input.nitro && !car.nitroHeld && car.nitros > 0 && car.nitroTime <= 0 && car.stun <= 0) {
      car.nitros--;
      car.nitroTime = 2.5;
      Sound.nitro();
      this.message('¡NITRO!', 0.8);
    }
    car.nitroHeld = !!input.nitro;
    if (car.nitroTime > 0) { car.nitroTime -= dt; top *= 1.28; }
    if (car.mud > 0) top = Math.min(top, MAX * 0.45);

    car.braking = false;
    if (car.stun > 0) {
      car.stun -= dt;
      car.spin += dt * 14;
      car.speed = Math.max(0, car.speed - MAX * 2 * dt);
      car.steer = 0;
    } else {
      let steer = (input.left ? -1 : 0) + (input.right ? 1 : 0);
      if (car.slip > 0) {
        car.x += car.slipDir * dt * 1.5 * sp;
        steer *= 0.3;
      }
      car.x += steer * dt * 2.6 * spec.handling * Math.min(1, sp * 2.2);
      car.x -= dt * 2 * sp * sp * seg.curve * 0.25 / spec.grip;   // fuerza centrífuga
      car.steer = car.slip > 0 ? car.slipDir : steer;
      if (car.nitroTime > 0) car.speed += MAX * 0.7 * dt;
      if (input.up) car.speed += MAX / 4.5 * spec.accel * Math.max(0.3, 1.25 - car.speed / top) * dt;
      else if (input.down) { car.speed -= MAX * 1.1 * dt; car.braking = true; }
      else car.speed -= MAX / 5 * dt;
    }

    car.offroad = Math.abs(car.x) > 1;
    if (car.offroad) {
      top = Math.min(top, MAX / 3.5);
      car.shake = Math.max(car.shake, 0.1);
    }
    if (car.speed > top) car.speed = Math.max(top, car.speed - MAX * ((car.offroad || car.mud > 0) ? 1.3 : 0.5) * dt);
    car.speed = Math.max(0, car.speed);
    car.x = Util.limit(car.x, -this.xLimit, this.xLimit);
    car.travel += car.speed * dt;
  }

  updateAI(car, dt) {
    const d = this.diff, spec = car.spec, MAX = C.MAX_SPEED, SL = C.SEGMENT_LENGTH, N = this.N;
    const segIdx = Math.floor(car.z / SL) % N;
    const sp = car.speed / MAX;
    let top = MAX * spec.top * d.ai * car.aiFactor;
    if (car.isPlayer) top = MAX * spec.top * 0.8;   // piloto automático tras cruzar la meta
    if (car.finished && this.linear) top = MAX * 0.35;

    // "Rubber band": los rivales se adaptan un poco a la distancia con el jugador
    if (this.player && !car.isPlayer && !this.player.finished) {
      const gap = this.player.travel - car.travel;
      const g = Util.limit(gap / (this.scaleLen * 0.2), -1, 1);
      top *= g > 0 ? 1 + g * (0.04 + d.rubber) : 1 + g * Math.max(0.01, 0.06 - d.rubber);
    }

    let maxCurve = 0;
    for (let i = 1; i <= 14; i++) maxCurve = Math.max(maxCurve, Math.abs(this.segments[(segIdx + i) % N].curve));
    top *= 1 - (maxCurve / 6) * (0.2 - 0.14 * d.skill);

    if (!car.isPlayer && car.nitros > 0 && car.nitroTime <= 0 && maxCurve < 1 && this.time > 6 &&
        Math.random() < dt * 0.06 * d.skill) {
      car.nitros--; car.nitroTime = 2.2;
    }
    if (car.nitroTime > 0) { car.nitroTime -= dt; top *= 1.2; }
    if (car.mud > 0) top = Math.min(top, MAX * 0.45);

    // --- dirección objetivo ---
    car.laneTimer -= dt;
    if (car.laneTimer <= 0) { car.lane = Math.random() * 1.4 - 0.7; car.laneTimer = 3 + Math.random() * 5; }
    let tx = car.lane, avoiding = false;
    const CW = this.CW;
    const look = Math.round(8 + d.skill * 16);
    const lap = Math.floor(car.travel / this.length);
    const obs = [];
    for (let i = 1; i <= look; i++) {
      for (const ob of this.segments[(segIdx + i) % N].obstacles) if (ob.hiddenUntil <= this.time) obs.push(ob);
    }
    if (obs.length) {
      const blockedAt = x => obs.some(ob => Util.overlap(x, CW * 1.25, ob.offset, ob.coll, 1));
      const blocker = obs.find(ob => Util.overlap(car.x, CW * 1.3, ob.offset, ob.coll, 1) || Util.overlap(car.lane, CW * 1.3, ob.offset, ob.coll, 1));
      if (blocker) {
        let dec = car.decisions[blocker.gid];
        if (!dec || dec.lap !== lap) dec = car.decisions[blocker.gid] = { lap, avoid: Math.random() < d.avoid };
        if (dec.avoid) {
          // Busca el hueco libre más cercano teniendo en cuenta todos los obstáculos próximos
          const cands = [car.x, car.lane];
          for (const ob of obs) {
            const gap = (ob.coll + CW) / 2 + 0.08;
            cands.push(ob.offset - gap, ob.offset + gap);
          }
          let bestX = null;
          for (const cx of cands) {
            if (Math.abs(cx) > 0.88 || blockedAt(cx)) continue;
            if (bestX === null || Math.abs(cx - car.x) < Math.abs(bestX - car.x)) bestX = cx;
          }
          if (bestX !== null) { tx = bestX; avoiding = true; }
        }
      }
    }
    const others = this.traffic.length ? this.cars.concat(this.traffic) : this.cars;
    let best = null, bestDz = Infinity;
    for (const o of others) {
      if (o === car) continue;
      let dz = o.z - car.z;
      if (dz < 0) dz += this.length;
      const len = o.len || C.CAR_LEN;
      if (dz > SL * 10 + len / 2 || dz >= bestDz) continue;
      const half = ((o.w || CW) + CW) / 2;
      if (Math.abs(o.x - (avoiding ? tx : car.x)) > half * 1.15) continue;
      if (o.speed >= car.speed * 0.98 && dz > SL * 2 + len / 2) continue;
      best = o; bestDz = dz;
    }
    if (best) {
      const o = best, half = ((o.w || CW) + CW) / 2, len = o.len || C.CAR_LEN;
      if (!avoiding) {
        const side = car.x >= o.x ? 1 : -1;
        let nx = o.x + side * half * 1.3;
        if (Math.abs(nx) > 0.9) nx = o.x - side * half * 1.3;
        tx = nx;
      }
      if (bestDz < SL * 2.2 + len / 2 && o.speed < car.speed && Math.abs(o.x - car.x) < half) top = Math.min(top, o.speed * 0.98);
    }
    tx = Util.limit(tx, -0.88, 0.88);

    let steer = 0;
    car.braking = false;
    if (car.stun > 0) {
      car.stun -= dt;
      car.spin += dt * 14;
      car.speed = Math.max(0, car.speed - MAX * 2 * dt);
    } else {
      const rate = (1.1 + d.skill * 1.0) * spec.handling * Math.min(1, sp * 2.5);
      const dx = tx - car.x;
      car.x += Util.limit(dx, -rate * dt, rate * dt);
      steer = Math.abs(dx) > 0.03 ? Math.sign(dx) : 0;
      if (car.slip > 0) { car.x += car.slipDir * dt * 1.2 * sp; steer = car.slipDir; }
      if (this.time >= car.react) {
        if (car.speed < top) car.speed = Math.min(top, car.speed + MAX / 4.5 * spec.accel * Math.max(0.3, 1.25 - car.speed / top) * dt);
        else {
          car.braking = car.speed > top * 1.03;
          car.speed = Math.max(top, car.speed - MAX * (car.mud > 0 ? 1.3 : 0.6) * dt);
        }
      }
    }
    car.steer = steer;
    car.offroad = Math.abs(car.x) > 1;
    if (car.offroad) {
      car.speed = Math.min(car.speed, Math.max(MAX / 3.5, car.speed - MAX * 1.2 * dt));
      car.shake = Math.max(car.shake, 0.1);
    }
    car.x = Util.limit(car.x, -this.xLimit, this.xLimit);
    car.travel += car.speed * dt;
  }

  tickTimers(car, dt) {
    car.hitCd = Math.max(0, car.hitCd - dt);
    car.bumpCd = Math.max(0, car.bumpCd - dt);
    car.slip = Math.max(0, car.slip - dt);
    car.mud = Math.max(0, car.mud - dt);
    car.shake = Math.max(0, car.shake - dt);
  }

  checkHazards(car, prevTravel) {
    const SL = C.SEGMENT_LENGTH;
    const from = Math.floor((prevTravel + this.startZ) / SL), to = Math.floor((car.travel + this.startZ) / SL);
    for (let i = from; i <= to; i++) {
      const seg = this.segments[Util.mod(i, this.N)];
      for (const ob of seg.obstacles) {
        if (ob.hiddenUntil > this.time) continue;
        if (Util.overlap(car.x, this.CW, ob.offset, ob.coll, 1)) this.hitObstacle(car, ob);
      }
      if (Math.abs(car.x) > 0.95 && car.hitCd <= 0) {
        for (const s of seg.sprites) {
          if (s.coll && Util.overlap(car.x, this.CW * 0.8, s.offset, s.coll, 1)) { this.hitScenery(car, s); break; }
        }
      }
    }
  }

  hitObstacle(car, ob) {
    const isP = car.isPlayer && !this.demo;
    const k = car.isPlayer ? 1 : this.diff.recover;   // los rivales expertos se reponen antes
    switch (ob.type) {
      case 'mud':
        if (isP && car.mud <= 0) this.message(ob.kind === 'snowpile' ? '¡NIEVE!' : ob.kind === 'sand' ? '¡ARENA!' : '¡LODO!', 0.8);
        car.mud = 0.6 * k;
        car.shake = Math.max(car.shake, 0.3);
        break;
      case 'slow':
        if (car.hitCd > 0) return;
        car.speed *= 1 - 0.45 * k;
        car.hitCd = 0.5;
        car.shake = 0.35;
        ob.hiddenUntil = this.time + 8;
        if (isP) Sound.cone();
        break;
      case 'slip':
        if (car.hitCd > 0) return;
        car.slip = 1.4 * k;
        car.slipDir = car.steer || (Math.random() < 0.5 ? -1 : 1);
        car.speed *= 0.85;
        car.hitCd = 1.2;
        if (isP) { Sound.skid(); this.message(ob.kind === 'ice' ? '¡HIELO!' : '¡ACEITE!', 0.9); }
        break;
      case 'stop': {
        if (car.hitCd > 0) return;
        car.stun = 1.3 * k;
        car.spin = 0;
        car.speed = 0;
        car.hitCd = 2.2;
        car.shake = 0.6;
        car.nitroTime = 0;
        const side = car.x >= ob.offset ? 1 : -1;
        car.x = ob.offset + side * (ob.coll / 2 + this.CW / 2 + 0.04);
        if (isP) { Sound.crash(); this.message('¡CHOQUE!', 1.0); }
        break;
      }
    }
  }

  hitScenery(car, s) {
    car.speed *= 0.25;
    car.x -= Math.sign(car.x) * 0.18;
    car.hitCd = 0.6;
    car.shake = 0.5;
    if (car.isPlayer && !this.demo) Sound.crash();
  }

  collideCars() {
    const cars = this.cars, L = this.length;
    const wx = this.CW * 0.9;
    for (let i = 0; i < cars.length; i++) {
      for (let j = i + 1; j < cars.length; j++) {
        const a = cars[i], b = cars[j];
        let dz = b.z - a.z;
        if (dz > L / 2) dz -= L; else if (dz < -L / 2) dz += L;
        const ad = Math.abs(dz);
        if (ad >= C.CAR_LEN) continue;
        const dxv = b.x - a.x;
        if (Math.abs(dxv) >= wx) continue;
        const s = dxv >= 0 ? 1 : -1;
        if (ad < C.CAR_LEN * 0.45) {
          // lado a lado: empujón lateral
          const push = (wx - Math.abs(dxv)) / 2 + 0.005;
          a.x -= s * push; b.x += s * push;
          a.speed *= 0.995; b.speed *= 0.995;
        } else {
          // alcance por detrás
          const back = dz > 0 ? a : b, front = dz > 0 ? b : a;
          if (back.speed > front.speed) {
            const diff = back.speed - front.speed;
            back.speed = front.speed * 0.9;
            front.speed += diff * 0.25;
          }
          back.travel -= (C.CAR_LEN - ad);
          a.x -= s * 0.03; b.x += s * 0.03;
        }
        const p = a.isPlayer ? a : b.isPlayer ? b : null;
        if (p && !this.demo) {
          p.shake = Math.max(p.shake, 0.25);
          if (p.bumpCd <= 0) { Sound.bump(); p.bumpCd = 0.35; }
        }
      }
    }
  }

  collideTraffic() {
    const MAX = C.MAX_SPEED;
    for (const c of this.cars) {
      for (const t of this.traffic) {
        const dz = t.z - c.z;
        const lenSum = (t.len + C.CAR_LEN) / 2;
        if (Math.abs(dz) >= lenSum) continue;
        const half = (t.w + this.CW) / 2 * 0.9;
        const dxv = c.x - t.x;
        if (Math.abs(dxv) >= half) continue;
        const s = dxv >= 0 ? 1 : -1;
        let hard = false;
        if (Math.abs(dz) < lenSum * 0.5) {
          // lado a lado: el tráfico no se mueve, el corredor rebota
          c.x = t.x + s * (half + 0.01);
          c.speed *= 0.97;
        } else if (dz > 0) {
          // el corredor alcanza al vehículo por detrás
          hard = c.speed - t.speed > MAX * 0.25;
          c.speed = Math.min(c.speed, t.speed * (hard ? 0.6 : 0.85));
          c.travel -= (lenSum - dz);
          c.x += s * 0.04;
        } else {
          // el vehículo alcanza al corredor
          t.speed = Math.min(t.speed, c.speed * 0.9);
          t.travel -= (lenSum + dz);
          t.z = this.zOf(t);
        }
        if (c.isPlayer && !this.demo) {
          c.shake = Math.max(c.shake, hard ? 0.5 : 0.25);
          if (c.bumpCd <= 0) { if (hard) Sound.crash(); else Sound.bump(); c.bumpCd = 0.4; }
        }
      }
    }
  }

  checkLap(car) {
    if (car.finished) return;
    if (this.linear) {
      if (car.travel < this.raceDist) return;
      car.bestLap = this.time;
    }
    const laps = this.linear ? C.LAPS : (car.travel >= 0 ? Math.floor(car.travel / this.length) : 0);
    if (laps <= car.lapsDone) return;
    const lapTime = this.time - car.lapStart;
    car.lapsDone = laps;
    car.lastLap = lapTime;
    car.lapStart = this.time;
    if (!car.bestLap || lapTime < car.bestLap) car.bestLap = lapTime;
    if (car.lapsDone >= C.LAPS) {
      car.finished = true;
      car.finishTime = this.time;
      if (car.isPlayer) {
        this.state = 'finished';
        this.finishTimer = 4;
        this.justFinished = true;
        Sound.finish();
      }
    } else if (car.isPlayer) {
      Sound.lap();
      this.message(car.lapsDone === C.LAPS - 1 ? '¡ULTIMA VUELTA!' : 'VUELTA ' + (car.lapsDone + 1), 2);
    }
  }

  updatePositions() {
    const order = this.cars.slice().sort((a, b) => {
      if (a.finished && b.finished) return a.finishTime - b.finishTime;
      if (a.finished !== b.finished) return a.finished ? -1 : 1;
      return b.travel - a.travel;
    });
    order.forEach((c, i) => { c.pos = i + 1; });
    this.order = order;
  }

  end() {
    this.state = 'done';
    const total = this.raceDist;
    const res = this.cars.map(c => {
      let t = c.finishTime, est = false;
      if (!c.finished) {
        est = true;
        t = this.time + Math.max(0, total - c.travel) / Math.max(c.speed, C.MAX_SPEED * 0.5);
      }
      return { name: c.name, car: c.spec.name, color: c.color, isPlayer: c.isPlayer, time: t, est, bestLap: c.bestLap };
    }).sort((a, b) => a.time - b.time);
    const playerPos = res.findIndex(r => r.isPlayer) + 1;
    if (this.onFinish) {
      this.onFinish({
        standings: res, playerPos, track: this.track, difficulty: this.diffIndex,
        time: this.player.finishTime, bestLap: this.player.bestLap,
      });
    }
  }

  // -------------------------------------------------------------------------
  // Partículas (polvo, humo) en coordenadas de pantalla
  // -------------------------------------------------------------------------
  spawnFocusParticles() {
    const f = this.focus, fs = this.focusScreen;
    if (!fs) return;
    const sp = f.speed / C.MAX_SPEED;
    let color = null, n = 0;
    if ((f.offroad || f.mud > 0) && sp > 0.05) { color = this.theme.dust; n = 2; }
    else if (f.slip > 0 || f.stun > 0) { color = '#cfcfcf'; n = 2; }
    else if (f.nitroTime > 0) { color = '#ffb030'; n = 1; }
    for (let i = 0; i < n; i++) {
      const side = Math.random() < 0.5 ? -1 : 1;
      this.particles.push({
        x: fs.x + side * fs.w * (0.3 + Math.random() * 0.15),
        y: fs.y - 4 - Math.random() * 6,
        vx: side * (20 + Math.random() * 60),
        vy: -(30 + Math.random() * 60),
        life: 0.4 + Math.random() * 0.3,
        size: 3 + Math.floor(Math.random() * 4),
        color,
      });
    }
  }

  updateParticles(dt) {
    for (const p of this.particles) {
      p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 60 * dt; p.life -= dt;
    }
    this.particles = this.particles.filter(p => p.life > 0);
    if (this.particles.length > 200) this.particles.splice(0, this.particles.length - 200);
  }

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------
  render(ctx) {
    const W = C.W, H = C.H, SL = C.SEGMENT_LENGTH, N = this.N, L = this.length, RW = this.RW;
    const focus = this.focus;
    const position = Util.mod(focus.z - C.PLAYER_Z, L);
    const baseSeg = this.segments[Math.floor(position / SL) % N];
    const basePercent = Util.percentRemaining(position, SL);
    const playerSeg = this.segAt(focus.z);
    const playerPercent = Util.percentRemaining(focus.z, SL);
    const playerY = Util.interpolate(playerSeg.p1.world.y, playerSeg.p2.world.y, playerPercent);
    const hi = playerSeg.index;
    const heading = Util.interpolate(this.track.heading[hi], this.track.heading[hi + 1], playerPercent);

    ctx.save();
    if (focus.shake > 0 && focus.speed > 300) {
      ctx.translate(Math.round((Math.random() - 0.5) * 3), Math.round((Math.random() - 0.5) * 2));
    }
    this.renderBackground(ctx, heading, playerY);

    // --- carretera (de cerca a lejos) ---
    let maxy = H, x = 0, dx = -(baseSeg.curve * basePercent);
    const camX = focus.x * RW, camY = playerY + C.CAMERA_HEIGHT;
    for (let n = 0; n < C.DRAW_DISTANCE; n++) {
      const seg = this.segments[(baseSeg.index + n) % N];
      const looped = seg.index < baseSeg.index;
      seg.fog = Util.exponentialFog(n / C.DRAW_DISTANCE, C.FOG_DENSITY);
      seg.clip = maxy;
      const camZ = position - (looped ? L : 0);
      Util.project(seg.p1, camX - x, camY, camZ, C.CAMERA_DEPTH, W, H, RW);
      Util.project(seg.p2, camX - x - dx, camY, camZ, C.CAMERA_DEPTH, W, H, RW);
      x += dx;
      dx += seg.curve;
      if (seg.p1.camera.z <= C.CAMERA_DEPTH || seg.p2.screen.y >= seg.p1.screen.y || seg.p2.screen.y >= maxy) continue;
      this.renderSegment(ctx, seg, maxy);
      maxy = seg.p2.screen.y;
    }

    // --- sprites (de lejos a cerca) ---
    let focusDrawn = false;
    for (let n = C.DRAW_DISTANCE - 1; n > 0; n--) {
      const seg = this.segments[(baseSeg.index + n) % N];
      const isPSeg = seg === playerSeg;
      if (seg.p1.camera.z > C.CAMERA_DEPTH) {
        const scale = seg.p1.screen.scale;
        for (const s of seg.sprites) {
          this.drawSprite(ctx, s.img, s.w, scale, seg.p1.screen.x + scale * s.offset * RW * W / 2, seg.p1.screen.y, seg.clip);
        }
        for (const o of seg.obstacles) {
          if (o.hiddenUntil > this.time) continue;
          this.drawSprite(ctx, o.img, o.w, scale, seg.p1.screen.x + scale * o.offset * RW * W / 2, seg.p1.screen.y, seg.clip);
        }
        if (seg.cars.length) {
          const list = seg.cars.slice().sort((a, b) => b.z - a.z);
          for (const car of list) {
            if (car === focus) continue;
            if (isPSeg && car.z < focus.z && !focusDrawn) { this.drawFocus(ctx, playerSeg, playerPercent); focusDrawn = true; }
            this.drawCar(ctx, car, seg);
          }
        }
      }
      if (isPSeg && !focusDrawn) { this.drawFocus(ctx, playerSeg, playerPercent); focusDrawn = true; }
    }
    if (!focusDrawn) this.drawFocus(ctx, playerSeg, playerPercent);

    for (const p of this.particles) {
      ctx.globalAlpha = Math.min(1, p.life * 2.5);
      ctx.fillStyle = p.color;
      ctx.fillRect(Math.round(p.x), Math.round(p.y), p.size, p.size);
    }
    ctx.globalAlpha = 1;
    ctx.restore();

    if (this.showHUD) this.renderHUD(ctx);
  }

  renderBackground(ctx, heading, playerY) {
    const bg = this.bg, W = C.W, H = C.H;
    const off = heading / (Math.PI * 2);
    const ys = Util.limit(playerY * 0.0015, -18, 18);
    const horizon = H / 2;
    ctx.fillStyle = bg.top;
    ctx.fillRect(0, 0, W, H);
    this.drawLayer(ctx, bg.sky, off * bg.sky.width, horizon + 20 - bg.sky.height + ys);
    this.drawLayer(ctx, bg.far, off * bg.far.width, horizon + 12 - bg.far.height + ys);
    const nearY = horizon + 26 - bg.near.height + ys * 1.4;
    this.drawLayer(ctx, bg.near, off * bg.near.width * 2, nearY);
    ctx.fillStyle = bg.ground;
    ctx.fillRect(0, Math.round(nearY + bg.near.height), W, H);
  }

  drawLayer(ctx, img, offset, y) {
    const w = img.width;
    const x = Math.round(-Util.mod(offset, w));
    y = Math.round(y);
    ctx.drawImage(img, x, y);
    if (x + w < C.W) ctx.drawImage(img, x + w, y);
  }

  renderSegment(ctx, seg, maxy) {
    const W = C.W;
    const col = seg.dark ? this.theme.colors.dark : this.theme.colors.light;
    let x1 = seg.p1.screen.x, y1 = seg.p1.screen.y, w1 = seg.p1.screen.w;
    const x2 = seg.p2.screen.x, y2 = seg.p2.screen.y, w2 = seg.p2.screen.w;
    if (y1 > maxy) {
      const t = (maxy - y2) / (y1 - y2);
      x1 = x2 + (x1 - x2) * t;
      w1 = w2 + (w1 - w2) * t;
      y1 = maxy;
    }
    const yb = y1 + 1;
    ctx.fillStyle = col.grass;
    ctx.fillRect(0, y2, W, yb - y2);

    const r1 = w1 / 6, r2 = w2 / 6;
    const quad = (ax, ay, bx, by, cx, cy, dx, dy, color) => {
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.moveTo(ax, ay); ctx.lineTo(bx, by); ctx.lineTo(cx, cy); ctx.lineTo(dx, dy);
      ctx.closePath(); ctx.fill();
    };
    quad(x1 - w1 - r1, yb, x1 - w1, yb, x2 - w2, y2, x2 - w2 - r2, y2, col.rumble);
    quad(x1 + w1 + r1, yb, x1 + w1, yb, x2 + w2, y2, x2 + w2 + r2, y2, col.rumble);

    if (seg.checker) {
      const cols = 10;
      for (let k = 0; k < cols; k++) {
        const a1 = x1 - w1 + 2 * w1 * k / cols, b1 = x1 - w1 + 2 * w1 * (k + 1) / cols;
        const a2 = x2 - w2 + 2 * w2 * k / cols, b2 = x2 - w2 + 2 * w2 * (k + 1) / cols;
        quad(a1, yb, b1, yb, b2, y2, a2, y2, (k + seg.index) % 2 ? '#111' : '#f4f4f4');
      }
    } else {
      quad(x1 - w1, yb, x1 + w1, yb, x2 + w2, y2, x2 - w2, y2, col.road);
      if (col.lane) {
        const l1 = w1 / 32, l2 = w2 / 32;
        const lw1 = w1 * 2 / this.lanes, lw2 = w2 * 2 / this.lanes;
        let lx1 = x1 - w1 + lw1, lx2 = x2 - w2 + lw2;
        for (let lane = 1; lane < this.lanes; lane++, lx1 += lw1, lx2 += lw2) {
          quad(lx1 - l1 / 2, yb, lx1 + l1 / 2, yb, lx2 + l2 / 2, y2, lx2 - l2 / 2, y2, col.lane);
        }
      }
    }
    if (seg.fog < 1) {
      ctx.globalAlpha = 1 - seg.fog;
      ctx.fillStyle = this.theme.fog;
      ctx.fillRect(0, y2, W, yb - y2);
      ctx.globalAlpha = 1;
    }
  }

  drawSprite(ctx, img, worldW, scale, x, y, clipY) {
    const destW = worldW * scale * C.W / 2;
    if (destW < 0.5 || destW > 4000) return;
    const destH = destW * img.height / img.width;
    const dx = x - destW / 2, dy = y - destH;
    if (dx > C.W || dx + destW < 0) return;
    const clipH = clipY ? Math.max(0, dy + destH - clipY) : 0;
    if (clipH >= destH) return;
    ctx.drawImage(img, 0, 0, img.width, img.height - img.height * clipH / destH, dx, dy, destW, destH - clipH);
  }

  drawCar(ctx, car, seg) {
    const RW = this.RW, W = C.W;
    const p = Util.percentRemaining(car.z, C.SEGMENT_LENGTH);
    const scale = Util.interpolate(seg.p1.screen.scale, seg.p2.screen.scale, p);
    const sx = Util.interpolate(seg.p1.screen.x, seg.p2.screen.x, p) + scale * car.x * RW * W / 2;
    const sy = Util.interpolate(seg.p1.screen.y, seg.p2.screen.y, p);
    this.drawCarSprite(ctx, car, scale, sx, sy, seg.clip);
  }

  drawCarSprite(ctx, car, scale, x, y, clip) {
    const spr = car.sprites;
    let img = spr.straight;
    if (car.stun > 0) img = [spr.straight, spr.right, spr.straight, spr.left][Math.floor(car.spin) % 4];
    else if (car.steer < 0) img = spr.left;
    else if (car.steer > 0) img = spr.right;
    const destW = (car.worldW || C.CAR_WORLD_W) * scale * C.W / 2;
    if (destW < 1 || destW > 2500) return;
    const destH = destW * img.height / img.width;
    const dx = x - destW / 2, dy = y - destH;
    if (dx > C.W || dx + destW < 0) return;
    const clipH = clip ? Math.max(0, dy + destH - clip) : 0;
    if (clipH >= destH) return;
    ctx.drawImage(img, 0, 0, img.width, img.height - img.height * clipH / destH, dx, dy, destW, destH - clipH);
    if (clipH > 0) return;
    const k = destW / img.width;
    if (car.braking) {
      ctx.fillStyle = 'rgba(255,60,60,0.35)';
      for (const l of spr.lights) ctx.fillRect(dx + (l[0] - 2) * k, dy + (l[1] - 2) * k, (l[2] + 4) * k, (l[3] + 4) * k);
      ctx.fillStyle = '#ffb0b0';
      for (const l of spr.lights) ctx.fillRect(dx + (l[0] + 1) * k, dy + (l[1] + 1) * k, (l[2] - 2) * k, (l[3] - 2) * k);
    }
    if (car.nitroTime > 0) {
      for (const e of spr.exhaust) {
        const ex = dx + e[0] * k, ey = dy + e[1] * k;
        const r = (2.5 + Math.random() * 2) * k;
        ctx.fillStyle = 'rgba(255,120,0,0.8)';
        ctx.beginPath(); ctx.arc(ex, ey, r, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#fff3a0';
        ctx.beginPath(); ctx.arc(ex, ey, r * 0.5, 0, Math.PI * 2); ctx.fill();
      }
    }
  }

  drawFocus(ctx, playerSeg, playerPercent) {
    const focus = this.focus, W = C.W, H = C.H;
    const scale = C.CAMERA_DEPTH / C.PLAYER_Z;
    const camYp = Util.interpolate(playerSeg.p1.camera.y, playerSeg.p2.camera.y, playerPercent);
    let y = H / 2 - scale * camYp * H / 2 - 4;
    let x = W / 2;
    const sp = focus.speed / C.MAX_SPEED;
    if (sp > 0.05 && Math.random() < 0.3 * sp) y -= 1;
    if (focus.shake > 0 && focus.speed > 100) {
      x += (Math.random() - 0.5) * 6;
      y += (Math.random() - 0.5) * 4;
    }
    x = Math.round(x); y = Math.round(y);
    this.drawCarSprite(ctx, focus, scale, x, y, 0);
    this.focusScreen = { x, y, w: C.CAR_WORLD_W * scale * W / 2 };
  }

  // -------------------------------------------------------------------------
  // HUD
  // -------------------------------------------------------------------------
  text(ctx, str, x, y, size, color, align) {
    ctx.font = size + 'px ' + FONT;
    ctx.textAlign = align || 'left';
    ctx.textBaseline = 'alphabetic';
    const o = Math.max(1, Math.round(size / 8));
    ctx.fillStyle = '#000';
    ctx.fillText(str, x + o, y + o);
    ctx.fillStyle = color;
    ctx.fillText(str, x, y);
  }

  bigText(ctx, str, x, y, size, color) {
    ctx.font = size + 'px ' + FONT;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.lineJoin = 'round';
    ctx.lineWidth = Math.max(4, size / 5);
    ctx.strokeStyle = '#000';
    ctx.strokeText(str, x, y);
    ctx.fillStyle = color;
    ctx.fillText(str, x, y);
  }

  panel(ctx, x, y, w, h) {
    ctx.fillStyle = 'rgba(0,0,25,0.55)';
    ctx.fillRect(x, y, w, h);
    ctx.strokeStyle = 'rgba(255,255,255,0.45)';
    ctx.lineWidth = 1;
    ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
  }

  renderHUD(ctx) {
    const p = this.player;
    if (!p) return;
    const W = C.W, H = C.H, SL = C.SEGMENT_LENGTH;

    // Posición y vuelta
    this.panel(ctx, 6, 6, 162, 50);
    this.text(ctx, 'POS', 14, 20, 8, '#ffd23a');
    this.text(ctx, String(p.pos), 14, 48, 24, p.pos === 1 ? '#ffd23a' : '#fff');
    this.text(ctx, '/' + C.RACERS, 40, 48, 8, '#ccc');
    if (this.linear) {
      this.text(ctx, 'RECORRIDO', 70, 20, 8, '#ffd23a');
      const pct = Util.limit(Math.floor(p.travel / this.raceDist * 100), 0, 100);
      this.text(ctx, pct + '%', 86, 46, 16, '#fff');
    } else {
      this.text(ctx, 'VUELTA', 86, 20, 8, '#ffd23a');
      this.text(ctx, Math.min(C.LAPS, p.lapsDone + 1) + '/' + C.LAPS, 86, 46, 16, '#fff');
    }

    // Tiempos
    this.panel(ctx, W / 2 - 92, 6, 184, 42);
    const t = p.finished ? p.finishTime : this.time;
    this.text(ctx, Util.formatTime(t), W / 2, 24, 12, '#fff', 'center');
    if (this.linear) {
      const km = Math.max(0, this.raceDist - p.travel) * (250 / 3.6 / C.MAX_SPEED) / 1000;
      this.text(ctx, 'META A ' + km.toFixed(1) + ' KM', W / 2, 40, 8, '#9fe8ff', 'center');
    } else {
      this.text(ctx, 'MEJOR ' + Util.formatTime(p.bestLap), W / 2, 40, 8, '#9fe8ff', 'center');
    }

    // Clasificación corta
    const top = this.order.slice(0, 3);
    this.panel(ctx, 6, 60, 110, 40);
    top.forEach((c, i) => {
      ctx.fillStyle = c.color;
      ctx.fillRect(12, 66 + i * 11, 6, 6);
      this.text(ctx, (i + 1) + ' ' + c.name, 22, 73 + i * 11, 8, c.isPlayer ? '#ffd23a' : '#fff');
    });

    // Minimapa
    const mx = W - 112, my = 6, ms = 106;
    this.panel(ctx, mx, my, ms, ms);
    ctx.drawImage(this.minimap, mx + 1, my + 1);
    const pad = 7, inner = 104 - pad * 2;
    const blink = Math.floor(performance.now() / 200) % 2 === 0;
    const drawDot = (car, size) => {
      let idx = Math.floor(car.z / SL) % this.N;
      if (this.linear) idx = Util.limit(idx, 0, this.track.finishSeg);
      const pt = this.track.map[idx];
      const px = Math.round(mx + 1 + pad + pt.x * inner), py = Math.round(my + 1 + pad + pt.y * inner);
      ctx.fillStyle = '#000';
      ctx.fillRect(px - size / 2 - 1, py - size / 2 - 1, size + 2, size + 2);
      ctx.fillStyle = car.color;
      ctx.fillRect(px - size / 2, py - size / 2, size, size);
    };
    for (const c of this.cars) if (!c.isPlayer) drawDot(c, 4);
    if (blink || this.state !== 'racing') drawDot(p, 6);

    // Velocímetro
    this.panel(ctx, 6, H - 44, 196, 38);
    const kmh = Math.round(p.speed / C.MAX_SPEED * 250);
    this.text(ctx, String(kmh).padStart(3, ' '), 14, H - 16, 16, '#fff');
    this.text(ctx, 'KM/H', 66, H - 16, 8, '#ffd23a');
    const blocks = 12, frac = Math.min(1, kmh / 330);
    for (let i = 0; i < blocks; i++) {
      const on = i < Math.round(frac * blocks);
      ctx.fillStyle = on ? (i < 6 ? '#3ce03c' : i < 9 ? '#ffd23a' : '#ff3030') : 'rgba(255,255,255,0.15)';
      ctx.fillRect(108 + i * 7, H - 32 + (blocks - i) * 0.8, 5, 18 - (blocks - i) * 0.8);
    }

    // Nitro
    this.panel(ctx, W - 122, H - 44, 116, 38);
    this.text(ctx, 'NITRO', W - 114, H - 28, 8, '#ffd23a');
    for (let i = 0; i < 3; i++) {
      ctx.fillStyle = i < p.nitros ? '#2ad4ff' : 'rgba(255,255,255,0.15)';
      ctx.fillRect(W - 114 + i * 20, H - 22, 16, 10);
      if (i < p.nitros) { ctx.fillStyle = '#c8f4ff'; ctx.fillRect(W - 112 + i * 20, H - 20, 5, 2); }
    }
    if (p.nitroTime > 0) {
      ctx.fillStyle = '#ff9a20';
      ctx.fillRect(W - 54, H - 22, Math.round(44 * p.nitroTime / 2.5), 10);
    }

    // Avisos
    if (p.offroad && this.state === 'racing') this.text(ctx, '¡FUERA DE PISTA!', W / 2, 64, 8, (Math.floor(performance.now() / 150) % 2) ? '#ff5050' : '#fff', 'center');

    if (this.state === 'countdown') {
      const n = Math.max(1, Math.ceil(this.countdown));
      const f = this.countdown - Math.floor(this.countdown);
      this.bigText(ctx, String(n), W / 2, H / 2 - 30, Math.round(40 + f * 24), n === 1 ? '#ff4040' : '#ffd23a');
    }
    if (this.msg) {
      const big = this.msg.text.length < 10;
      this.bigText(ctx, this.msg.text, W / 2, H / 2 - 60, big ? 24 : 16, '#ffd23a');
    }
  }
}
