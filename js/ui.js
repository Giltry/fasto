'use strict';

// ---------------------------------------------------------------------------
// Menús HTML con navegación por teclado y ratón
// ---------------------------------------------------------------------------
const UI = {
  current: null,
  items: [],
  index: 0,
  mem: {},
  handlers: {},

  init(handlers) {
    this.handlers = handlers;
    document.querySelectorAll('.screen').forEach(sc => {
      sc.addEventListener('click', e => {
        const opt = e.target.closest('.opt');
        if (!opt || !sc.classList.contains('active')) return;
        Sound.init();
        const i = this.items.indexOf(opt);
        if (i < 0) return;
        this.index = i;
        this.highlight();
        this.activate();
      });
      sc.addEventListener('mousemove', e => {
        const opt = e.target.closest('.opt');
        if (!opt) return;
        const i = this.items.indexOf(opt);
        if (i >= 0 && i !== this.index) { this.index = i; this.highlight(); }
      });
    });
  },

  el(id) { return document.getElementById(id); },

  show(id, index) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    const el = this.el(id);
    el.classList.add('active');
    this.current = id;
    this.items = Array.from(el.querySelectorAll('.opt'));
    const i = index != null ? index : (this.mem[id] || 0);
    this.index = Util.limit(i, 0, Math.max(0, this.items.length - 1));
    this.highlight();
  },

  hideAll() {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    this.current = null;
    this.items = [];
  },

  highlight() {
    this.items.forEach((it, i) => it.classList.toggle('sel', i === this.index));
    if (this.current) this.mem[this.current] = this.index;
  },

  move(d) {
    const n = this.items.length;
    if (!n) return;
    this.index = (this.index + d + n) % n;
    Sound.move();
    this.highlight();
  },

  activate() {
    const it = this.items[this.index];
    if (it) this.handlers.onAction(this.current, it.dataset.action, it, this.index);
  },

  key(e) {
    if (!this.current) return false;
    switch (e.code) {
      case 'ArrowUp': case 'ArrowLeft': case 'KeyW': case 'KeyA': this.move(-1); return true;
      case 'ArrowDown': case 'ArrowRight': case 'KeyS': case 'KeyD': this.move(1); return true;
      case 'Enter': case 'NumpadEnter': case 'Space': this.activate(); return true;
      case 'Escape': case 'Backspace': this.handlers.onBack(this.current); return true;
    }
    return false;
  },

  shake(el) {
    el.classList.remove('shake');
    void el.offsetWidth;
    el.classList.add('shake');
  },

  // ----- Constructores de pantallas -----
  buildCars() {
    const box = this.el('car-cards');
    box.innerHTML = '';
    const pct = v => Math.round(Util.limit((v - 0.7) / 0.6, 0.05, 1) * 100);
    CARS.forEach((car, i) => {
      const b = document.createElement('button');
      b.className = 'opt card';
      b.dataset.action = 'car';
      b.dataset.i = i;
      const cv = document.createElement('canvas');
      cv.width = 120; cv.height = 72;
      const g = cv.getContext('2d');
      g.imageSmoothingEnabled = false;
      const grd = g.createLinearGradient(0, 0, 0, 72);
      grd.addColorStop(0, '#2f6fd6'); grd.addColorStop(0.5, '#a8dcff'); grd.addColorStop(0.5, '#555'); grd.addColorStop(1, '#777');
      g.fillStyle = grd; g.fillRect(0, 0, 120, 72);
      g.fillStyle = '#eee'; g.fillRect(58, 40, 4, 6); g.fillRect(57, 54, 6, 10);
      g.drawImage(Sprites.car(car.id, car.color).straight, 12, 10, 96, 60);
      b.appendChild(cv);
      b.insertAdjacentHTML('beforeend', `
        <div class="name">${car.name}</div>
        <div class="desc">${car.desc}</div>
        <div class="stat"><span>VELOC.</span><div class="bar"><i style="width:${pct(car.top * 1.0 + (car.top - 1) * 3)}%"></i></div></div>
        <div class="stat"><span>ACELER.</span><div class="bar"><i style="width:${pct(car.accel)}%"></i></div></div>
        <div class="stat"><span>MANEJO</span><div class="bar"><i style="width:${pct(car.handling)}%"></i></div></div>
        <div class="stat"><span>AGARRE</span><div class="bar"><i style="width:${pct(car.grip)}%"></i></div></div>`);
      box.appendChild(b);
    });
  },

  buildDiffs(save) {
    const box = this.el('diff-list');
    box.innerHTML = '';
    DIFFICULTIES.forEach((d, i) => {
      const locked = i === 3 && !save.legend;
      const b = document.createElement('button');
      b.className = 'opt diff-opt' + (locked ? ' locked' : '');
      b.dataset.action = 'diff';
      b.dataset.i = i;
      b.dataset.locked = locked ? '1' : '';
      b.innerHTML = `<span>${locked ? '🔒 ' : ''}${d.name}</span><small>${locked ? 'BLOQUEADA' : d.desc.toUpperCase()}</small>`;
      box.appendChild(b);
    });
    const n = Math.min(3, save.hardTracks.length);
    this.el('diff-note').textContent = save.legend
      ? '¡LEYENDA DESBLOQUEADA!'
      : `PARA DESBLOQUEAR LEYENDA: TERMINA 3 CIRCUITOS DISTINTOS EN DIFICIL (${n}/3)`;
  },

  buildTracks(tracks, save) {
    const box = this.el('track-cards');
    box.innerHTML = '';
    tracks.forEach((t, i) => {
      const b = document.createElement('button');
      b.className = 'opt card';
      b.dataset.action = 'track';
      b.dataset.i = i;
      const th = THEMES[t.theme];
      const cv = drawTrackMap(t, 120, { pad: 12, width: 4, color: '#fff' });
      const g = cv.getContext('2d');
      g.globalCompositeOperation = 'destination-over';
      const grd = g.createLinearGradient(0, 0, 0, 120);
      grd.addColorStop(0, th.sky[0]); grd.addColorStop(1, th.colors.light.grass);
      g.fillStyle = grd; g.fillRect(0, 0, 120, 120);
      b.appendChild(cv);
      const done = save.hardTracks.includes(t.id);
      b.insertAdjacentHTML('beforeend', `
        <div class="name">${t.name}</div>
        <div class="tag">${t.linear ? 'AUTOPISTA · 1 TRAMO' : 'CIRCUITO · 3 VUELTAS'}</div>
        <div class="desc">${t.desc.toUpperCase()}</div>
        <div class="badge">${done ? '★ COMPLETADO EN DIFICIL' : ''}</div>`);
      box.appendChild(b);
    });
  },

  buildResults(r, unlockMsg) {
    const pos = r.playerPos;
    this.el('res-title').textContent = pos === 1 ? '¡VICTORIA!' : pos <= 3 ? `¡PODIO! ${pos}° LUGAR` : `${pos}° LUGAR`;
    const extra = r.track.linear ? `TIEMPO ${Util.formatTime(r.time)}` : `MEJOR VUELTA ${Util.formatTime(r.bestLap)}`;
    this.el('res-unlock').textContent = unlockMsg || `${r.track.name} · ${DIFFICULTIES[r.difficulty].name} · ${extra}`;
    const rows = r.standings.map((s, i) => `
      <tr class="${s.isPlayer ? 'me' : ''}">
        <td>${i + 1}°</td>
        <td><span class="sw" style="background:${s.color}"></span> ${s.name}</td>
        <td>${s.car}</td>
        <td>${s.est ? 'EN PISTA' : Util.formatTime(s.time)}</td>
      </tr>`).join('');
    this.el('res-table').innerHTML = `<tr><th>POS</th><th>PILOTO</th><th>AUTO</th><th>TIEMPO</th></tr>${rows}`;
  },
};
