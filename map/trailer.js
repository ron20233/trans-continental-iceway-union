/* TCIU Trailer — ouvrir : Alt + 9 puis 8 (Alt+98) · enregistrer : bouton ⏺ ou touche R */
(function () {
  var W = 1280, H = 720, DUR = 30, LOGO = 'TCIULogo.png';
  var ICE = '#6fe7ff', ov, cv, cx, bar, btnRec, running = false, rec = null, t0 = 0, raf = 0, ac = null, adest = null, nodes = [];
  var logo = new Image(); logo.src = LOGO; var logoOK = true;
  var clamp = function (v, a, b) { return Math.max(a, Math.min(b, v)); };
  var seg = function (t, a, b) { return clamp((t - a) / (b - a), 0, 1); };
  var ease = function (p) { return 1 - Math.pow(1 - p, 3); };
  var rnd = (function () { var s = 7; return function () { s = (s * 16807) % 2147483647; return s / 2147483647; }; })();

  /* ---------- réseau stylisé (couleurs des lignes du site) ---------- */
  var COL = ['#ff3b3b', '#ff9900', '#2bff2b', '#19e6ff', '#4a86e8', '#3a3aff', '#a533ff', '#ff3dff', '#9a9a9a', '#c0502c', '#e03a3a', '#d9822b', '#e0b400', '#4cae2a', '#2a9aae', '#2f76e6'];
  var LET = ['#ea4335', '#fbbc04', '#34a853', '#ff6d01', '#46bdc6', '#b84d86'];
  var paths = [];
  function build() {
    paths = [];
    for (var i = 0; i < 16; i++) {
      var x = 90 + i * 74, p = [[x, 40]], y = 40;
      for (var k = 0; k < 3; k++) { y += 150 + rnd() * 120; x += (rnd() - .5) * 90; p.push([p[p.length - 1][0], y], [x, y]); }
      p.push([x, 690]); paths.push({ p: p, c: COL[i], d: i * .12 });
    }
    for (var j = 0; j < 6; j++) {
      var yy = 110 + j * 105, q = [[30, yy]], xx = 30;
      for (var m = 0; m < 3; m++) { xx += 280 + rnd() * 160; yy += (rnd() - .5) * 70; q.push([xx, q[q.length - 1][1]], [xx, yy]); }
      q.push([1250, yy]); paths.push({ p: q, c: LET[j], d: 1 + j * .15 });
    }
    paths.forEach(function (o) {
      o.len = 0; o.cum = [0];
      for (var i = 1; i < o.p.length; i++) { o.len += Math.hypot(o.p[i][0] - o.p[i - 1][0], o.p[i][1] - o.p[i - 1][1]); o.cum.push(o.len); }
    });
  }
  function at(o, f) {
    var d = f * o.len, i = 1; while (i < o.cum.length - 1 && o.cum[i] < d) i++;
    var s = (d - o.cum[i - 1]) / ((o.cum[i] - o.cum[i - 1]) || 1);
    return [o.p[i - 1][0] + (o.p[i][0] - o.p[i - 1][0]) * s, o.p[i - 1][1] + (o.p[i][1] - o.p[i - 1][1]) * s, i, s];
  }
  function strokePart(o, f) {
    var e = at(o, f); cx.beginPath(); cx.moveTo(o.p[0][0], o.p[0][1]);
    for (var i = 1; i < e[2]; i++) cx.lineTo(o.p[i][0], o.p[i][1]);
    cx.lineTo(e[0], e[1]); cx.stroke(); return e;
  }

  /* ---------- dessin ---------- */
  function bg(t) {
    cx.globalAlpha = 1; cx.fillStyle = '#05080f'; cx.fillRect(0, 0, W, H);
    [['#1fb6d4', .22, 0], ['#2b7a78', .2, 2], ['#3b4cca', .16, 4]].forEach(function (b, i) {
      var x = W * (.2 + .3 * i) + Math.sin(t * .3 + b[2]) * 160, y = H * (.3 + .25 * (i % 2)) + Math.cos(t * .25 + b[2]) * 100;
      var g = cx.createRadialGradient(x, y, 0, x, y, 460); g.addColorStop(0, b[0]); g.addColorStop(1, 'transparent');
      cx.globalAlpha = b[1]; cx.fillStyle = g; cx.fillRect(0, 0, W, H);
    });
    cx.globalAlpha = 1; cx.fillStyle = 'rgba(150,235,255,.5)';
    for (var i = 0; i < 70; i++) {
      var px = (i * 197 % W) + Math.sin(t + i) * 12, py = ((i * 331 % H) - t * (14 + i % 5 * 6)) % H; if (py < 0) py += H;
      cx.globalAlpha = .15 + (i % 4) * .1; cx.beginPath(); cx.arc(px, py, .8 + i % 3 * .6, 0, 7); cx.fill();
    }
    cx.globalAlpha = 1;
  }
  function logoAt(x, y, s) {
    if (logoOK && logo.complete && logo.naturalWidth) {
      cx.drawImage(logo, x - s / 2, y - s / 2, s, s);
      try { cx.getImageData(0, 0, 1, 1); } catch (e) { logoOK = false; }
    } else {
      cx.fillStyle = '#6a2330'; cx.fillRect(x - s * .4, y - s * .4, s * .8, s * .8);
      cx.fillStyle = '#ddd'; cx.font = '700 ' + s * .26 + 'px Sora,sans-serif'; cx.textAlign = 'center'; cx.textBaseline = 'middle'; cx.fillText('TCIU', x, y);
    }
  }
  function txt(s, x, y, size, w, col, a, ls) {
    cx.globalAlpha = a == null ? 1 : a; cx.fillStyle = col || '#fff'; cx.font = (w || 700) + ' ' + size + "px Sora,'Segoe UI',sans-serif";
    cx.textAlign = 'center'; cx.textBaseline = 'middle'; if (cx.letterSpacing !== undefined) cx.letterSpacing = (ls || 0) + 'px';
    cx.fillText(s, x, y); if (cx.letterSpacing !== undefined) cx.letterSpacing = '0px'; cx.globalAlpha = 1;
  }
  function pill(s, x, y, a) {
    cx.globalAlpha = a; cx.font = "600 22px Sora,sans-serif"; var w = cx.measureText(s).width + 56;
    cx.fillStyle = 'rgba(255,255,255,.08)'; cx.strokeStyle = 'rgba(111,231,255,.5)'; cx.lineWidth = 1.5;
    cx.beginPath(); cx.roundRect(x - w / 2, y - 29, w, 58, 16); cx.fill(); cx.stroke();
    txt(s, x, y + 1, 22, 600, '#fff', a); cx.globalAlpha = 1;
  }
  var GOALS = [['Pave', 'Connecting the nations of EarthMC, one iceway at a time.'], ['Map', 'Every stop, line and transfer — mapped.'], ['Farm', 'Blue ice from the Arctic and automatic farms.'], ['Maintain', 'Constant upkeep across 23 lines.']];

  function frame(t) {
    bg(t);
    /* 1 · logo */
    var a1 = 1 - seg(t, 4, 4.6);
    if (a1 > 0) {
      var p = ease(seg(t, .3, 1.8)), g = cx.createRadialGradient(W / 2, 330, 0, W / 2, 330, 300);
      g.addColorStop(0, 'rgba(111,231,255,.5)'); g.addColorStop(1, 'transparent');
      cx.globalAlpha = p * a1 * (.7 + .3 * Math.sin(t * 3)); cx.fillStyle = g; cx.fillRect(0, 0, W, H);
      cx.globalAlpha = p * a1; logoAt(W / 2, 330 + (1 - p) * 40, 230 * (.6 + .4 * p));
      cx.strokeStyle = ICE; cx.lineWidth = 3; cx.beginPath(); cx.arc(W / 2, 330, 150, t * 2, t * 2 + 2.2); cx.stroke();
      txt('TRANS-CONTINENTAL ICEWAY UNION', W / 2, 560, 28, 600, '#eaf2f8', seg(t, 2.4, 3.4) * a1, 8);
    }
    /* 2 · titre */
    var a2 = seg(t, 4.5, 5) * (1 - seg(t, 8.4, 9));
    if (a2 > 0) {
      var s1 = ease(seg(t, 4.6, 5.6)), s2 = ease(seg(t, 5, 6));
      txt('Trans-Continental', W / 2, 270 + (1 - s1) * 40, 96, 700, '#fff', s1 * a2, -2);
      txt('Iceway Union', W / 2, 375 + (1 - s2) * 40, 96, 700, ICE, s2 * a2, -2);
      var s3 = ease(seg(t, 6.4, 7.4)); txt('We run EMC’s largest organized Nether iceway.', W / 2, 500 + (1 - s3) * 20, 34, 400, '#8fa3b5', s3 * a2);
    }
    /* 3 · réseau */
    var a3 = seg(t, 9, 9.7) * (1 - seg(t, 16.6, 17.2));
    if (a3 > 0) {
      var u = t - 9, z = 1 + u * .014; cx.save(); cx.globalAlpha = a3;
      cx.translate(W / 2, H / 2); cx.scale(z, z); cx.translate(-W / 2, -H / 2);
      cx.lineWidth = 5; cx.lineCap = 'round'; cx.lineJoin = 'round';
      paths.forEach(function (o) {
        var f = ease(seg(u, o.d * .6, o.d * .6 + 2.6)); if (f <= 0) return;
        cx.strokeStyle = o.c; cx.shadowColor = o.c; cx.shadowBlur = 10; strokePart(o, f); cx.shadowBlur = 0;
        for (var k = 1; k < 7; k++) if (f > k / 7) { var q = at(o, k / 7); cx.fillStyle = '#fff'; cx.beginPath(); cx.arc(q[0], q[1], 5.5, 0, 7); cx.fill(); cx.strokeStyle = '#05080f'; cx.lineWidth = 2; cx.stroke(); cx.lineWidth = 5; }
      });
      var tr = paths[18], tf = ease(seg(u, 3.5, 7.5)); if (tf > 0 && tf < 1) {
        var e = at(tr, tf); cx.fillStyle = '#fff'; cx.shadowColor = ICE; cx.shadowBlur = 30; cx.beginPath(); cx.arc(e[0], e[1], 10, 0, 7); cx.fill(); cx.shadowBlur = 0;
      }
      cx.restore();
      txt('THE TRANS-CONTINENTAL ICEWAY', 90 + 230, 30, 20, 600, ICE, a3 * seg(u, .3, 1), 6);
      var cnt = ease(seg(u, 2, 5.5)), vals = [[324, 'Stops'], [23, 'Lines'], [160456, 'Blocks long']];
      vals.forEach(function (v, i) { pill(Math.round(v[0] * cnt).toLocaleString('en-US') + '  ' + v[1], W / 2 + (i - 1) * 330, 668, a3 * seg(u, 1.5 + i * .3, 2.3 + i * .3)); });
    }
    /* 4 · objectifs */
    if (t > 17 && t < 24.2) {
      var i = clamp(Math.floor((t - 17.2) / 1.75), 0, 3), lt = (t - 17.2) - i * 1.75, ai = seg(lt, 0, .35) * (1 - seg(lt, 1.4, 1.75)) * (1 - seg(t, 23.6, 24.2));
      var sl = ease(seg(lt, 0, .5));
      txt('0' + (i + 1), W / 2, 220, 34, 600, ICE, ai, 6);
      txt(GOALS[i][0], W / 2 + (1 - sl) * 60, 340, 150, 700, '#fff', ai, -4);
      txt(GOALS[i][1], W / 2, 470, 32, 400, '#8fa3b5', ai * seg(lt, .2, .6));
      for (var d = 0; d < 4; d++) { cx.globalAlpha = (1 - seg(t, 23.6, 24.2)) * (d === i ? 1 : .25); cx.fillStyle = ICE; cx.fillRect(W / 2 - 60 + d * 32, 600, 20, 4); }
      cx.globalAlpha = 1;
    }
    /* 5 · appel */
    var a5 = seg(t, 24.2, 25) * (1 - seg(t, 29.3, 30));
    if (a5 > 0) {
      var c = ease(seg(t, 24.4, 25.4)); cx.globalAlpha = a5; logoAt(W / 2, 150, 120 * (.8 + .2 * c)); cx.globalAlpha = 1;
      txt('Join the Union', W / 2, 310 + (1 - c) * 30, 110, 700, '#fff', a5 * c, -3);
      txt('tciu.info', W / 2, 410, 48, 600, ICE, a5 * seg(t, 25.6, 26.4), 2);
      pill('Access the Map', W / 2 - 170, 540, a5 * seg(t, 26.2, 27)); pill('Join our Discord', W / 2 + 170, 540, a5 * seg(t, 26.6, 27.4));
    }
  }

  /* ---------- audio (synthé, enregistré avec la vidéo) ---------- */
  function audio() {
    try {
      ac = ac || new (window.AudioContext || window.webkitAudioContext)(); adest = adest || ac.createMediaStreamDestination();
      if (ac.state === 'suspended') ac.resume();
      var n = ac.currentTime + .05, m = ac.createGain(); m.gain.setValueAtTime(0, n); m.gain.linearRampToValueAtTime(.5, n + 2); m.gain.setValueAtTime(.5, n + DUR - 2); m.gain.linearRampToValueAtTime(0, n + DUR);
      m.connect(ac.destination); m.connect(adest);
      var f = ac.createBiquadFilter(); f.type = 'lowpass'; f.frequency.setValueAtTime(300, n); f.frequency.linearRampToValueAtTime(1800, n + 17); f.frequency.linearRampToValueAtTime(500, n + DUR); f.connect(m);
      [55, 82.4, 110.2, 164.6].forEach(function (hz, i) {
        var o = ac.createOscillator(), g = ac.createGain(); o.type = i % 2 ? 'sawtooth' : 'triangle'; o.frequency.value = hz; g.gain.value = .09; o.connect(g); g.connect(f); o.start(n); o.stop(n + DUR);
      });
      [.4, 4.5, 9, 17.2, 24.2].forEach(function (s) { hit(n + s, 70, .7, 1.2); });
      [1.8, 5.6, 9.7, 17.9, 19.6, 21.3, 23, 25.4, 26.4].forEach(function (s, i) { hit(n + s, 880 * (1 + (i % 3) * .25), .12, .6); });
    } catch (e) {}
  }
  function hit(when, hz, vol, len) {
    var o = ac.createOscillator(), g = ac.createGain(); o.type = 'sine'; o.frequency.setValueAtTime(hz * 2, when); o.frequency.exponentialRampToValueAtTime(hz, when + .25);
    g.gain.setValueAtTime(vol, when); g.gain.exponentialRampToValueAtTime(.001, when + len); o.connect(g); g.connect(ac.destination); g.connect(adest); o.start(when); o.stop(when + len);
  }

  /* ---------- lecture / enregistrement ---------- */
  function loop(now) {
    var t = (now - t0) / 1000; frame(Math.min(t, DUR));
    if (t < DUR) raf = requestAnimationFrame(loop); else finish();
  }
  function play(record) {
    cancelAnimationFrame(raf); stopRec(true); build_once(); running = true; audio();
    if (record) {
      try {
        var st = cv.captureStream(60); if (adest) adest.stream.getAudioTracks().forEach(function (tk) { st.addTrack(tk); });
        var mt = ['video/webm;codecs=vp9,opus', 'video/webm;codecs=vp8,opus', 'video/webm'].filter(function (x) { return window.MediaRecorder && MediaRecorder.isTypeSupported(x); })[0];
        var ch = []; rec = new MediaRecorder(st, { mimeType: mt, videoBitsPerSecond: 8e6 });
        rec.ondataavailable = function (e) { if (e.data.size) ch.push(e.data); };
        rec.onstop = function () { if (!ch.length || rec && rec.cancel) return; var a = document.createElement('a'); a.href = URL.createObjectURL(new Blob(ch, { type: 'video/webm' })); a.download = 'TCIU-trailer.webm'; a.click(); setTimeout(function () { URL.revokeObjectURL(a.href); }, 5000); };
        rec.start(250); btnRec.textContent = '● Recording…'; btnRec.classList.add('on');
      } catch (e) { rec = null; alert('Recording is not supported by this browser (try Chrome, Edge or Firefox).'); }
    }
    t0 = performance.now() + 100; raf = requestAnimationFrame(loop);
  }
  function stopRec(cancel) { if (rec) { rec.cancel = !!cancel; try { rec.state !== 'inactive' && rec.stop(); } catch (e) {} rec = null; } if (btnRec) { btnRec.textContent = '⏺ Record'; btnRec.classList.remove('on'); } }
  function finish() { running = false; setTimeout(function () { stopRec(false); }, 300); }
  var built = false; function build_once() { if (!built) { build(); built = true; } }

  /* ---------- interface ---------- */
  function ui() {
    var st = document.createElement('style');
    st.textContent = '#tciu-tr{position:fixed;inset:0;z-index:99999;background:#000;display:none;flex-direction:column;align-items:center;justify-content:center;font-family:Sora,system-ui,sans-serif}' +
      '#tciu-tr.on{display:flex}#tciu-tr canvas{max-width:100vw;max-height:calc(100vh - 80px);aspect-ratio:16/9;width:auto;height:auto;box-shadow:0 0 80px rgba(111,231,255,.15)}' +
      '#tciu-tr .b{display:flex;gap:10px;align-items:center;margin-top:16px;color:#8fa3b5;font-size:13px;flex-wrap:wrap;justify-content:center}' +
      '#tciu-tr button{font:600 13px Sora,system-ui,sans-serif;color:#eaf2f8;background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.15);border-radius:10px;padding:9px 16px;cursor:pointer}' +
      '#tciu-tr button:hover{background:rgba(255,255,255,.15)}#tciu-tr button.on{background:#c0392b;border-color:#c0392b}';
    document.head.appendChild(st);
    ov = document.createElement('div'); ov.id = 'tciu-tr'; ov.setAttribute('role', 'dialog'); ov.setAttribute('aria-label', 'TCIU trailer');
    cv = document.createElement('canvas'); cv.width = W; cv.height = H; cx = cv.getContext('2d');
    bar = document.createElement('div'); bar.className = 'b';
    bar.innerHTML = '<button data-a="replay">⟲ Replay</button><button data-a="rec">⏺ Record</button><button data-a="close">✕ Close</button><span>Alt + 98 · R to record · Esc to close</span>';
    btnRec = bar.children[1];
    bar.onclick = function (e) { var a = e.target.dataset && e.target.dataset.a; if (a === 'replay') play(false); else if (a === 'rec') play(true); else if (a === 'close') close(); };
    ov.appendChild(cv); ov.appendChild(bar); document.body.appendChild(ov);
  }
  function open() { if (!ov) ui(); ov.classList.add('on'); play(false); }
  function close() { cancelAnimationFrame(raf); stopRec(true); running = false; if (ac) ac.suspend(); if (ov) ov.classList.remove('on'); }
  function toggle() { if (ov && ov.classList.contains('on')) close(); else open(); }

  var a9 = 0;
  addEventListener('keydown', function (e) {
    var c = e.code;
    if (c === 'Digit9' || c === 'Numpad9') { if (e.altKey) { a9 = Date.now(); e.preventDefault(); } }
    else if ((c === 'Digit8' || c === 'Numpad8') && Date.now() - a9 < 1500) { a9 = 0; e.preventDefault(); toggle(); }
    else if (ov && ov.classList.contains('on')) {
      if (e.key === 'Escape') { e.stopPropagation(); close(); }
      else if (e.key.toLowerCase() === 'r' && !e.ctrlKey && !e.metaKey) play(true);
    }
  }, true);
  window.TCIUTrailer = { open: open, close: close };
})();
