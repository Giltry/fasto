'use strict';

(() => {
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = false;

  const tracks = TRACKS.map(buildTrack);

  // ----- Progreso guardado (desbloqueo de LEYENDA) -----
  const Save = {
    key: 'fasto_save_v1',
    data: { hardTracks: [], legend: false },
    load() {
      try {
        const d = JSON.parse(localStorage.getItem(this.key));
        if (d) this.data = Object.assign(this.data, d);
      } catch (e) { /* sin almacenamiento */ }
    },
    store() {
      try { localStorage.setItem(this.key, JSON.stringify(this.data)); } catch (e) { /* sin almacenamiento */ }
    },
  };
  Save.load();

  const sel = { car: 0, diff: 0, track: 0 };
  let mode = 'menu';        // menu | race | results
  let race = null, demo = null, paused = false;
  const input = { left: false, right: false, up: false, down: false, nitro: false };
  const KEYMAP = {
    ArrowLeft: 'left', KeyA: 'left', ArrowRight: 'right', KeyD: 'right',
    ArrowUp: 'up', KeyW: 'up', ArrowDown: 'down', KeyS: 'down',
    Space: 'nitro', ShiftLeft: 'nitro', ShiftRight: 'nitro', KeyN: 'nitro',
  };
  const clearInput = () => { for (const k in input) input[k] = false; };

  function newDemo() {
    const loops = tracks.filter(t => !t.linear);
    demo = new Race({ track: loops[Math.floor(Math.random() * loops.length)], demo: true });
  }

  function startRace() {
    UI.hideAll();
    clearInput();
    demo = null;
    paused = false;
    race = new Race({
      track: tracks[sel.track], car: sel.car, difficulty: sel.diff,
      onFinish: showResults,
    });
    mode = 'race';
    Sound.startEngine();
  }

  function showResults(r) {
    mode = 'results';
    race.showHUD = false;
    let unlockMsg = '';
    if (r.difficulty === 2) {
      if (!Save.data.hardTracks.includes(r.track.id)) Save.data.hardTracks.push(r.track.id);
      if (!Save.data.legend && Save.data.hardTracks.length >= 3) {
        Save.data.legend = true;
        unlockMsg = '¡NUEVA DIFICULTAD DESBLOQUEADA: LEYENDA!';
      } else if (!Save.data.legend) {
        unlockMsg = `PROGRESO LEYENDA: ${Save.data.hardTracks.length}/3 CIRCUITOS EN DIFICIL`;
      }
      Save.store();
    }
    UI.buildResults(r, unlockMsg);
    UI.show('scr-results', 0);
  }

  function toMenu() {
    race = null;
    paused = false;
    mode = 'menu';
    newDemo();
    UI.show('scr-title', 0);
  }

  function pause() {
    if (mode !== 'race' || paused) return;
    paused = true;
    clearInput();
    UI.show('scr-pause', 0);
  }
  function resume() {
    paused = false;
    clearInput();
    UI.hideAll();
  }

  UI.buildCars();
  UI.init({
    onAction(screen, action, el) {
      const i = +el.dataset.i;
      switch (action) {
        case 'start': Sound.select(); UI.show('scr-car', sel.car); break;
        case 'controls': Sound.select(); UI.show('scr-controls', 0); break;
        case 'back': Sound.select(); UI.show('scr-title'); break;
        case 'car':
          Sound.select(); sel.car = i;
          UI.buildDiffs(Save.data);
          UI.show('scr-diff', sel.diff);
          break;
        case 'diff':
          if (el.dataset.locked) { Sound.error(); UI.shake(el); break; }
          Sound.select(); sel.diff = i;
          UI.buildTracks(tracks, Save.data);
          UI.show('scr-track', sel.track);
          break;
        case 'track': Sound.select(); sel.track = i; startRace(); break;
        case 'resume': resume(); break;
        case 'restart': startRace(); break;
        case 'quit': toMenu(); break;
        case 'retry': startRace(); break;
        case 'menu': toMenu(); break;
      }
    },
    onBack(screen) {
      switch (screen) {
        case 'scr-car': case 'scr-controls': UI.show('scr-title'); break;
        case 'scr-diff': UI.show('scr-car', sel.car); break;
        case 'scr-track': UI.show('scr-diff', sel.diff); break;
        case 'scr-pause': resume(); break;
        default: return;
      }
      Sound.move();
    },
  });

  // ----- Entrada -----
  window.addEventListener('keydown', e => {
    Sound.init();
    if (e.code === 'KeyM') { Sound.toggleMute(); return; }
    if (mode === 'race' && !paused) {
      if (e.code === 'Escape' || e.code === 'KeyP') { pause(); e.preventDefault(); return; }
      const k = KEYMAP[e.code];
      if (k) { input[k] = true; e.preventDefault(); }
      return;
    }
    if (mode === 'race' && paused && e.code === 'KeyP') { resume(); e.preventDefault(); return; }
    if (e.repeat && (e.code === 'Enter' || e.code === 'Space')) return;
    if (UI.key(e)) e.preventDefault();
  });
  window.addEventListener('keyup', e => {
    const k = KEYMAP[e.code];
    if (k) input[k] = false;
  });
  window.addEventListener('blur', () => { clearInput(); pause(); });
  window.addEventListener('pointerdown', () => Sound.init());

  // ----- Bucle principal (paso fijo de 1/60 s) -----
  let last = performance.now(), acc = 0;
  function frame(now) {
    const dt = Math.min(0.1, (now - last) / 1000);
    last = now;
    const active = race || demo;
    if (active) {
      if (!(mode === 'race' && paused)) {
        acc += dt;
        while (acc >= C.STEP) {
          active.update(C.STEP, mode === 'race' ? input : null);
          acc -= C.STEP;
        }
      }
      active.render(ctx);
    }
    if (mode === 'race' && !paused && race && race.player) Sound.updateEngine(race.player.speed / C.MAX_SPEED);
    else Sound.updateEngine(null);
    requestAnimationFrame(frame);
  }

  // Gancho de depuración: abrir index.html#debug
  if (location.hash === '#debug') {
    window.FASTO = {
      get race() { return race || demo; },
      step(n, inp) { const r = race || demo; for (let i = 0; i < n; i++) r.update(C.STEP, inp || input); r.render(ctx); },
    };
  }

  const boot = () => {
    newDemo();
    UI.show('scr-title', 0);
    requestAnimationFrame(t => { last = t; frame(t); });
  };
  if (document.fonts && document.fonts.load) {
    Promise.race([
      document.fonts.load('16px "Press Start 2P"'),
      new Promise(r => setTimeout(r, 1500)),
    ]).then(boot, boot);
  } else boot();
})();
