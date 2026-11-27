(() => {
  'use strict';

  /* ==================== 1. FULLSCREEN BRUSH TRAIL + CONFETTI + LIGHTBOX + TILT ==================== */
  const trailCanvas = document.getElementById('cursor-trail-canvas');
  const tctx = trailCanvas.getContext('2d');
  let W = 0, H = 0, trailEnabled = true;
  const trailPts = [], confetti = [];
  const POP_COLS = ['#DCFF00', '#FF1F7A', '#00D1FF', '#3BFFA8', '#FF3B1D', '#1428FF', '#FFFDF7'];
  const ART_COLS = ['#FFE57F', '#FF6B9D', '#70F8BA', '#5CE1FF', '#FFB5A7', '#FFFDF7', '#E6B8FF'];

  function resizeTrailCanvas() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = window.innerWidth; H = window.innerHeight;
    trailCanvas.width = W * dpr; trailCanvas.height = H * dpr;
    tctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  window.addEventListener('resize', resizeTrailCanvas);
  resizeTrailCanvas();

  function spawnConfettiBurst(x, y, count = 48, tint = null, spreadSpeed = 12, baseAngle = -Math.PI / 2, cone = Math.PI * 2, includeRibbons = true) {
    // Graceful dual translucent pigment rings instead of harsh opaque lines
    confetti.push({ kind: 'bloom', x, y, r: 8, maxR: 135 + Math.random() * 80, col: tint || '#FFE57F', life: 1.0 });
    for (let i = 0; i < count; i++) {
      const ang = baseAngle + (Math.random() - 0.5) * cone;
      const spd = (0.28 + Math.random() * 0.92) * spreadSpeed;
      const roll = Math.random();
      const kind = includeRibbons && roll < 0.14 ? 'silk' : (roll < 0.42 ? 'stardust' : (roll < 0.68 ? 'goldLeaf' : 'petal'));
      const col = tint && i % 4 === 0 ? tint : ART_COLS[i % ART_COLS.length];
      const segs = kind === 'silk' ? Array.from({ length: 14 }, () => ({ x, y })) : null;
      confetti.push({
        kind, x, y,
        vx: Math.cos(ang) * spd + (Math.random() - 0.5) * 1.4,
        vy: Math.sin(ang) * spd - (cone > Math.PI ? 2.4 : 0.8),
        g: kind === 'stardust' ? 0.08 : (kind === 'silk' ? 0.15 : 0.13 + Math.random() * 0.06),
        drag: kind === 'stardust' ? 0.955 : (kind === 'silk' ? 0.962 : 0.972),
        maxVy: kind === 'stardust' ? 1.8 : 3.4,
        size: kind === 'stardust' ? 2.5 + Math.random() * 4.5 : (kind === 'goldLeaf' ? 6 + Math.random() * 6 : 8 + Math.random() * 7),
        rot: Math.random() * Math.PI * 2,
        vrot: (Math.random() - 0.5) * 0.12,
        phase: Math.random() * Math.PI * 2,
        vphase: 0.05 + Math.random() * 0.08,
        drift: 0.35 + Math.random() * 0.9,
        col, colAlt: ART_COLS[(i + 3) % ART_COLS.length],
        life: 1.0, segs
      });
    }
  }

  function fireScreenCelebration() {
    // Stage 1: graceful arching bottom silk fountains crossing toward upper center
    spawnConfettiBurst(W * 0.14, H * 0.92, 68, '#FFE57F', 21, -Math.PI * 0.36, 0.56, true);
    spawnConfettiBurst(W * 0.86, H * 0.92, 68, '#FF6B9D', 21, -Math.PI * 0.64, 0.56, true);
    // Stage 2: floating blossom & gold-leaf eddies
    setTimeout(() => spawnConfettiBurst(W * 0.32, H * 0.34, 62, '#5CE1FF', 11.5, -Math.PI / 2, Math.PI * 2, true), 200);
    setTimeout(() => spawnConfettiBurst(W * 0.68, H * 0.28, 62, '#70F8BA', 11.5, -Math.PI / 2, Math.PI * 2, true), 380);
    // Stage 3: drifting zenith mist of petals & star bokeh
    setTimeout(() => spawnConfettiBurst(W * 0.50, H * 0.16, 75, '#FFFDF7', 12.5, Math.PI * 0.5, Math.PI * 1.15, true), 560);
  }

  window.addEventListener('pointermove', (e) => {
    if (!trailEnabled) return;
    trailPts.push({ x: e.clientX, y: e.clientY, life: 1, col: POP_COLS[(trailPts.length >> 2) % 4] });
    if (trailPts.length > 24) trailPts.shift();
  });

  (function loopTrail() {
    tctx.clearRect(0, 0, W, H);
    if (trailEnabled && trailPts.length > 1) {
      for (let i = 1; i < trailPts.length; i++) {
        const p0 = trailPts[i - 1], p1 = trailPts[i];
        p0.life -= 0.048;
        if (p0.life <= 0) continue;
        tctx.strokeStyle = p1.col; tctx.globalAlpha = Math.max(0, p0.life * 0.52);
        tctx.lineWidth = p0.life * 9.5; tctx.lineCap = 'round';
        tctx.beginPath(); tctx.moveTo(p0.x, p0.y); tctx.lineTo(p1.x, p1.y); tctx.stroke();
      }
      while (trailPts.length && trailPts[0].life <= 0) trailPts.shift();
    }

    for (let i = confetti.length - 1; i >= 0; i--) {
      const c = confetti[i];
      if (c.kind === 'bloom') {
        c.r += (c.maxR - c.r) * 0.14; c.life -= 0.032;
        if (c.life <= 0) { confetti.splice(i, 1); continue; }
        tctx.save();
        const grd = tctx.createRadialGradient(c.x, c.y, c.r * 0.1, c.x, c.y, c.r);
        grd.addColorStop(0, 'rgba(255,253,247,0)');
        grd.addColorStop(0.7, c.col);
        grd.addColorStop(1, 'rgba(255,253,247,0)');
        tctx.globalAlpha = Math.max(0, c.life * 0.34);
        tctx.fillStyle = grd; tctx.beginPath(); tctx.arc(c.x, c.y, c.r, 0, Math.PI * 2); tctx.fill();
        tctx.restore();
        continue;
      }

      c.phase += c.vphase;
      c.vx = c.vx * c.drag + Math.sin(c.phase) * 0.14 * c.drift;
      c.vy = Math.min(c.maxVy, c.vy * c.drag + c.g);
      c.x += c.vx + Math.cos(c.phase * 0.8) * 0.32 * c.drift;
      c.y += c.vy;
      c.rot += c.vrot;
      c.life -= c.y > H * 0.88 ? 0.022 : 0.0068;
      if (c.segs) {
        c.segs.unshift({ x: c.x + Math.sin(c.phase * 1.4) * 2.2, y: c.y });
        c.segs.pop();
      }
      if (c.life <= 0 || c.y > H + 80) { confetti.splice(i, 1); continue; }

      tctx.save();
      const alpha = Math.min(0.95, c.life * 1.35);
      if (c.kind === 'silk') {
        // Soft satin halo + smooth quadratic spline silk ribbon (no hard black outlines!)
        tctx.lineCap = 'round'; tctx.lineJoin = 'round';
        tctx.beginPath();
        tctx.moveTo(c.segs[0].x, c.segs[0].y);
        for (let s = 1; s < c.segs.length - 1; s++) {
          const mx = (c.segs[s].x + c.segs[s + 1].x) * 0.5, my = (c.segs[s].y + c.segs[s + 1].y) * 0.5;
          tctx.quadraticCurveTo(c.segs[s].x, c.segs[s].y, mx, my);
        }
        tctx.globalAlpha = alpha * 0.32; tctx.strokeStyle = c.col; tctx.lineWidth = 7.5; tctx.stroke();
        tctx.globalAlpha = alpha * 0.92; tctx.strokeStyle = c.col; tctx.lineWidth = 3.2; tctx.stroke();
        tctx.globalAlpha = alpha * 0.7; tctx.strokeStyle = '#FFFDF7'; tctx.lineWidth = 1.0; tctx.stroke();
      } else if (c.kind === 'stardust') {
        // Luminous soft bokeh orb + slender 4-point star glint
        tctx.globalAlpha = alpha * (0.65 + 0.35 * Math.sin(c.phase * 2));
        tctx.fillStyle = c.col;
        tctx.shadowColor = c.col; tctx.shadowBlur = 10;
        tctx.beginPath(); tctx.arc(c.x, c.y, c.size * 0.45, 0, Math.PI * 2); tctx.fill();
        if (c.size > 4.2) {
          tctx.translate(c.x, c.y); tctx.rotate(c.rot);
          tctx.fillStyle = '#FFFDF7';
          const sp = c.size * 1.35;
          tctx.beginPath();
          tctx.moveTo(0, -sp); tctx.lineTo(sp * 0.14, -sp * 0.14); tctx.lineTo(sp, 0); tctx.lineTo(sp * 0.14, sp * 0.14);
          tctx.lineTo(0, sp); tctx.lineTo(-sp * 0.14, sp * 0.14); tctx.lineTo(-sp, 0); tctx.lineTo(-sp * 0.14, -sp * 0.14);
          tctx.closePath(); tctx.fill();
        }
      } else if (c.kind === 'goldLeaf') {
        // Iridescent champagne metallic flake tumbling cleanly in 3D
        const flip = Math.cos(c.phase * 1.3);
        tctx.globalAlpha = alpha * (0.75 + 0.25 * Math.abs(flip));
        tctx.translate(c.x, c.y); tctx.rotate(c.rot); tctx.scale(Math.max(0.18, Math.abs(flip)), 1);
        const s = c.size;
        tctx.fillStyle = Math.abs(flip) < 0.26 ? '#FFFDF7' : (flip > 0 ? '#FFE57F' : c.colAlt);
        tctx.beginPath();
        tctx.moveTo(-s * 0.55, -s * 0.35); tctx.lineTo(s * 0.48, -s * 0.5);
        tctx.lineTo(s * 0.6, s * 0.42); tctx.lineTo(-s * 0.42, s * 0.52); tctx.closePath();
        tctx.fill();
      } else {
        // Organic curved blossom petal tumbling gently through air
        const pitch = Math.cos(c.phase * 1.15);
        tctx.globalAlpha = alpha * 0.94;
        tctx.translate(c.x, c.y); tctx.rotate(c.rot); tctx.scale(Math.max(0.24, Math.abs(pitch)), 1);
        const r = c.size;
        const grad = tctx.createLinearGradient(0, -r, 0, r);
        grad.addColorStop(0, pitch > 0 ? c.col : c.colAlt);
        grad.addColorStop(1, '#FFFDF7');
        tctx.fillStyle = grad;
        tctx.shadowColor = 'rgba(0,0,0,0.16)'; tctx.shadowBlur = 4;
        tctx.beginPath();
        tctx.moveTo(0, -r);
        tctx.bezierCurveTo(r * 0.92, -r * 0.35, r * 0.85, r * 0.72, 0, r);
        tctx.bezierCurveTo(-r * 0.85, r * 0.72, -r * 0.92, -r * 0.35, 0, -r);
        tctx.fill();
      }
      tctx.restore();
    }
    requestAnimationFrame(loopTrail);
  })();

  document.getElementById('toggle-trail-btn').addEventListener('click', (e) => {
    trailEnabled = !trailEnabled;
    e.currentTarget.textContent = trailEnabled ? '✒️ 墨迹跟随：开' : '✒️ 墨迹跟随：关';
    e.currentTarget.classList.toggle('is-on', trailEnabled);
  });
  document.getElementById('global-confetti-btn').addEventListener('click', fireScreenCelebration);
  document.querySelectorAll('.pop-stamp-trigger').forEach((btn) => {
    const baseRot = btn.classList.contains('brush-finale-sub') ? 3 : (btn.classList.contains('brush-finale-main') ? -6 : (btn.classList.contains('brush-tilt-l') ? -12 : -10));
    btn.addEventListener('pointerenter', () => {
      const r = btn.getBoundingClientRect();
      spawnConfettiBurst(r.left + r.width * 0.5, r.top + r.height * 0.5, 16, btn.dataset.splash || '#FFE57F', 6.5, -Math.PI / 2, Math.PI * 2, false);
    });
    btn.addEventListener('pointermove', (e) => {
      const r = btn.getBoundingClientRect();
      const nx = ((e.clientX - r.left) / r.width - 0.5) * 14;
      const ny = ((e.clientY - r.top) / r.height - 0.5) * 10;
      btn.style.transform = `translate(${nx.toFixed(1)}px, ${ny.toFixed(1)}px) scale(1.18) rotate(${baseRot - 3}deg)`;
    });
    btn.addEventListener('pointerleave', () => {
      btn.style.transform = '';
    });
    btn.addEventListener('click', () => {
      const r = btn.getBoundingClientRect();
      spawnConfettiBurst(r.left + r.width / 2, r.top + r.height / 2, 34, btn.dataset.splash || '#FFE57F', 10.5, -Math.PI / 2, Math.PI * 2, true);
      btn.classList.remove('is-stamped'); void btn.offsetWidth; btn.classList.add('is-stamped');
    });
  });

  // Lightbox
  const lb = document.getElementById('pop-lightbox');
  const lbImg = document.getElementById('lightbox-img');
  const lbTitle = document.getElementById('lightbox-title');
  const lbDesc = document.getElementById('lightbox-desc');
  function openLightbox(src, title, desc) {
    lbImg.src = src; lbTitle.textContent = title || '高清实机画面'; lbDesc.textContent = desc || '';
    lb.classList.add('is-open'); lb.setAttribute('aria-hidden', 'false');
  }
  function closeLightbox() { lb.classList.remove('is-open'); lb.setAttribute('aria-hidden', 'true'); }
  document.getElementById('lightbox-close').addEventListener('click', closeLightbox);
  lb.addEventListener('click', (e) => { if (e.target === lb) closeLightbox(); });
  window.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeLightbox(); });
  document.querySelectorAll('[data-lightbox]').forEach((el) => {
    el.addEventListener('click', (e) => {
      e.stopPropagation();
      openLightbox(el.dataset.lightbox, el.dataset.title, el.dataset.desc);
    });
  });

  // Hover 3D Tilt Cards
  document.querySelectorAll('[data-tilt-card]').forEach((card) => {
    card.addEventListener('pointermove', (e) => {
      const r = card.getBoundingClientRect();
      const nx = ((e.clientX - r.left) / r.width - 0.5) * 2;
      const ny = ((e.clientY - r.top) / r.height - 0.5) * 2;
      card.style.transform = `perspective(900px) rotateY(${(nx * 4.5).toFixed(2)}deg) rotateX(${(-ny * 4.5).toFixed(2)}deg) translateY(-3px)`;
    });
    card.addEventListener('pointerleave', () => { card.style.transform = ''; });
  });

  /* ==================== 2. GSAP SCROLL PROGRESS & CHOREOGRAPHY ==================== */
  const progressBar = document.getElementById('scroll-progress-bar');
  window.addEventListener('scroll', () => {
    const d = document.documentElement;
    progressBar.style.width = `${((d.scrollTop / Math.max(1, d.scrollHeight - d.clientHeight)) * 100).toFixed(1)}%`;
  }, { passive: true });

  if (window.gsap && window.ScrollTrigger) {
    gsap.registerPlugin(ScrollTrigger);
    document.querySelectorAll('.pop-reveal').forEach((el) => {
      gsap.fromTo(el, { y: 24, scale: 0.985 }, { y: 0, scale: 1, duration: 0.58, ease: 'back.out(1.25)', scrollTrigger: { trigger: el, start: 'top 92%', once: true } });
    });
    // Staggered card grids
    ['.dye-cards-stack', '.study-stairs-grid', '.three-trials-grid', '.pricing-shelf', '.parity-row'].forEach((sel) => {
      const parent = document.querySelector(sel);
      if (!parent) return;
      gsap.fromTo(parent.children, { y: 24, scale: 0.96 }, {
        y: 0, scale: 1, duration: 0.52, stagger: 0.075, ease: 'back.out(1.3)',
        scrollTrigger: { trigger: parent, start: 'top 88%', once: true }
      });
    });
    // Scroll-linked subtle parallax on decorative gears & rings
    document.querySelectorAll('.kinetic-seal-spin, .float-geo, .geo-seal-chop').forEach((el, idx) => {
      gsap.to(el, {
        y: idx % 2 === 0 ? -36 : 32,
        rotation: idx % 2 === 0 ? 18 : -18,
        ease: 'none',
        scrollTrigger: { trigger: el.closest('section') || el, start: 'top bottom', end: 'bottom top', scrub: 1.1 }
      });
    });
    const zkEl = document.getElementById('zero-kb-counter');
    if (zkEl) {
      ScrollTrigger.create({
        trigger: zkEl, start: 'top 90%', once: true,
        onEnter: () => {
          const obj = { v: 256 };
          gsap.to(obj, { v: 0, duration: 0.52, ease: 'power3.out', onUpdate: () => { zkEl.textContent = `${Math.round(obj.v)} KB`; }, onComplete: () => { zkEl.textContent = '0 KB'; } });
        }
      });
    }
  }

  // Active header nav tracking across sections
  const navLinks = [...document.querySelectorAll('.header-nav a[href^="#"]')];
  const trackedSections = navLinks.map((a) => document.querySelector(a.getAttribute('href'))).filter(Boolean);
  if (trackedSections.length) {
    const navObs = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (!en.isIntersecting) return;
        const id = `#${en.target.id}`;
        navLinks.forEach((a) => a.classList.toggle('is-current', a.getAttribute('href') === id));
      });
    }, { threshold: 0.28, rootMargin: '-12% 0px -48% 0px' });
    trackedSections.forEach((s) => navObs.observe(s));
  }

  /* ==================== SHARED: AUTHENTIC BOOKCOVERPAINTER GENERATOR ==================== */
  // Faithfully draws X notes real notebook covers (lib/ui/book_cover.dart) onto Canvas
  function drawRealXNotesCoverCanvas(c, Wc, Hc, cfg) {
    c.fillStyle = cfg.bg;
    c.fillRect(0, 0, Wc, Hc);

    // Subtle paper grain
    c.fillStyle = 'rgba(255,255,255,0.035)';
    for (let i = 0; i < 420; i++) {
      c.fillRect(((i * 97) % Wc), ((i * 61) % Hc), 1.4, 1.4);
    }

    // CoverArtPainter geometric themes matching style 0 / 1 / 2 / 3
    c.save();
    if (cfg.style === 0) {
      c.strokeStyle = 'rgba(255,255,255,0.26)'; c.lineWidth = Math.max(1, Wc * 0.003);
      for (let i = 0; i < 9; i++) {
        c.beginPath(); c.moveTo(Wc * 0.28, Hc * 0.85);
        c.bezierCurveTo(Wc * (-0.1 + i * 0.04), Hc * (0.63 - i * 0.012), Wc * (1.3 - i * 0.09), Hc * (0.58 - i * 0.028), Wc * 0.72, Hc * 0.33);
        c.stroke();
      }
      c.fillStyle = 'rgba(255,255,255,0.10)';
      c.beginPath(); c.arc(Wc * 0.76, Hc * 0.63, Wc * 0.11, 0, Math.PI * 2); c.fill();
    } else if (cfg.style === 1) {
      c.fillStyle = '#D9B79A';
      c.beginPath(); c.arc(Wc * 0.54, Hc * 0.61, Wc * 0.28, 0, Math.PI * 2); c.fill();
      c.strokeStyle = 'rgba(255,255,255,0.34)'; c.lineWidth = 1.2;
      c.save(); c.beginPath(); c.rect(0, Hc * 0.63, Wc, Hc); c.clip();
      for (let i = 0; i < 7; i++) {
        c.beginPath(); c.ellipse(Wc * 0.44, Hc * (0.80 + i * 0.035), Wc * 0.82, Hc * 0.16, 0, 0, Math.PI * 2); c.stroke();
      }
      c.restore();
    } else if (cfg.style === 2) {
      c.strokeStyle = 'rgba(255,255,255,0.18)'; c.lineWidth = 1;
      for (let i = 0; i < 16; i++) { const x = Wc * 0.18 + i * Wc * 0.038; c.beginPath(); c.moveTo(x, Hc * 0.48); c.lineTo(x, Hc * 0.78); c.stroke(); }
      for (let i = 0; i < 11; i++) { const y = Hc * 0.48 + i * Hc * 0.028; c.beginPath(); c.moveTo(Wc * 0.18, y); c.lineTo(Wc * 0.79, y); c.stroke(); }
      c.strokeStyle = 'rgba(255,255,255,0.55)'; c.lineWidth = Math.max(1.5, Wc * 0.004);
      c.beginPath(); c.arc(Wc * 0.48, Hc * 0.63, Wc * 0.16, 0, Math.PI * 2); c.stroke();
    } else {
      c.strokeStyle = 'rgba(255,255,255,0.40)'; c.lineWidth = Math.max(1.2, Wc * 0.003);
      for (let i = 0; i < 6; i++) {
        c.beginPath(); c.ellipse(Wc * 0.53, Hc * 0.60, Wc * (0.11 + i * 0.05), Hc * (0.06 + i * 0.03), 0, 0, Math.PI * 2); c.stroke();
      }
    }
    c.restore();

    // Left spine binding & cloth texture
    const spW = Wc * 0.082;
    c.fillStyle = cfg.spine || 'rgba(0,0,0,0.22)';
    c.fillRect(0, 0, spW, Hc);
    const spG = c.createLinearGradient(0, 0, spW, 0);
    spG.addColorStop(0, 'rgba(0,0,0,0.28)'); spG.addColorStop(0.3, 'rgba(255,255,255,0.12)'); spG.addColorStop(1, 'rgba(0,0,0,0.22)');
    c.fillStyle = spG; c.fillRect(0, 0, spW, Hc);
    c.strokeStyle = 'rgba(255,255,255,0.16)'; c.lineWidth = 1.5;
    c.beginPath(); c.moveTo(spW, 0); c.lineTo(spW, Hc); c.stroke();

    // Typography matching BookCover
    c.fillStyle = cfg.ink || '#FFFDF7';
    c.font = `700 ${Math.round(Wc * 0.12)}px NSans, sans-serif`;
    c.fillText(cfg.title, Wc * 0.17, Hc * 0.25);
    c.globalAlpha = 0.72;
    c.font = `600 ${Math.round(Wc * 0.036)}px NSans, sans-serif`;
    c.fillText(cfg.sub, Wc * 0.17, Hc * 0.31);
    c.globalAlpha = 0.75;
    c.font = `400 ${Math.round(Wc * 0.065)}px NSans, sans-serif`;
    c.fillText('X', Wc * 0.12, Hc * 0.91);
    c.globalAlpha = 0.5;
    c.font = `600 ${Math.round(Wc * 0.032)}px NSans, sans-serif`;
    c.textAlign = 'right'; c.fillText('NOTES  /  01', Wc * 0.91, Hc * 0.91);
    c.textAlign = 'left'; c.globalAlpha = 1;
  }

  /* ==================== 3. HERO THREE.JS 32x10 NATURAL READING POSE (8 SPREADS) ==================== */
  (function initHero3DBook() {
    if (!window.THREE) return;
    const canvas = document.getElementById('hero-book-webgl');
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(34, 1.45, 0.1, 40);
    // Natural straight-ahead slightly raised desk reading eye-line (ZERO downward nose-dive!)
    camera.position.set(0, 0.48, 6.2);
    camera.lookAt(0, 0.0, 0);

    scene.add(new THREE.AmbientLight(0xffffff, 0.88));
    const dirLight = new THREE.DirectionalLight(0xfffdf2, 0.58);
    dirLight.position.set(-2.0, 3.8, 4.5);
    scene.add(dirLight);

    const BOOK_SPREADS = [
      { tag: 'SPREAD 01 // 真实纸墨手感', lTitle: '人生若只如初见', lSub: '遇事不决 · 可问春风 · 四款 OFL 书法字库', style: 0, coverCol: '#5D7066', rTitle: 'X notes · 质感笔盒', rBullets: ['• 8 大物理压感笔刷 v2（针管/钢笔/铅笔/蜡笔/荧光/毛笔/水彩/油画）', '• 大笔夹可左/右/底三侧停靠，一键折叠入底栏', '• 64 组常用颜色与粗细快捷预设'], rBadge: '32×10 曲页物理翻动引擎' },
      { tag: 'SPREAD 02 // 三色开本着墨实录', lTitle: '素白封皮 · 三重觉醒', lSub: '高斯颜料晕染 / 22 颗 3D 水滴 / 晶格闪点', style: 1, coverCol: '#AE765E', rTitle: 'infinite_book_entry.frag', rBullets: ['• 22 颗 3D 玻璃水珠物理斯涅尔折射 + 湿润晕圈', '• 142 格晶格闪点波前高速扫亮黑白线稿封面', '• 8 枚多核椭圆水彩依次扩散融合全彩'], rBadge: '零加载转圈 · 点开即染色' },
      { tag: 'SPREAD 03 // 莫兰迪四维书架', lTitle: '四套性格迥异陈列', lSub: '经典立体 / 液态玻璃 / 星轨轮盘 / ∞莫比乌斯', style: 2, coverCol: '#536B83', rTitle: 'Android 全量空间预览', rBullets: ['• 经典立体：真实莫兰迪布纹书脊 × 55%–115% 无级缩', '• 3D 星轨轮盘：单手弧线拨动，建本滑入中心', '• ∞ 24 页太空总览：沿双纽线切线飞驰漫游'], rBadge: '双击空白处秒回宏观全景' },
      { tag: 'SPREAD 04 // 360° 独立出版', lTitle: '封面 · 书脊 · 封底全通', lSub: '3.4.3 新增样书翻开即时内页预览', style: 3, coverCol: '#3B4968', rTitle: '内页底纹与个人字体', rBullets: ['• 空白 / 横线 / 方格 / 点阵四重奏双滑杆实调', '• 纹理深浅与网格密度全本立竿见影预览', '• 导入 TTF / OTF (≤32 MB) 仅留本机不外传'], rBadge: '手拖竖排书脊文字精准居中' },
      { tag: 'SPREAD 05 // 画布黑科技', lTitle: '直 · 净 · 弹!', lSub: '停半秒成形 / Android 仅擦荧光 / 弹簧待办', style: 0, coverCol: '#695C78', rTitle: '不伤正文与黑墨笔迹', rBullets: ['• 一笔成形：手抖直线/箭头/三角/圆停顿自动吸附', '• Android 仅擦荧光：二刷改重点只清退高光层', '• 花边纸胶带可自由拖拽角度，短待办照样好拖'], rBadge: '不靠复杂说明书 · 全靠肌肉直觉' },
      { tag: 'SPREAD 06 // 外文研学四阶', lTitle: 'Paper 到可搜新讲义', lSub: '原比例不裁切 · 并排批注抽屉', style: 1, coverCol: '#7D6853', rTitle: '主动回忆遮挡 + 汇编', rBullets: ['• 完整保留横版 PPT / PDF 原尺寸与可选文字层', '• 绿色遮挡块点击揭晓，三态标记掌握进度', '• 本地排版导出带页码的可检索复习 PDF'], rBadge: '告别截图拼接模糊不清' },
      { tag: 'SPREAD 07 // 0 KB 上云防线', lTitle: '切断 Wi-Fi 算力全开', lSub: 'Android 随包 OCR · Apple Vision 本机', style: 2, coverCol: '#3D575A', rTitle: 'Vapor 高频词 & 双校防丢', rBullets: ['• 云端自动识别默认关闭，绝不自动上传笔记', '• Android Vapor Type：离线统计前 60 核心词', '• 备份严格校验 ZIP CRC-32 与 SHA-256 哈希'], rBadge: '两设备离线许可 · 到期永久可读' },
      { tag: 'SPREAD 08 // 二十七重水墨江湖', lTitle: '平地起白虹', lSub: '鎏金瘦金体诗图 × 兰亭意韵', style: 3, coverCol: '#2B303A', rTitle: '全渠道 27 景完整守候', rBullets: ['• 随陀螺仪微偏的 Aurora / Ink / Papercut / Chrome', '• 白衣少年、墨影红眸、铁甲策马等 27 景字图随包', '• 原字体软件不随包，Gitee latest-gitee.json 验签分发'], rBadge: 'v3.4.3+63 · 安卓与本地 IPA' }
    ];

    function makePageTexture(spread, side) {
      const cvs = document.createElement('canvas'); cvs.width = 768; cvs.height = 1024;
      const c = cvs.getContext('2d');
      c.fillStyle = '#FAF6EC'; c.fillRect(0, 0, 768, 1024);

      c.fillStyle = 'rgba(20, 40, 255, 0.13)';
      for (let y = 72; y < 960; y += 34) {
        if (side === 'left') { for (let x = 56; x < 712; x += 34) { c.beginPath(); c.arc(x, y, 2, 0, Math.PI * 2); c.fill(); } }
        else { c.strokeStyle = 'rgba(20, 40, 255, 0.13)'; c.lineWidth = 1.6; c.beginPath(); c.moveTo(54, y); c.lineTo(714, y); c.stroke(); }
      }

      const sg = side === 'left' ? c.createLinearGradient(680, 0, 768, 0) : c.createLinearGradient(0, 0, 88, 0);
      sg.addColorStop(side === 'left' ? 0 : 1, 'rgba(18,17,22,0)'); sg.addColorStop(side === 'left' ? 1 : 0, 'rgba(18,17,22,0.16)');
      c.fillStyle = sg; c.fillRect(side === 'left' ? 680 : 0, 0, 88, 1024);

      if (side === 'left') {
        c.fillStyle = '#DCFF00'; c.strokeStyle = '#121116'; c.lineWidth = 4;
        c.beginPath(); c.roundRect(56, 54, 430, 50, 25); c.fill(); c.stroke();
        c.fillStyle = '#121116'; c.font = '900 22px NSans, sans-serif'; c.fillText(spread.tag, 78, 86);

        // Authentic embedded Morandi book-card art instead of flat solid box!
        const artCvs = document.createElement('canvas'); artCvs.width = 460; artCvs.height = 610;
        drawRealXNotesCoverCanvas(artCvs.getContext('2d'), 460, 610, {
          bg: spread.coverCol, style: spread.style, title: spread.lTitle.slice(0, 7), sub: 'X NOTES // COLLECT', ink: '#FFFDF7'
        });
        c.save();
        c.shadowColor = 'rgba(18,17,22,0.35)'; c.shadowBlur = 18; c.shadowOffsetY = 10;
        c.drawImage(artCvs, 154, 150, 460, 610);
        c.restore();

        c.fillStyle = '#2A2C35'; c.font = '700 22px NSans, sans-serif'; c.textAlign = 'center';
        c.fillText(spread.lSub, 384, 825);
        c.textAlign = 'left'; c.fillStyle = '#6B6559'; c.font = '700 20px NSans, sans-serif';
        c.fillText('🖱️ 点击左侧页 · 回翻', 56, 940);
      } else {
        c.fillStyle = '#1428FF'; c.font = '900 35px NSans, sans-serif'; c.fillText(spread.rTitle, 64, 108);
        c.fillStyle = '#FF1F7A'; c.fillRect(64, 130, 260, 7);
        let curY = 220;
        c.fillStyle = '#121116'; c.font = '700 25px NSans, sans-serif';
        spread.rBullets.forEach((line) => {
          for (let i = 0; i < line.length; i += 22) { c.fillText(line.slice(i, i + 22), 64, curY); curY += 44; }
          curY += 26;
        });
        c.fillStyle = '#121116'; c.beginPath(); c.roundRect(64, 770, 640, 104, 22); c.fill();
        c.fillStyle = '#DCFF00'; c.font = '900 25px NSans, sans-serif'; c.fillText(`★ ${spread.rBadge}`, 92, 830);
        c.fillStyle = '#6B6559'; c.font = '700 21px NSans, sans-serif'; c.fillText('🖱️ 点击或拖页翻下一页 ➔', 430, 940);
      }
      const tex = new THREE.CanvasTexture(cvs); tex.anisotropy = 4; tex.encoding = THREE.sRGBEncoding; return tex;
    }

    const spreadTex = BOOK_SPREADS.map((sp) => ({ left: makePageTexture(sp, 'left'), right: makePageTexture(sp, 'right') }));
    const PW = 2.15, PH = 2.86;
    const bookGroup = new THREE.Group(); scene.add(bookGroup);

    // Rich dark walnut hard cover & stacked cream paper decks
    const coverMesh = new THREE.Mesh(new THREE.BoxGeometry(PW * 2 + 0.18, PH + 0.18, 0.08), new THREE.MeshStandardMaterial({ color: 0x261e1a, roughness: 0.72 }));
    coverMesh.position.z = -0.14;
    const deckMat = new THREE.MeshStandardMaterial({ color: 0xe8e0cd, roughness: 0.85 });
    const leftDeck = new THREE.Mesh(new THREE.BoxGeometry(PW - 0.03, PH - 0.04, 0.10), deckMat);
    leftDeck.position.set(-PW / 2 - 0.01, 0, -0.06);
    const rightDeck = new THREE.Mesh(new THREE.BoxGeometry(PW - 0.03, PH - 0.04, 0.10), deckMat);
    rightDeck.position.set(PW / 2 + 0.01, 0, -0.06);
    bookGroup.add(coverMesh, leftDeck, rightDeck);

    function createCurvedOpenGeo(side) {
      const g = new THREE.PlaneGeometry(PW, PH, 24, 6);
      const pos = g.attributes.position;
      for (let i = 0; i < pos.count; i++) {
        const vx = pos.getX(i), u = side === 'right' ? (vx + PW / 2) / PW : (PW / 2 - vx) / PW;
        pos.setZ(i, Math.sin(Math.min(1, u * 1.15) * Math.PI) * 0.14);
      }
      g.computeVertexNormals(); return g;
    }

    const leftMat = new THREE.MeshStandardMaterial({ map: spreadTex[0].left, roughness: 0.8 });
    const rightMat = new THREE.MeshStandardMaterial({ map: spreadTex[0].right, roughness: 0.8 });
    const leftMesh = new THREE.Mesh(createCurvedOpenGeo('left'), leftMat); leftMesh.position.set(-PW / 2, 0, 0);
    const rightMesh = new THREE.Mesh(createCurvedOpenGeo('right'), rightMat); rightMesh.position.set(PW / 2, 0, 0);
    bookGroup.add(leftMesh, rightMesh);

    const turnGeo = new THREE.PlaneGeometry(PW, PH, 32, 10); turnGeo.translate(PW / 2, 0, 0);
    const baseTurnPos = turnGeo.attributes.position.array.slice();
    const turnFrontMat = new THREE.MeshStandardMaterial({ map: spreadTex[0].right, roughness: 0.75, side: THREE.FrontSide });
    const turnBackMat = new THREE.MeshStandardMaterial({ map: spreadTex[1].left, roughness: 0.75, side: THREE.BackSide });
    const turnMeshF = new THREE.Mesh(turnGeo, turnFrontMat), turnMeshB = new THREE.Mesh(turnGeo, turnBackMat);
    turnMeshF.visible = false; turnMeshB.visible = false;
    bookGroup.add(turnMeshF, turnMeshB);

    function deformTurningPage(progress) {
      const pos = turnGeo.attributes.position, sinP = Math.sin(progress * Math.PI);
      for (let i = 0; i < pos.count; i++) {
        const r = baseTurnPos[i * 3], u = r / PW, y0 = baseTurnPos[i * 3 + 1], vNorm = (y0 + PH / 2) / PH;
        const lag = sinP * (0.68 * Math.pow(u, 1.65) + 0.24 * (1 - vNorm) * u);
        const theta = Math.min(Math.PI, Math.max(0, progress * Math.PI - lag));
        const liftArch = sinP * Math.sin(u * Math.PI) * 0.32 + 0.04;
        pos.setXYZ(i, r * Math.cos(theta), y0, r * Math.sin(theta) + liftArch);
      }
      pos.needsUpdate = true; turnGeo.computeVertexNormals();
    }

    let curIdx = 0, flipping = false, flipT = 0, flipDir = 1, nextIdx = 0;
    const pageNumEl = document.getElementById('book-page-num'), dotsWrap = document.getElementById('book-dots');
    const dots = BOOK_SPREADS.map((_, i) => {
      const b = document.createElement('button'); b.type = 'button'; b.className = 'book-dot' + (i === 0 ? ' is-active' : '');
      b.addEventListener('click', () => jumpSpread(i)); dotsWrap.appendChild(b); return b;
    });
    function syncBookUI(idx) {
      pageNumEl.textContent = `0${idx + 1} / 0${BOOK_SPREADS.length}`;
      dots.forEach((d, i) => d.classList.toggle('is-active', i === idx));
    }
    function startFlip(dir) {
      if (flipping) return;
      nextIdx = (curIdx + dir + BOOK_SPREADS.length) % BOOK_SPREADS.length;
      flipDir = dir; flipping = true; turnMeshF.visible = true; turnMeshB.visible = true;
      if (dir > 0) {
        flipT = 0; turnFrontMat.map = spreadTex[curIdx].right; turnBackMat.map = spreadTex[nextIdx].left;
        leftMat.map = spreadTex[curIdx].left; rightMat.map = spreadTex[nextIdx].right;
      } else {
        flipT = 1; turnFrontMat.map = spreadTex[nextIdx].right; turnBackMat.map = spreadTex[curIdx].left;
        leftMat.map = spreadTex[nextIdx].left; rightMat.map = spreadTex[curIdx].right;
      }
      deformTurningPage(flipT);
    }
    function jumpSpread(target) {
      if (target === curIdx || flipping) return;
      startFlip(target > curIdx ? 1 : -1); nextIdx = target;
      if (flipDir > 0) { turnBackMat.map = spreadTex[nextIdx].left; rightMat.map = spreadTex[nextIdx].right; }
      else { turnFrontMat.map = spreadTex[nextIdx].right; leftMat.map = spreadTex[nextIdx].left; }
    }

    document.getElementById('btn-flip-next').addEventListener('click', () => startFlip(1));
    document.getElementById('btn-flip-prev').addEventListener('click', () => startFlip(-1));
    document.getElementById('hero-flip-cta').addEventListener('click', () => startFlip(1));

    let targetTiltX = 0, targetTiltY = -0.06, scrubActive = false, scrubStartX = 0, scrubMoved = false;
    canvas.addEventListener('pointerdown', (e) => { if (!flipping) { scrubStartX = e.clientX; scrubMoved = false; scrubActive = true; } });
    canvas.addEventListener('pointermove', (e) => {
      const r = canvas.getBoundingClientRect();
      targetTiltY = -0.06 + ((e.clientX - r.left) / r.width - 0.5) * 0.28;
      targetTiltX = ((e.clientY - r.top) / r.height - 0.5) * 0.16;
      if (scrubActive && Math.abs(e.clientX - scrubStartX) > 14 && !scrubMoved) { scrubMoved = true; startFlip((e.clientX - scrubStartX) < 0 ? 1 : -1); }
    });
    canvas.addEventListener('pointerup', (e) => {
      const wasClick = scrubActive && !scrubMoved; scrubActive = false;
      if (wasClick) { const r = canvas.getBoundingClientRect(); startFlip((e.clientX - r.left) < r.width * 0.48 ? -1 : 1); }
    });
    canvas.addEventListener('pointerleave', () => { scrubActive = false; targetTiltX = 0; targetTiltY = -0.06; });

    function fitSize() { const w = canvas.clientWidth, h = canvas.clientHeight; if (!w || !h) return; renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix(); }
    fitSize(); window.addEventListener('resize', fitSize);
    let heroVisible = true; new IntersectionObserver((es) => { heroVisible = es[0].isIntersecting; }).observe(canvas);

    function animateHero(now) {
      requestAnimationFrame(animateHero);
      if (!heroVisible) return;
      // Positive +0.10 rotation pitches bottom outward cleanly toward upright reader view (zero downward dive!)
      bookGroup.rotation.y += (targetTiltY - bookGroup.rotation.y) * 0.08;
      bookGroup.rotation.x += (0.10 + targetTiltX - bookGroup.rotation.x) * 0.08;
      bookGroup.position.y = Math.sin(now * 0.0018) * 0.04;

      if (flipping) {
        flipT += flipDir * 0.020;
        if ((flipDir > 0 && flipT >= 1) || (flipDir < 0 && flipT <= 0)) {
          flipping = false; curIdx = nextIdx;
          leftMat.map = spreadTex[curIdx].left; rightMat.map = spreadTex[curIdx].right;
          turnMeshF.visible = false; turnMeshB.visible = false; syncBookUI(curIdx);
        } else {
          const ease = flipT < 0.5 ? 2 * flipT * flipT : 1 - Math.pow(-2 * flipT + 2, 2) / 2;
          deformTurningPage(ease);
        }
      }
      renderer.render(scene, camera);
    }
    requestAnimationFrame(animateHero);
  })();

  /* ==================== 4. ACT 2: REAL VIDEO + EXACT INFINITE_BOOK_ENTRY.FRAG PORT ==================== */
  (function initDyeDualStage() {
    const vidEl = document.getElementById('dye-real-video');
    const vidRig = document.getElementById('dye-video-rig');
    const glslRig = document.getElementById('dye-glsl-rig');
    const vidBadge = document.getElementById('dye-video-badge');
    const statusBar = document.getElementById('dye-status');
    const btnReal = document.getElementById('dye-engine-real');
    const btnGlsl = document.getElementById('dye-engine-glsl');
    const uSl = document.getElementById('ucolour-slider');
    const uVal = document.getElementById('ucolour-val');

    const CLIPS = {
      gauss: { idx: 0, clip: './assets/clips/dye_gauss_real.mp4', badge: 'REAL APP CAPTURE // MODE 01 · 高斯颜料晕染', bar: '正在展示实机真录：<strong>Mode 01 · 高斯颜料晕染</strong> — 多核椭圆墨团将黑白底画温柔觉醒！' },
      drops: { idx: 1, clip: './assets/clips/dye_drops_real.mp4', badge: 'REAL APP CAPTURE // MODE 02 · 22 颗 3D 水滴落纸', bar: '正在展示实机真录：<strong>Mode 02 · 22 颗 3D 玻璃水滴</strong> — 吸色落纸并折射真实插画细节！' },
      spark: { idx: 2, clip: './assets/clips/dye_spark_real.mp4', badge: 'REAL APP CAPTURE // MODE 03 · 晶格闪点波前显色', bar: '正在展示实机真录：<strong>Mode 03 · 晶格闪点波前</strong> — 青金微观星尘随波前点亮全彩封面！' }
    };

    let currentMode = 'drops', usingGlsl = false, glslUniforms = null, bloomRaf = null;
    const vidReplayPill = document.getElementById('dye-cover-replay-pill');
    const glslReplayPill = document.getElementById('dye-glsl-replay-pill');

    // Interactive cursor 3D subtle tilt on full-scale book frame (upright by default)
    const frame3d = document.querySelector('.real-book-frame');
    vidRig.addEventListener('pointermove', (e) => {
      const r = frame3d.getBoundingClientRect();
      const nx = ((e.clientX - r.left) / r.width - 0.5) * 10;
      const ny = ((e.clientY - r.top) / r.height - 0.5) * -8;
      frame3d.style.transform = `perspective(1200px) rotateY(${nx.toFixed(1)}deg) rotateX(${ny.toFixed(1)}deg)`;
    });
    vidRig.addEventListener('pointerleave', () => { frame3d.style.transform = ''; });

    function playVideoOnce() {
      vidRig.classList.remove('is-ended');
      vidEl.currentTime = 0;
      vidEl.play().catch(() => {});
    }
    vidEl.addEventListener('ended', () => {
      vidRig.classList.add('is-ended');
      vidBadge.textContent = `${CLIPS[currentMode].badge} · ✓ 已完成（点封面重播）`;
    });

    // Port exact infinite_book_entry.frag onto Three.js WebGL (full book proportions, no shrink)!
    function setGlslProgress(pNorm) {
      const pct = Math.max(0, Math.min(100, Math.round(pNorm * 100)));
      if (glslUniforms) glslUniforms.uColour.value = pct / 100;
      uSl.value = pct; uVal.textContent = `${pct}%`;
      glslRig.classList.toggle('is-ended', pct >= 100);
    }
    function runSingleBloom() {
      cancelAnimationFrame(bloomRaf);
      glslRig.classList.remove('is-ended');
      const t0 = performance.now(), dur = 2500;
      function step(now) {
        const p = Math.min(1, (now - t0) / dur);
        setGlslProgress(p);
        if (p < 1) bloomRaf = requestAnimationFrame(step);
      }
      bloomRaf = requestAnimationFrame(step);
    }

    if (window.THREE) {
      const canvas = document.getElementById('dye-book-webgl');
      const glslFrame3d = document.querySelector('.glsl-book-frame');
      const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      const scene = new THREE.Scene(), camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 10);
      camera.position.set(0, 0, 1);

      // Rich full-color botanical / scenic X notes artwork cover -> monochrome to full-color shader demo (0 black margins!)
      const artCvs = document.createElement('canvas'); artCvs.width = 432; artCvs.height = 596;
      const ac = artCvs.getContext('2d');
      const g = ac.createLinearGradient(0, 0, 432, 596);
      g.addColorStop(0, '#D86C58'); g.addColorStop(0.45, '#598392'); g.addColorStop(1, '#2D5A4C');
      ac.fillStyle = g; ac.fillRect(0, 0, 432, 596);
      ac.fillStyle = '#F7B267'; ac.beginPath(); ac.arc(285, 228, 106, 0, Math.PI * 2); ac.fill();
      ac.fillStyle = '#3B6064'; ac.beginPath(); ac.moveTo(0, 438); ac.quadraticCurveTo(150, 330, 432, 412); ac.lineTo(432, 596); ac.lineTo(0, 596); ac.fill();
      ac.fillStyle = '#E07A5F'; ac.beginPath(); ac.moveTo(0, 508); ac.quadraticCurveTo(270, 386, 432, 492); ac.lineTo(432, 596); ac.lineTo(0, 596); ac.fill();
      // Crisp vertical cover cloth spine strip & title
      ac.fillStyle = 'rgba(32,24,22,0.55)'; ac.fillRect(0, 0, 26, 596);
      ac.fillStyle = '#FFFDF7'; ac.font = '72px "BMaShan", "KaiTi", serif'; ac.fillText('灵感手札', 56, 166);
      ac.font = '800 15px NSans, sans-serif'; ac.fillText('INFINITE BOOK ENTRY // GLSL', 60, 202);
      const artTex = new THREE.CanvasTexture(artCvs); artTex.encoding = THREE.sRGBEncoding;

      glslUniforms = {
        uColour: { value: 0.72 },
        uStyle: { value: 2.0 }, // 0=gauss, 1=reconstruct, 2=waterDrops
        uSeed: { value: 1.7 },
        uSize: { value: new THREE.Vector2(432, 596) },
        uCover: { value: artTex }
      };

      const realShaderMat = new THREE.ShaderMaterial({
        uniforms: glslUniforms,
        vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
        fragmentShader: `
          uniform float uColour; uniform float uStyle; uniform float uSeed; uniform vec2 uSize; uniform sampler2D uCover; varying vec2 vUv;
          float hash21(vec2 p){ vec3 p3=fract(vec3(p.xyx)*0.1031); p3+=dot(p3,p3.yzx+33.33); return fract((p3.x+p3.y)*p3.z); }
          float fieldNoise(vec2 p){ vec2 i=floor(p),f=fract(p); f=f*f*(3.0-2.0*f); return mix(mix(hash21(i),hash21(i+vec2(1,0)),f.x),mix(hash21(i+vec2(0,1)),hash21(i+vec2(1,1)),f.x),f.y); }
          float splat(vec2 p, vec2 center, vec2 scale, float rot, float seed){
            float t=clamp((uColour-seed)/max(0.01,1.0-seed),0.0,1.0); vec2 d=p-center; float c=cos(rot),s=sin(rot);
            d=mat2(c,-s,s,c)*d; vec2 rad=scale*(0.025+t*t*2.3);
            return exp(-0.5*dot(d/rad,d/rad))*smoothstep(0.0,0.12,t);
          }
          float gaussianColour(vec2 uv){
            vec2 p=vec2(uv.x,(1.0-uv.y)*1.2);
            float pig=splat(p,vec2(.47,.57),vec2(.24,.16),.7,.0)+splat(p,vec2(.3,.34),vec2(.2,.27),-.65,.08)+splat(p,vec2(.66,.84),vec2(.24,.2),.25,.14)+splat(p,vec2(.76,.39),vec2(.17,.23),-.35,.2)+splat(p,vec2(.22,.93),vec2(.19,.22),.5,.26)+splat(p,vec2(.48,.13),vec2(.25,.15),-.4,.3);
            return mix(clamp(1.0-exp(-pig*2.4),0.0,1.0), 1.0, smoothstep(.78,1.0,uColour));
          }
          vec3 reconstruct(vec2 uv, vec3 rgb, float gray){
            vec2 metric=vec2(uv.x,(1.0-uv.y)*uSize.y/uSize.x); vec2 seed=vec2(uSeed*13.71,uSeed*7.93);
            float field=fieldNoise(metric*3.4+seed)*.69+fieldNoise(metric*8.7-seed)*.22;
            vec2 cells=metric*142.0; vec2 cell=floor(cells); float rnd=hash21(cell+seed);
            float delta=uColour-(.06+field*.76+gray*.065+rnd*.085);
            float colAmt=mix(smoothstep(-.042,.078,delta),1.0,smoothstep(.86,1.0,uColour));
            vec2 w=abs(fract(cells)-.5); float sq=1.0-smoothstep(.23,.43,max(w.x,w.y)); float gl=pow(max(0.0,1.0-length(w)*1.45),2.0);
            float fr=1.0-smoothstep(.012,.10,abs(delta)); float sp=fr*(.3+.7*(.45+.55*sin(uColour*105.0+rnd*31.0)))*step(.23,rnd)*smoothstep(0.0,.045,uColour)*(1.0-smoothstep(.83,.98,uColour));
            vec3 glint=mix(vec3(.51,.91,1.0),vec3(1.0,.94,.61),smoothstep(.25,.75,hash21(cell*.11+seed)));
            return min(mix(vec3(gray),rgb,colAmt)+glint*sp*(sq*.95+gl*.21), vec3(1.0));
          }
          vec3 waterDrops(vec2 uv, vec3 rgb, float gray){
            float aspect=uSize.y/uSize.x; vec2 m=vec2(uv.x,(1.0-uv.y)*aspect); vec2 seed=vec2(uSeed*7.31+3.0,uSeed*3.17+5.0);
            float paper=fieldNoise(m*4.3+seed)*.6+fieldNoise(m*10.7-seed)*.28;
            float bare=1.0, core=1.0, best=0.0, rank=0.0, bestK=0.0, bestAir=0.0, bestSz=1.0; vec2 bestQ=vec2(2.0), bestCtr=vec2(.5,.5*aspect);
            for(int i=0;i<16;i++){
              float n=float(i), big=n<7.5?1.0:0.0;
              float st=big>.5? .06+.48*fract(n*.618+uSeed*.37) : .05+.62*fract(n*.382+uSeed*.53);
              float age=uColour-st;
              if(age>-.05){
                vec2 h=vec2(hash21(vec2(n*3.7+7.0,uSeed*29.3)),hash21(vec2(uSeed*11.7,n*9.1)));
                vec2 c=vec2(.12+.76*h.x, (.10+.80*h.y)*aspect);
                float sz=big>.5? .062+.03*h.x : .022+.015*h.y;
                float fall=clamp((age+.05)/.05,0.0,1.0), air=1.0-fall*fall, t=max(age,0.0)/(big>.5?1.0:.58);
                float soak=smoothstep(.15,.36,t), k=age<0.0?1.0:.68*(1.0-soak), vis=smoothstep(0.0,.4,fall)*(1.0-smoothstep(.30,.44,t))*(1.0-smoothstep(.84,.96,uColour));
                vec2 q=(m-c)/sz; float r=length(q), body=(1.0-smoothstep(.94,1.02,r))*vis;
                if(body*(1.0+2.0*air)>rank){ rank=body*(1.0+2.0*air); best=body; bestQ=q; bestK=k; bestAir=air; bestSz=sz; bestCtr=c; }
                if(age>0.0){
                  float reach=big>.5?.36:.06, stain=sz*.78+reach*(1.0-exp(-age/(big>.5?.24:.08)));
                  float dist=length(m-c)+(paper-.5)*(.012+.38*stain), cov=(1.0-smoothstep(stain-.03,stain+.01,dist))*smoothstep(0.0,.01,age);
                  bare*=1.0-cov; core*=1.0-(1.0-smoothstep(stain-.06,stain-.01,dist))*smoothstep(0.0,.01,age);
                }
              }
            }
            vec3 res=mix(vec3(gray),rgb,1.0-(1.0-bare)*(1.0-smoothstep(.8,.96,uColour)));
            res*=1.0-.18*max(core-bare,0.0);
            if(best>.001){
              float r2=min(dot(bestQ,bestQ),1.0), dome=sqrt(1.0-r2);
              vec3 norm=normalize(vec3(bestQ*bestK,max(dome,.05)));
              vec3 dye=texture2D(uCover, clamp(vec2(bestCtr.x, 1.0-bestCtr.y/aspect), 0.0, 1.0)).rgb;
              vec3 glass=mix(texture2D(uCover, clamp(uv+norm.xy*.04, 0.0, 1.0)).rgb, dye*.7, clamp(.35+smoothstep(.55,1.0,sqrt(r2))*.5,0.0,0.8));
              float spec=pow(max(0.0, dot(norm, normalize(vec3(-.45,.55,1.6)))), 72.0)*1.15;
              res=mix(res, min(glass+vec3(spec), vec3(1.0)), best);
            }
            return res;
          }
          void main(){
            vec3 rgb=texture2D(uCover, vUv).rgb;
            float gray=dot(rgb, vec3(.2126,.7152,.0722));
            vec3 outCol = uColour<=.001 ? vec3(gray) : uColour>=.999 ? rgb : uStyle<.5 ? mix(vec3(gray),rgb,gaussianColour(vUv)) : uStyle<1.5 ? reconstruct(vUv,rgb,gray) : waterDrops(vUv,rgb,gray);
            gl_FragColor=vec4(outCol,1.0);
          }
        `
      });

      // Full-bleed shader plane filling 100% of .glsl-book-frame with zero black margins!
      const glslBook = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), realShaderMat);
      scene.add(glslBook);

      glslFrame3d.addEventListener('pointermove', (e) => {
        const r = glslFrame3d.getBoundingClientRect();
        const nx = ((e.clientX - r.left) / r.width - 0.5) * 10;
        const ny = ((e.clientY - r.top) / r.height - 0.5) * -8;
        glslFrame3d.style.transform = `perspective(1200px) rotateY(${nx.toFixed(1)}deg) rotateX(${ny.toFixed(1)}deg)`;
      });
      glslFrame3d.addEventListener('pointerleave', () => { glslFrame3d.style.transform = ''; });
      uSl.addEventListener('input', () => { cancelAnimationFrame(bloomRaf); setGlslProgress(uSl.value / 100); });
      document.getElementById('ucolour-autoplay').addEventListener('click', runSingleBloom);

      function fitDye() { const w = canvas.clientWidth, h = canvas.clientHeight; if (!w || !h) return; renderer.setSize(w, h, false); }
      fitDye(); window.addEventListener('resize', fitDye);
      let vis = true; new IntersectionObserver((es) => { vis = es[0].isIntersecting; }).observe(canvas);
      (function tick() {
        requestAnimationFrame(tick); if (!vis || !usingGlsl) return;
        renderer.render(scene, camera);
      })();
    }

    function refreshDyeCardBadges() {
      const m = CLIPS[currentMode] || CLIPS.drops;
      const activeText = usingGlsl ? `MODE 0${m.idx + 1} · 正在渲染 GLSL ★` : `MODE 0${m.idx + 1} · 正在展示实录 ★`;
      document.querySelectorAll('.dye-mode-btn').forEach((b) => b.classList.toggle('is-active', b.dataset.mode === currentMode));
      document.querySelectorAll('.dye-select-card').forEach((c) => {
        const active = c.dataset.mode === currentMode; c.classList.toggle('is-selected', active);
        const tag = c.querySelector('.badge-mini');
        const pill = c.querySelector('.card-play-pill');
        if (tag) tag.textContent = active ? activeText : `MODE 0${CLIPS[c.dataset.mode].idx + 1} · 点击切换左屏渲染 ➔`;
        if (pill) pill.textContent = active ? '↻ 点击重播一次' : '▶ 点击切换并演绎';
      });
    }

    function replayCurrentDye() {
      if (usingGlsl) runSingleBloom();
      else {
        vidBadge.textContent = CLIPS[currentMode].badge;
        playVideoOnce();
      }
    }

    const dyeAura = document.getElementById('dye-ambient-aura');
    function selectDyeMode(mode, shouldPlay = true) {
      currentMode = mode;
      const m = CLIPS[mode] || CLIPS.drops;
      vidEl.src = m.clip; vidBadge.textContent = m.badge; statusBar.innerHTML = m.bar;
      if (dyeAura) dyeAura.className = `dye-ambient-aura is-${mode}`;
      if (glslUniforms) {
        glslUniforms.uStyle.value = mode === 'gauss' ? 0.0 : (mode === 'spark' ? 1.0 : 2.0);
      }
      refreshDyeCardBadges();
      if (shouldPlay) replayCurrentDye();
    }

    // Play once when first scrolled into view (never auto-loops); afterwards user clicks to replay!
    let dyeFirstPlayed = false;
    new IntersectionObserver((es) => {
      if (es[0].isIntersecting && !dyeFirstPlayed) {
        dyeFirstPlayed = true;
        playVideoOnce();
      }
    }, { threshold: 0.25 }).observe(document.getElementById('act-dye'));

    btnReal.addEventListener('click', () => {
      usingGlsl = false; btnReal.classList.add('is-active'); btnGlsl.classList.remove('is-active');
      vidRig.classList.add('is-active'); glslRig.classList.remove('is-active');
      refreshDyeCardBadges();
    });
    btnGlsl.addEventListener('click', () => {
      usingGlsl = true; btnGlsl.classList.add('is-active'); btnReal.classList.remove('is-active');
      glslRig.classList.add('is-active'); vidRig.classList.remove('is-active');
      refreshDyeCardBadges();
      if (window.THREE) window.dispatchEvent(new Event('resize'));
    });
    document.getElementById('dye-replay-btn').addEventListener('click', replayCurrentDye);
    frame3d.addEventListener('click', replayCurrentDye);
    document.querySelector('.glsl-book-frame').addEventListener('click', replayCurrentDye);
    vidReplayPill.addEventListener('click', (e) => { e.stopPropagation(); replayCurrentDye(); });
    glslReplayPill.addEventListener('click', (e) => { e.stopPropagation(); replayCurrentDye(); });
    document.querySelectorAll('.dye-mode-btn, .dye-select-card').forEach((el) => {
      el.addEventListener('click', (e) => {
        if (e.target.closest('.zoom-lens')) return;
        selectDyeMode(el.dataset.mode, true);
      });
    });
  })();

  /* ==================== 5. AUTHENTIC MORANDI SHELVES & 360 ORBIT BOOK ==================== */
  const SHELVES = {
    classic: { img: './assets/shelf.png', tag: '01 // 经典立体书架（暖灰展台与 Morandi 精装）', title: '真实布纹书脊 × 《日常随记》《灵感手札》《旅行片段》', desc: '严格按 BookCoverPainter 绘出莫兰迪书封与书脊缝线；悬停书本前倾抽出，忠实还原经典桌面书柜视觉。', bg: 0xEAE7DF },
    simple:  { img: './assets/simple_recent.png', tag: '02 // 简洁液态玻璃（柔和灰绿护眼视图）', title: '浮动毛玻璃卡片 × 最近修改直达续写', desc: '单手通勤快速浏览：顶部「最近修改」绿意胶囊标明上次书名页码，书卡安静陈列于暖白画布上。', bg: 0xEEF2EF },
    orbit:   { img: './assets/orbit_reel.png', tag: '03 // 3D 星轨轮盘 / 弧线展开 (Android 全量)', title: '真实 Morandi 书本公转环列（可切轮盘 ⇄ 弧线）', desc: '复刻 OrbitNotebookReel：既能当指尖拨动的立体圆形 CD 轮盘，又能一键舒展成顶部弧线聚光展示！', bg: 0x08090D },
    depth:   { img: './assets/depth_overview.png', tag: '04 // ∞ 24 页莫比乌斯双纽线纸带 (Android 全量)', title: '严格按 DepthRibbonGeometry 方程沿切线飞驰', desc: '24 张带文字横线的真实奶油内页沿着 x = 1.42 sin(t), z = 0.77 sin(2t) 立体轨迹优雅穿行！可一键切换伴飞 (Ride)。', bg: 0x07070A }
  };

  (function initAuthenticShelvesAnd360() {
    if (!window.THREE) return;
    const sCanvas = document.getElementById('shelf-3d-webgl');
    const sRend = new THREE.WebGLRenderer({ canvas: sCanvas, antialias: true });
    sRend.setClearColor(0xEAE7DF, 1); sRend.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    const sScene = new THREE.Scene(), sCam = new THREE.PerspectiveCamera(40, 1.4, 0.1, 40);
    sCam.position.set(0, 0.9, 6.2); sCam.lookAt(0, 0, 0);
    sScene.add(new THREE.AmbientLight(0xffffff, 0.9));
    const dl = new THREE.DirectionalLight(0xfffdf6, 0.45); dl.position.set(2, 4, 4); sScene.add(dl);

    // Authentic X notes cover configs
    const REAL_BOOKS = [
      { bg: '#5D7066', style: 0, title: '日常随记', sub: 'THOUGHTS & LITTLE THINGS', ink: '#FFFDF7' },
      { bg: '#AE765E', style: 1, title: '灵感手札', sub: 'A PLACE FOR WILD IDEAS', ink: '#FFFDF7' },
      { bg: '#536B83', style: 2, title: '旅行片段', sub: 'COLLECT LITTLE MOMENTS', ink: '#FFFDF7' },
      { bg: '#3B4968', style: 3, title: '星海诗篇', sub: 'ASTRAL & POETIC NOTES', ink: '#FFFDF7' },
      { bg: '#7A6855', style: 0, title: '读书札记', sub: 'READING NOTES // VOL.1', ink: '#FFFDF7' },
      { bg: '#4E625B', style: 1, title: '山间手记', sub: 'NOTES IN THE HILLS', ink: '#FFFDF7' }
    ];
    const bookMeshes = REAL_BOOKS.map((cfg) => {
      const c = document.createElement('canvas'); c.width = 360; c.height = 496;
      drawRealXNotesCoverCanvas(c.getContext('2d'), 360, 496, cfg);
      const tex = new THREE.CanvasTexture(c); tex.encoding = THREE.sRGBEncoding;

      const bc = document.createElement('canvas'); bc.width = 240; bc.height = 330;
      const bg = bc.getContext('2d');
      bg.fillStyle = cfg.bg; bg.fillRect(0, 0, 240, 330);
      bg.fillStyle = 'rgba(0,0,0,0.16)'; bg.fillRect(222, 0, 18, 330);
      bg.strokeStyle = 'rgba(255,255,255,0.22)'; bg.lineWidth = 1.5; bg.strokeRect(18, 18, 194, 294);
      bg.fillStyle = 'rgba(255,255,255,0.72)'; bg.font = '800 13px NSans, sans-serif'; bg.fillText('X NOTES · LOCAL', 28, 296);
      const backTex = new THREE.CanvasTexture(bc); backTex.encoding = THREE.sRGBEncoding;

      const m = new THREE.Mesh(
        new THREE.BoxGeometry(1.12, 1.54, 0.13),
        [new THREE.MeshStandardMaterial({ color: 0xf2ece0 }), new THREE.MeshStandardMaterial({ color: cfg.bg, roughness: 0.78 }), new THREE.MeshStandardMaterial({ color: 0xf2ece0 }), new THREE.MeshStandardMaterial({ color: 0xf2ece0 }), new THREE.MeshStandardMaterial({ map: tex, roughness: 0.72 }), new THREE.MeshStandardMaterial({ map: backTex, roughness: 0.76 })]
      );
      sScene.add(m); return m;
    });

    // Subtle grounded contact shadows for the 3 Classic Shelf books
    const shadowC = document.createElement('canvas'); shadowC.width = 128; shadowC.height = 64;
    const shg = shadowC.getContext('2d');
    const rg = shg.createRadialGradient(64, 32, 6, 64, 32, 60);
    rg.addColorStop(0, 'rgba(22,20,18,0.28)'); rg.addColorStop(1, 'rgba(22,20,18,0)');
    shg.fillStyle = rg; shg.fillRect(0, 0, 128, 64);
    const shTex = new THREE.CanvasTexture(shadowC);
    const classicShadows = [-1, 0, 1].map((slot) => {
      const sm = new THREE.Mesh(new THREE.PlaneGeometry(1.36, 0.42), new THREE.MeshBasicMaterial({ map: shTex, transparent: true, depthWrite: false }));
      sm.rotation.x = -Math.PI / 2; sm.position.set(slot * 1.48, -0.94, slot === 0 ? 0.35 : -0.15);
      sScene.add(sm); return sm;
    });

    // 24 Authentic Cream Ruled Written Pages for Depth Ribbon Mode
    const creamPageMeshes = [];
    for (let i = 0; i < 24; i++) {
      const pc = document.createElement('canvas'); pc.width = 180; pc.height = 248;
      const g = pc.getContext('2d');
      g.fillStyle = '#FBF7EE'; g.fillRect(0, 0, 180, 248);
      g.strokeStyle = 'rgba(18,17,22,0.12)'; g.lineWidth = 1;
      for (let y = 36; y < 220; y += 16) { g.beginPath(); g.moveTo(14, y); g.lineTo(166, y); g.stroke(); }
      g.fillStyle = i % 5 === 0 ? '#1428FF' : '#2C2E36';
      for (let k = 0; k < 4; k++) { g.fillRect(18, 42 + k * 24, 64 + ((i * 23 + k * 19) % 72), 3); }
      g.fillStyle = '#3B6F5C'; g.fillRect(20, 160, 88, 12); // occlusion block!
      g.fillStyle = '#7A7D85'; g.font = 'bold 11px NSans, sans-serif'; g.fillText(`P.${i + 1}`, 136, 22);
      const pt = new THREE.CanvasTexture(pc); pt.encoding = THREE.sRGBEncoding;
      const pm = new THREE.Mesh(new THREE.PlaneGeometry(0.46, 0.63), new THREE.MeshBasicMaterial({ map: pt, side: THREE.DoubleSide }));
      sScene.add(pm); creamPageMeshes.push(pm);
    }
    // Delicate silver infinity guide trace matching DepthRibbonGeometry
    const tracePts = [];
    for (let i = 0; i <= 180; i++) {
      const t = (i / 180) * Math.PI * 2;
      tracePts.push(new THREE.Vector3(1.65 * Math.sin(t), 0.36 * Math.cos(t), 0.90 * Math.sin(2 * t)));
    }
    const ribbonLine = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints(tracePts),
      new THREE.LineBasicMaterial({ color: 0x9aa4c2, transparent: true, opacity: 0.45 })
    );
    sScene.add(ribbonLine);

    let sMode = 'classic', orbitArc = false, depthRide = false, shelfYaw = 0, shelfPitch = 0;
    const subBtn = document.getElementById('shelf-sub-toggle'), rideBtn = document.getElementById('depth-ride-toggle');
    subBtn.addEventListener('click', () => { orbitArc = !orbitArc; subBtn.textContent = orbitArc ? '🔄 弧线展翼 → 切回圆形轮盘' : '🔄 圆形轮盘 → 切到弧线展开'; });
    rideBtn.addEventListener('click', () => { depthRide = !depthRide; rideBtn.textContent = depthRide ? '🎥 近景伴飞 (Ride) → 回总览 ∞' : '🎥 切到近景纸带伴飞 (Ride)'; });

    sCanvas.addEventListener('pointermove', (e) => {
      const r = sCanvas.getBoundingClientRect();
      const nx = ((e.clientX - r.left) / r.width - 0.5) * 2, ny = ((e.clientY - r.top) / r.height - 0.5) * 2;
      shelfYaw = nx * 0.35; shelfPitch = -ny * 0.20;
    });
    sCanvas.addEventListener('pointerleave', () => { shelfYaw = 0; shelfPitch = 0; });

    function switchShelf(k) {
      sMode = k; const d = SHELVES[k];
      sRend.setClearColor(d.bg, 1);
      document.getElementById('shelf-preview-img').src = d.img;
      document.getElementById('shelf-tag').textContent = d.tag;
      document.getElementById('shelf-title').textContent = d.title;
      document.getElementById('shelf-desc').textContent = d.desc;
      document.querySelectorAll('.shelf-tab').forEach((t) => t.classList.toggle('is-active', t.dataset.shelf === k));
      subBtn.style.display = k === 'orbit' ? 'inline-block' : 'none';
      rideBtn.style.display = k === 'depth' ? 'inline-block' : 'none';
    }
    document.querySelectorAll('.shelf-tab').forEach((t) => t.addEventListener('click', () => switchShelf(t.dataset.shelf)));
    document.getElementById('shelf-zoom-btn').addEventListener('click', () => { const d = SHELVES[sMode]; openLightbox(d.img, d.title, d.desc); });
    switchShelf('classic');

    function fitShelf() { const w = sCanvas.clientWidth, h = sCanvas.clientHeight; if (!w || !h) return; sRend.setSize(w, h, false); sCam.aspect = w / h; sCam.updateProjectionMatrix(); }
    fitShelf(); window.addEventListener('resize', fitShelf);
    let sVis = true; new IntersectionObserver((es) => { sVis = es[0].isIntersecting; }).observe(sCanvas);

    function tickShelf(now) {
      requestAnimationFrame(tickShelf); if (!sVis) return;
      const t = now * 0.001;
      const showBooks = sMode !== 'depth';
      bookMeshes.forEach((m) => { m.visible = showBooks; });
      classicShadows.forEach((sm) => { sm.visible = sMode === 'classic'; });
      creamPageMeshes.forEach((m) => { m.visible = sMode === 'depth'; });
      ribbonLine.visible = sMode === 'depth';

      if (sMode === 'classic') {
        sCam.position.lerp(new THREE.Vector3(shelfYaw * 0.9, 0.25 + shelfPitch * 0.5, 5.2), 0.08); sCam.lookAt(0, 0, 0);
        bookMeshes.forEach((m, i) => {
          m.visible = i < 3;
          const slot = i - 1;
          m.position.lerp(new THREE.Vector3(slot * 1.48, slot === 0 ? 0.08 : -0.02, slot === 0 ? 0.35 : -0.15), 0.1);
          m.rotation.set(0.04, -slot * 0.16 + shelfYaw * 0.3, 0);
          const sc = slot === 0 ? 1.15 : 0.92; m.scale.set(sc, sc, sc);
        });
      } else if (sMode === 'simple') {
        sCam.position.lerp(new THREE.Vector3(0, 0, 5.5), 0.08); sCam.lookAt(0, 0, 0);
        bookMeshes.forEach((m, i) => {
          const row = Math.floor(i / 3), col = i % 3;
          m.position.lerp(new THREE.Vector3((col - 1) * 1.35 + shelfYaw * 0.4, (0.5 - row) * 1.42 + Math.sin(t * 1.5 + i) * 0.03, row * -0.1), 0.1);
          m.rotation.set(0, shelfYaw * 0.15, 0); m.scale.set(0.76, 0.76, 0.76);
        });
      } else if (sMode === 'orbit') {
        sCam.position.lerp(new THREE.Vector3(0, 0.3 + shelfPitch, 5.4), 0.08); sCam.lookAt(0, 0, 0);
        bookMeshes.forEach((m, i) => {
          const a = (i / 6) * Math.PI * 2 + t * 0.38 + shelfYaw * 2.0;
          if (orbitArc) {
            const xArc = Math.sin(a) * 2.2, yArc = Math.cos(a) * 0.55 - 0.15, zArc = Math.cos(a) * 1.2;
            m.position.set(xArc, yArc, zArc); m.rotation.set(0, -xArc * 0.25, -xArc * 0.08);
          } else {
            m.position.set(Math.sin(a) * 2.15, Math.sin(a * 2) * 0.1, Math.cos(a) * 1.75 - 0.3); m.rotation.set(0, a, 0);
          }
          m.scale.set(0.88, 0.88, 0.88);
        });
      } else {
        // Exact DepthRibbonGeometry curve: (1.42 sin(t), 0.32 cos(t), 0.77 sin(2t))
        if (depthRide) {
          sCam.position.lerp(new THREE.Vector3(1.8 + shelfYaw * 0.8, 0.65 + shelfPitch * 0.5, 1.85), 0.06);
          sCam.lookAt(0.4, 0.05, 0.1);
        } else {
          sCam.position.lerp(new THREE.Vector3(shelfYaw * 1.4, 1.45 + shelfPitch * 0.8, 4.1), 0.07);
          sCam.lookAt(0, 0, 0);
        }
        creamPageMeshes.forEach((pm, i) => {
          const idxT = (i / 24) * Math.PI * 2 + t * 0.26;
          const px = 1.65 * Math.sin(idxT), py = 0.36 * Math.cos(idxT), pz = 0.90 * Math.sin(2 * idxT);
          pm.position.set(px, py, pz);
          // Tangent alignment matching DepthRibbonGeometry
          const nx = 1.65 * Math.sin(idxT + 0.04), ny = 0.36 * Math.cos(idxT + 0.04), nz = 0.90 * Math.sin(2 * (idxT + 0.04));
          pm.lookAt(px + (nx - px), py + (ny - py), pz + (nz - pz));
          pm.rotateY(Math.PI / 2);
        });
      }
      sRend.render(sScene, sCam);
    }
    requestAnimationFrame(tickShelf);

    // 360 Free-Orbit Hardcover Book Inspector (#book360-webgl) with REAL Morandi textures!
    const bCanvas = document.getElementById('book360-webgl');
    const bRend = new THREE.WebGLRenderer({ canvas: bCanvas, antialias: true });
    bRend.setClearColor(0x0D1445, 1); bRend.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    const bScene = new THREE.Scene(), bCam = new THREE.PerspectiveCamera(36, 1.3, 0.1, 30);
    bCam.position.set(0, 0.15, 4.8); bScene.add(new THREE.AmbientLight(0xffffff, 0.9));
    const dl2 = new THREE.DirectionalLight(0xffffff, 0.48); dl2.position.set(2.5, 3.5, 4); bScene.add(dl2);

    const fC = document.createElement('canvas'); fC.width = 480; fC.height = 640;
    drawRealXNotesCoverCanvas(fC.getContext('2d'), 480, 640, { bg: '#AE765E', style: 1, title: '灵感手札', sub: 'A PLACE FOR WILD IDEAS', ink: '#FFFDF7' });
    const fT = new THREE.CanvasTexture(fC); fT.encoding = THREE.sRGBEncoding;

    const sC = document.createElement('canvas'); sC.width = 128; sC.height = 640;
    const sc = sC.getContext('2d'); sc.fillStyle = '#7E4D39'; sc.fillRect(0, 0, 128, 640);
    sc.fillStyle = '#FFFDF7'; sc.font = '32px "BMaShan", "KaiTi", serif'; sc.textAlign = 'center';
    [...'灵感手札'].forEach((ch, idx) => sc.fillText(ch, 64, 210 + idx * 54));
    sc.fillStyle = '#DCFF00'; sc.font = '800 22px NSans, sans-serif'; sc.fillText('X', 64, 570);
    const sT = new THREE.CanvasTexture(sC); sT.encoding = THREE.sRGBEncoding;

    const bkC = document.createElement('canvas'); bkC.width = 480; bkC.height = 640;
    drawRealXNotesCoverCanvas(bkC.getContext('2d'), 480, 640, { bg: '#2C2A32', style: 3, title: '留白封底', sub: '360° BACK COVER · X NOTES', ink: '#FFFDF7' });
    const bkT = new THREE.CanvasTexture(bkC); bkT.encoding = THREE.sRGBEncoding;

    const orbBook = new THREE.Mesh(
      new THREE.BoxGeometry(1.88, 2.48, 0.26),
      [new THREE.MeshStandardMaterial({ color: 0xf4eee1 }), new THREE.MeshStandardMaterial({ map: sT }), new THREE.MeshStandardMaterial({ color: 0xf4eee1 }), new THREE.MeshStandardMaterial({ color: 0xf4eee1 }), new THREE.MeshStandardMaterial({ map: fT }), new THREE.MeshStandardMaterial({ map: bkT })]
    );
    bScene.add(orbBook);

    let bYaw = -0.35, bPitch = 0.08, dragging360 = false;
    bCanvas.addEventListener('pointerdown', () => { dragging360 = true; });
    window.addEventListener('pointerup', () => { dragging360 = false; });
    bCanvas.addEventListener('pointermove', (e) => { if (dragging360) { bYaw += e.movementX * 0.014; bPitch = Math.max(-0.9, Math.min(0.9, bPitch + e.movementY * 0.01)); } });

    const PRESETS_360 = { cover: { y: 0, p: 0.06, txt: '正面封面：太阳圆盘与波浪底纹（按住左键拖拽任意旋转 360°！）' }, spine: { y: 1.57, p: 0.04, txt: '竖排书脊：布纹书脊居中竖排「灵感手札」，书架陈列一目了然！' }, back: { y: 3.14, p: 0.06, txt: '360° 留白封底：独立微调色调与 X 徽标，合书处处经得起端详。' }, interior: { y: -0.58, p: 0.22, txt: '3.4.3 新增样书翻开：可前往右侧双滑杆实时预览内页网格与字库！' } };
    const spinCap = document.getElementById('spin-caption');
    document.querySelectorAll('.spin-tab').forEach((btn) => btn.addEventListener('click', () => {
      document.querySelectorAll('.spin-tab').forEach((x) => x.classList.remove('is-active')); btn.classList.add('is-active');
      const p = PRESETS_360[btn.dataset.angle]; bYaw = p.y; bPitch = p.p; spinCap.textContent = p.txt;
    }));
    function fit360() { const w = bCanvas.clientWidth, h = bCanvas.clientHeight; if (!w || !h) return; bRend.setSize(w, h, false); bCam.aspect = w / h; bCam.updateProjectionMatrix(); }
    fit360(); window.addEventListener('resize', fit360);
    let bVis = true; new IntersectionObserver((es) => { bVis = es[0].isIntersecting; }).observe(bCanvas);
    (function tick360(now) {
      requestAnimationFrame(tick360); if (!bVis) return;
      orbBook.rotation.y += (bYaw - orbBook.rotation.y) * 0.08; orbBook.rotation.x += (bPitch - orbBook.rotation.x) * 0.08;
      orbBook.position.y = Math.sin(now * 0.0022) * 0.04; bRend.render(bScene, bCam);
    })();
  })();

  /* ==================== 6. LIVE PAPER & FONT STUDIO ==================== */
  const pCanvas = document.getElementById('paper-canvas'), pctx = pCanvas.getContext('2d');
  const slOpacity = document.getElementById('slider-opacity'), slDensity = document.getElementById('slider-density');
  const valOpacity = document.getElementById('val-opacity'), valDensity = document.getElementById('val-density');
  let curPat = 'grid', curFont = 'BMaShan';
  const FONT_POEMS = { BMaShan: '春风得意 · 笔墨生辉', BZhiMang: '行云流水 · 自由落笔', BLiuJian: '笔走龙蛇 · 侠意江湖', BLongCang: '山高水长 · 自在写意' };
  function drawPaperPreview() {
    const Wp = pCanvas.width, Hp = pCanvas.height, op = parseInt(slOpacity.value, 10) / 100, dn = parseInt(slDensity.value, 10);
    valOpacity.textContent = `${slOpacity.value}%`; valDensity.textContent = `${dn}%`;
    const step = Math.round(44 - (dn - 25) * 0.34);
    pctx.fillStyle = '#FFFDF7'; pctx.fillRect(0, 0, Wp, Hp);
    pctx.strokeStyle = `rgba(20, 40, 255, ${(op * 0.45).toFixed(2)})`; pctx.fillStyle = `rgba(20, 40, 255, ${(op * 0.65).toFixed(2)})`; pctx.lineWidth = 1.1;
    if (curPat === 'lined' || curPat === 'grid') for (let y = step; y < Hp; y += step) { pctx.beginPath(); pctx.moveTo(0, y); pctx.lineTo(Wp, y); pctx.stroke(); }
    if (curPat === 'grid') for (let x = step; x < Wp; x += step) { pctx.beginPath(); pctx.moveTo(x, 0); pctx.lineTo(x, Hp); pctx.stroke(); }
    if (curPat === 'dot') for (let y = step; y < Hp; y += step) for (let x = step; x < Wp; x += step) { pctx.beginPath(); pctx.arc(x, y, 1.8, 0, Math.PI * 2); pctx.fill(); }
    pctx.fillStyle = '#121116'; pctx.font = `54px "${curFont}", "KaiTi", serif`; pctx.textAlign = 'center'; pctx.textBaseline = 'middle';
    pctx.fillText(FONT_POEMS[curFont], Wp / 2, Hp / 2);
  }
  document.querySelectorAll('.paper-tab').forEach((b) => b.addEventListener('click', () => { document.querySelectorAll('.paper-tab').forEach((x) => x.classList.remove('is-active')); b.classList.add('is-active'); curPat = b.dataset.pat; drawPaperPreview(); }));
  document.querySelectorAll('.font-chip').forEach((b) => b.addEventListener('click', () => { document.querySelectorAll('.font-chip').forEach((x) => x.classList.remove('is-active')); b.classList.add('is-active'); curFont = b.dataset.font; drawPaperPreview(); }));
  slOpacity.addEventListener('input', drawPaperPreview); slDensity.addEventListener('input', drawPaperPreview);
  document.fonts.ready.then(drawPaperPreview); drawPaperPreview();

  /* ==================== 7. ACT 4: 3-EDGE DOCK + STAR SEARCH + 8 BRUSH TESTER + 3 TRIALS ==================== */
  const dockDemo = document.getElementById('dock-demo');
  document.querySelectorAll('.dock-pos-btn').forEach((b) => b.addEventListener('click', () => {
    document.querySelectorAll('.dock-pos-btn').forEach((x) => x.classList.remove('is-on')); b.classList.add('is-on');
    dockDemo.classList.remove('is-right', 'is-collapsed');
    if (b.dataset.pos === 'right') dockDemo.classList.add('is-right');
    if (b.dataset.pos === 'collapsed') dockDemo.classList.add('is-collapsed');
  }));
  document.getElementById('dock-toggle-bar').addEventListener('click', () => dockDemo.classList.add('is-collapsed'));
  document.getElementById('dock-bottom-restore').addEventListener('click', () => dockDemo.classList.remove('is-collapsed'));

  const starBtn = document.getElementById('star-pin-btn');
  starBtn.addEventListener('click', () => {
    const pinned = starBtn.classList.toggle('is-starred');
    starBtn.textContent = pinned ? '★ 已收藏置顶!' : '☆ 加星置顶';
    document.getElementById('star-pinned-badge').classList.toggle('is-shown', pinned);
    document.getElementById('pinned-mini-icon').classList.toggle('is-shown', pinned);
  });

  function canvasCoord(cvs, e) { const r = cvs.getBoundingClientRect(); return { x: (e.clientX - r.left) * (cvs.width / r.width), y: (e.clientY - r.top) * (cvs.height / r.height) }; }

  // 8-Brush Physical Bench
  const bbCvs = document.getElementById('brush-bench-canvas'), bbCtx = bbCvs.getContext('2d');
  let curBrush = 'fountain', bbDown = false, bbLast = null, bbTime = 0;
  function initBenchPaper() {
    bbCtx.fillStyle = '#FAF6EC'; bbCtx.fillRect(0, 0, bbCvs.width, bbCvs.height);
    bbCtx.strokeStyle = 'rgba(20,40,255,0.12)'; bbCtx.lineWidth = 1;
    for (let y = 28; y < bbCvs.height; y += 28) { bbCtx.beginPath(); bbCtx.moveTo(0, y); bbCtx.lineTo(bbCvs.width, y); bbCtx.stroke(); }
    // Pre-draw sample strokes showcasing brush differences
    bbCtx.fillStyle = 'rgba(18,17,22,0.35)'; bbCtx.font = '700 13px NSans, sans-serif';
    bbCtx.fillText('在纸面上拖动书写体验真实颗粒 / 粗细挑锋 / 荧光半透差别', 20, 22);
  }
  initBenchPaper();
  document.querySelectorAll('.brush-type-btn').forEach((b) => b.addEventListener('click', () => {
    document.querySelectorAll('.brush-type-btn').forEach((x) => x.classList.remove('is-active')); b.classList.add('is-active'); curBrush = b.dataset.brush;
  }));
  document.getElementById('brush-bench-clear').addEventListener('click', initBenchPaper);
  bbCvs.addEventListener('pointerdown', (e) => { bbDown = true; bbLast = canvasCoord(bbCvs, e); bbTime = Date.now(); });
  bbCvs.addEventListener('pointermove', (e) => {
    if (!bbDown) return;
    const pt = canvasCoord(bbCvs, e), now = Date.now(), dt = Math.max(8, now - bbTime);
    const spd = Math.hypot(pt.x - bbLast.x, pt.y - bbLast.y) / dt;
    bbCtx.save(); bbCtx.lineCap = 'round'; bbCtx.lineJoin = 'round';
    if (curBrush === 'pencil') {
      bbCtx.fillStyle = '#4B505A';
      for (let i = 0; i < 12; i++) bbCtx.fillRect(pt.x + (Math.random() - 0.5) * 6, pt.y + (Math.random() - 0.5) * 6, 1.8, 1.8);
    } else if (curBrush === 'crayon') {
      bbCtx.fillStyle = '#FF3B1D';
      for (let i = 0; i < 18; i++) { const a = Math.random() * 6.28, r = Math.random() * 7; bbCtx.fillRect(pt.x + Math.cos(a) * r, pt.y + Math.sin(a) * r, 2.5, 2.5); }
    } else if (curBrush === 'highlighter') {
      bbCtx.globalAlpha = 0.25; bbCtx.strokeStyle = '#DCFF00'; bbCtx.lineWidth = 22;
      bbCtx.beginPath(); bbCtx.moveTo(bbLast.x, bbLast.y); bbCtx.lineTo(pt.x, pt.y); bbCtx.stroke();
    } else if (curBrush === 'watercolor') {
      bbCtx.globalAlpha = 0.16; bbCtx.strokeStyle = '#00A6FB'; bbCtx.lineWidth = 18;
      bbCtx.beginPath(); bbCtx.moveTo(bbLast.x, bbLast.y); bbCtx.lineTo(pt.x, pt.y); bbCtx.stroke();
    } else if (curBrush === 'oil') {
      bbCtx.strokeStyle = '#FF6B00'; bbCtx.lineWidth = 13;
      bbCtx.beginPath(); bbCtx.moveTo(bbLast.x, bbLast.y); bbCtx.lineTo(pt.x, pt.y); bbCtx.stroke();
    } else {
      bbCtx.strokeStyle = curBrush === 'calligraphy' ? '#121116' : (curBrush === 'needle' ? '#1428FF' : '#1E2433');
      bbCtx.lineWidth = curBrush === 'calligraphy' ? Math.max(3, 14 - spd * 6) : (curBrush === 'needle' ? 2.2 : Math.max(2.5, 6 - spd * 1.6));
      bbCtx.beginPath(); bbCtx.moveTo(bbLast.x, bbLast.y); bbCtx.lineTo(pt.x, pt.y); bbCtx.stroke();
    }
    bbCtx.restore(); bbLast = pt; bbTime = now;
  });
  window.addEventListener('pointerup', () => { bbDown = false; });

  // Trial 1: Real Geometry Recognizer (Line, Arrow 1-stroke/2-stroke, Triangle by vertices & area, Ellipse/Circle)
  const shCanvas = document.getElementById('trial-shape-canvas'), shCtx = shCanvas.getContext('2d'), shMsg = document.getElementById('shape-result-label');
  let rawPts = [], drawingShape = false, presetTimer = null, prevLine = null;

  function distToSegment(p, a, b) {
    const dx = b.x - a.x, dy = b.y - a.y, l2 = dx * dx + dy * dy;
    if (l2 < 1e-4) return Math.hypot(p.x - a.x, p.y - a.y);
    const t = Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / l2));
    return Math.hypot(p.x - (a.x + t * dx), p.y - (a.y + t * dy));
  }

  function extractTriangleVertices(pts, cx, cy) {
    let v0 = pts[0], dMax = -1;
    for (const p of pts) { const d = Math.hypot(p.x - cx, p.y - cy); if (d > dMax) { dMax = d; v0 = p; } }
    let v1 = v0, d1Max = -1;
    for (const p of pts) { const d = Math.hypot(p.x - v0.x, p.y - v0.y); if (d > d1Max) { d1Max = d; v1 = p; } }
    let v2 = v1, areaMax = -1;
    for (const p of pts) {
      const a = Math.abs((p.x - v0.x) * (v1.y - v0.y) - (p.y - v0.y) * (v1.x - v0.x));
      if (a > areaMax) { areaMax = a; v2 = p; }
    }
    return [v0, v1, v2];
  }

  function detectOneStrokeArrow(pts) {
    if (pts.length < 6) return null;
    const p0 = pts[0], pEnd = pts[pts.length - 1];
    let tipIdx = 0, maxD = 0;
    for (let i = 1; i < pts.length; i++) {
      const d = Math.hypot(pts[i].x - p0.x, pts[i].y - p0.y);
      if (d > maxD) { maxD = d; tipIdx = i; }
    }
    if (maxD < 38 || tipIdx >= pts.length - 1 || tipIdx < Math.floor(pts.length * 0.4)) return null;
    const tip = pts[tipIdx];
    const ux = (tip.x - p0.x) / maxD, uy = (tip.y - p0.y) / maxD;
    const bx = pEnd.x - tip.x, by = pEnd.y - tip.y, bLen = Math.hypot(bx, by);
    if (bLen < 10 || bLen > maxD * 0.62) return null;
    const backDot = (bx * -ux + by * -uy) / bLen;
    const perp = Math.abs(bx * -uy + by * ux);
    if (backDot > 0.25 && perp > 6) return { from: p0, to: tip };
    return null;
  }

  function drawVectorArrow(from, to) {
    const ang = Math.atan2(to.y - from.y, to.x - from.x), head = 24;
    shCtx.beginPath(); shCtx.moveTo(from.x, from.y); shCtx.lineTo(to.x - 10 * Math.cos(ang), to.y - 10 * Math.sin(ang)); shCtx.stroke();
    shCtx.fillStyle = '#1428FF';
    shCtx.beginPath();
    shCtx.moveTo(to.x, to.y);
    shCtx.lineTo(to.x - head * Math.cos(ang - 0.44), to.y - head * Math.sin(ang - 0.44));
    shCtx.lineTo(to.x - head * 0.72 * Math.cos(ang), to.y - head * 0.72 * Math.sin(ang));
    shCtx.lineTo(to.x - head * Math.cos(ang + 0.44), to.y - head * Math.sin(ang + 0.44));
    shCtx.closePath(); shCtx.fill(); shCtx.stroke();
  }

  function snapGeometry(pts, forceType = null) {
    if (pts.length < 3) return;
    const p0 = pts[0], p1 = pts[pts.length - 1];
    let minX = 999, maxX = -999, minY = 999, maxY = -999, sx = 0, sy = 0;
    pts.forEach((p) => { minX = Math.min(minX, p.x); maxX = Math.max(maxX, p.x); minY = Math.min(minY, p.y); maxY = Math.max(maxY, p.y); sx += p.x; sy += p.y; });
    const w = maxX - minX, h = maxY - minY, diag = Math.hypot(w, h), endDist = Math.hypot(p1.x - p0.x, p1.y - p0.y);

    // Two-stroke arrow support: line drawn first + barb stroke added near its tip
    const strokeLen = Math.hypot(maxX - minX, maxY - minY);
    if (!forceType && prevLine && (Date.now() - prevLine.t < 2400) && strokeLen < prevLine.len * 0.65) {
      const tipMatch = Math.hypot(p0.x - prevLine.to.x, p0.y - prevLine.to.y) < 48 || Math.hypot(p1.x - prevLine.to.x, p1.y - prevLine.to.y) < 48;
      if (tipMatch) {
        shCtx.clearRect(0, 0, shCanvas.width, shCanvas.height);
        shCtx.strokeStyle = '#1428FF'; shCtx.lineWidth = 5; shCtx.lineCap = 'round'; shCtx.lineJoin = 'round';
        drawVectorArrow(prevLine.from, prevLine.to);
        prevLine = null;
        shMsg.textContent = '✨ 两笔合成为锐利矢量箭头！';
        return;
      }
    }

    shCtx.clearRect(0, 0, shCanvas.width, shCanvas.height);
    shCtx.strokeStyle = 'rgba(18,17,22,0.20)'; shCtx.lineWidth = 2.5; shCtx.setLineDash([4, 4]);
    shCtx.beginPath(); pts.forEach((p, i) => i ? shCtx.lineTo(p.x, p.y) : shCtx.moveTo(p.x, p.y)); shCtx.stroke(); shCtx.setLineDash([]);
    shCtx.strokeStyle = '#1428FF'; shCtx.lineWidth = 5; shCtx.lineCap = 'round'; shCtx.lineJoin = 'round';

    const oneArrow = detectOneStrokeArrow(pts);
    if (forceType === 'arrow' || (!forceType && oneArrow)) {
      const arrowPts = oneArrow || { from: p0, to: p1 };
      drawVectorArrow(arrowPts.from, arrowPts.to);
      prevLine = null;
      shMsg.textContent = '✨ 一笔吸附为锐利矢量箭头！';
      return;
    }

    const isClosed = (forceType === 'tri' || forceType === 'circle') || (endDist < Math.max(38, diag * 0.45) && w > 24 && h > 24);
    if (isClosed) {
      const cx = (minX + maxX) / 2, cy = (minY + maxY) / 2;
      const mx = sx / pts.length, my = sy / pts.length;
      const [v0, v1, v2] = extractTriangleVertices(pts, mx, my);
      let triSum = 0, cirSum = 0, area2 = 0;
      const rx = Math.max(12, w / 2), ry = Math.max(12, h / 2);
      for (let i = 0; i < pts.length; i++) {
        const p = pts[i], q = pts[(i + 1) % pts.length];
        area2 += p.x * q.y - q.x * p.y;
        const dEdge = Math.min(distToSegment(p, v0, v1), distToSegment(p, v1, v2), distToSegment(p, v2, v0));
        triSum += dEdge / Math.max(1, diag);
        cirSum += Math.abs(Math.hypot((p.x - cx) / rx, (p.y - cy) / ry) - 1.0);
      }
      const triErr = triSum / pts.length, cirErr = cirSum / pts.length;
      const areaRatio = Math.abs(area2 * 0.5) / Math.max(1, w * h);
      const isTriangle = forceType === 'tri' || (forceType !== 'circle' && (triErr < cirErr * 1.18 && areaRatio < 0.66 || (triErr < 0.055 && cirErr > 0.095)));
      prevLine = null;
      if (isTriangle) {
        shCtx.beginPath(); shCtx.moveTo(v0.x, v0.y); shCtx.lineTo(v1.x, v1.y); shCtx.lineTo(v2.x, v2.y); shCtx.closePath(); shCtx.stroke();
        shMsg.textContent = '✨ 自动吸附为贴合手绘顶点的矢量三角形！';
      } else {
        shCtx.beginPath(); shCtx.ellipse(cx, cy, w / 2, h / 2, 0, 0, Math.PI * 2); shCtx.stroke();
        shMsg.textContent = '✨ 自动吸附为标准矢量圆！';
      }
    } else {
      shCtx.beginPath(); shCtx.moveTo(p0.x, p0.y); shCtx.lineTo(p1.x, p1.y); shCtx.stroke();
      prevLine = { from: p0, to: p1, len: Math.hypot(p1.x - p0.x, p1.y - p0.y), t: Date.now() };
      shMsg.textContent = '✨ 自动吸附为直线（补一笔 > 即成箭头）！';
    }
  }
  shCanvas.addEventListener('pointerdown', (e) => {
    clearTimeout(presetTimer);
    document.querySelectorAll('.shape-preset-btn').forEach((x) => x.classList.remove('is-active'));
    drawingShape = true; rawPts = [canvasCoord(shCanvas, e)];
    if (!prevLine || Date.now() - prevLine.t > 2400) shCtx.clearRect(0, 0, shCanvas.width, shCanvas.height);
  });
  shCanvas.addEventListener('pointermove', (e) => { if (!drawingShape) return; const pt = canvasCoord(shCanvas, e), prev = rawPts[rawPts.length - 1]; rawPts.push(pt); shCtx.strokeStyle = '#FF1F7A'; shCtx.lineWidth = 4; shCtx.lineCap = 'round'; shCtx.beginPath(); shCtx.moveTo(prev.x, prev.y); shCtx.lineTo(pt.x, pt.y); shCtx.stroke(); });
  window.addEventListener('pointerup', () => { if (drawingShape) { drawingShape = false; snapGeometry(rawPts); } });
  document.getElementById('shape-clear-btn').addEventListener('click', () => { clearTimeout(presetTimer); prevLine = null; shCtx.clearRect(0, 0, shCanvas.width, shCanvas.height); document.querySelectorAll('.shape-preset-btn').forEach((x) => x.classList.remove('is-active')); shMsg.textContent = '自由手画线 / 箭头(带钩) / 三角 / 圆，或点击上方预设演示！'; });
  document.querySelectorAll('.shape-preset-btn').forEach((b) => b.addEventListener('click', () => {
    clearTimeout(presetTimer); prevLine = null;
    document.querySelectorAll('.shape-preset-btn').forEach((x) => x.classList.toggle('is-active', x === b));
    const k = b.dataset.shape, pts = [];
    if (k === 'line') {
      for (let i = 0; i <= 18; i++) pts.push({ x: 48 + i * 14, y: 112 + Math.sin(i * 0.9) * 14 });
    } else if (k === 'arrow') {
      for (let i = 0; i <= 14; i++) { const t = i / 14; pts.push({ x: 46 + t * 246, y: 156 - t * 92 + Math.sin(t * Math.PI * 3) * 14 }); }
      pts.push({ x: 274, y: 55 }, { x: 260, y: 50 });
    } else if (k === 'tri') {
      pts.push({ x: 180, y: 36 }, { x: 224, y: 108 }, { x: 262, y: 180 }, { x: 180, y: 184 }, { x: 98, y: 180 }, { x: 138, y: 108 }, { x: 178, y: 38 });
    } else {
      for (let a = 0; a <= Math.PI * 2 + 0.1; a += 0.25) pts.push({ x: 180 + Math.cos(a) * 72, y: 110 + Math.sin(a) * 68 });
    }
    shCtx.clearRect(0, 0, shCanvas.width, shCanvas.height); shCtx.strokeStyle = '#FF1F7A'; shCtx.lineWidth = 4; shCtx.lineCap = 'round';
    shCtx.beginPath(); pts.forEach((p, i) => i ? shCtx.lineTo(p.x, p.y) : shCtx.moveTo(p.x, p.y)); shCtx.stroke();
    presetTimer = setTimeout(() => snapGeometry(pts, k), 240);
  }));

  const erCanvas = document.getElementById('trial-eraser-canvas'), ectx = erCanvas.getContext('2d'), erMeter = document.getElementById('eraser-progress-label');
  const hlLayer = document.createElement('canvas'); hlLayer.width = erCanvas.width; hlLayer.height = erCanvas.height;
  const hctx = hlLayer.getContext('2d'); let erasing = false, erasedStrokes = 0;
  function renderEraserComposite(pt = null) {
    ectx.fillStyle = '#FFFDF7'; ectx.fillRect(0, 0, erCanvas.width, erCanvas.height);
    ectx.fillStyle = '#121116'; ectx.font = '800 28px NSans, sans-serif'; ectx.textAlign = 'center';
    ectx.fillText('黑墨字迹完好保留', erCanvas.width / 2, 82); ectx.font = '700 22px NSans, sans-serif'; ectx.fillText('考研重点二刷不伤正文', erCanvas.width / 2, 152);
    ectx.drawImage(hlLayer, 0, 0);
    if (pt) { ectx.strokeStyle = '#FF1F7A'; ectx.lineWidth = 3; ectx.beginPath(); ectx.arc(pt.x, pt.y, 18, 0, Math.PI * 2); ectx.stroke(); }
  }
  function resetHighlighter() {
    erasedStrokes = 0; hctx.clearRect(0, 0, hlLayer.width, hlLayer.height);
    hctx.fillStyle = 'rgba(255, 31, 122, 0.45)'; hctx.fillRect(36, 56, 288, 36);
    hctx.fillStyle = 'rgba(255, 198, 0, 0.55)'; hctx.fillRect(46, 126, 268, 36);
    erMeter.innerHTML = '已擦除荧光：<strong>0%</strong> · 底墨保留率：<strong>100%</strong>'; renderEraserComposite();
  }
  function eraseHighlighterAt(e) {
    const pt = canvasCoord(erCanvas, e); hctx.save(); hctx.globalCompositeOperation = 'destination-out';
    hctx.beginPath(); hctx.arc(pt.x, pt.y, 18, 0, Math.PI * 2); hctx.fill(); hctx.restore();
    erasedStrokes = Math.min(100, erasedStrokes + 4);
    erMeter.innerHTML = `已擦除荧光：<strong>${erasedStrokes}%</strong> · 底墨保留率：<strong>100%</strong>`; renderEraserComposite(pt);
  }
  erCanvas.addEventListener('pointerdown', (e) => { erasing = true; eraseHighlighterAt(e); });
  erCanvas.addEventListener('pointermove', (e) => { if (erasing) eraseHighlighterAt(e); });
  window.addEventListener('pointerup', () => { erasing = false; renderEraserComposite(); });
  document.getElementById('eraser-reset-btn').addEventListener('click', resetHighlighter); resetHighlighter();

  const tape = document.getElementById('draggable-tape'), tapePalette = ['#FF3B1D', '#1428FF', '#007F5F', '#FF1F7A'];
  let tapeColorIdx = 0, tapeDrag = false, tapeOffX = 0, tapeOffY = 0, tapeAng = -1.5;
  tape.addEventListener('pointerdown', (e) => { tapeDrag = true; tape.style.cursor = 'grabbing'; tape.setPointerCapture(e.pointerId); });
  tape.addEventListener('pointermove', (e) => { if (!tapeDrag) return; tapeOffX = Math.max(-40, Math.min(40, tapeOffX + e.movementX)); tapeOffY = Math.max(-16, Math.min(90, tapeOffY + e.movementY)); tape.style.transform = `translate(${tapeOffX}px, ${tapeOffY}px) rotate(${tapeAng}deg)`; });
  tape.addEventListener('pointerup', () => { tapeDrag = false; tape.style.cursor = 'grab'; });
  tape.addEventListener('dblclick', () => { tapeAng = tapeAng === -1.5 ? 2.5 : -1.5; tape.style.transform = `translate(${tapeOffX}px, ${tapeOffY}px) rotate(${tapeAng}deg)`; });
  document.getElementById('tape-color-btn').addEventListener('click', () => { tapeColorIdx = (tapeColorIdx + 1) % tapePalette.length; tape.style.background = tapePalette[tapeColorIdx]; });
  document.querySelectorAll('.todo-check-item').forEach((lbl) => {
    const inp = lbl.querySelector('input'); inp.addEventListener('change', () => { lbl.classList.toggle('is-checked', inp.checked); if (inp.checked) { const r = lbl.getBoundingClientRect(); spawnConfettiBurst(r.left + 26, r.top + 18, 16, '#DCFF00'); } });
  });

  /* ==================== 8. ACT 5: SPLIT READER + COMPILER + SEARCH JUMP + VAPOR ==================== */
  const spDivider = document.getElementById('split-divider'), spLeft = document.getElementById('split-left'), spPanes = document.getElementById('split-panes');
  let spDragging = false;
  spDivider.addEventListener('pointerdown', (e) => { spDragging = true; spDivider.setPointerCapture(e.pointerId); });
  window.addEventListener('pointermove', (e) => {
    if (!spDragging) return;
    const r = spPanes.getBoundingClientRect();
    const pct = Math.max(25, Math.min(72, ((e.clientX - r.left) / r.width) * 100));
    spLeft.style.width = `${pct.toFixed(1)}%`;
  });
  window.addEventListener('pointerup', () => { spDragging = false; });

  document.querySelectorAll('.note-jump-btn').forEach((b) => b.addEventListener('click', () => {
    document.querySelectorAll('.pdf-block').forEach((x) => x.classList.remove('is-hit'));
    document.getElementById(b.dataset.target).classList.add('is-hit');
  }));
  const compBox = document.getElementById('compile-progress-box');
  document.getElementById('compile-pdf-btn').addEventListener('click', () => {
    compBox.textContent = '[1/3] 抽取 P.3 & P.5 手写批注与来源页码...';
    setTimeout(() => { compBox.textContent = '[2/3] 重排可选 PDF 原文字层与高清晰插图...'; }, 320);
    setTimeout(() => { compBox.textContent = '[3/3] 导出成功！生成支持 Ctrl+F 搜索的讲义汇编 PDF ✓'; }, 680);
  });

  document.querySelectorAll('.occlusion-tile').forEach((b, i) => {
    const ans = i === 0 ? '= 1 ✓ 已掌握' : 'f(x) + C ✓'; const def = i === 0 ? '点击揭晓答案' : '点击揭晓推导';
    b.addEventListener('click', () => { const open = b.classList.toggle('is-revealed'); b.textContent = open ? ans : def; });
  });

  const sjReadout = document.getElementById('sj-readout');
  document.querySelectorAll('.sj-query-btn').forEach((b) => b.addEventListener('click', () => {
    document.querySelectorAll('.sj-query-btn').forEach((x) => x.classList.remove('is-on')); b.classList.add('is-on');
    sjReadout.textContent = `命中：${b.dataset.hit} · 原位置已钉书签`;
  }));
  document.getElementById('sj-return-btn').addEventListener('click', () => {
    sjReadout.textContent = '↩ 已瞬移回跳至刚才中断阅读页：P.04（滚动锚点无缝保留）！';
  });

  const vCanvas = document.getElementById('vapor-canvas'), vctx = vCanvas.getContext('2d');
  let vaporParticles = [], vaporMouse = { x: -999, y: -999 };
  function buildVaporWord(word) {
    const off = document.createElement('canvas'); off.width = vCanvas.width; off.height = vCanvas.height;
    const oc = off.getContext('2d'); oc.fillStyle = '#fff'; oc.font = '900 105px NSans, sans-serif';
    oc.textAlign = 'center'; oc.textBaseline = 'middle'; oc.fillText(word, off.width / 2, off.height / 2);
    const img = oc.getImageData(0, 0, off.width, off.height).data, nextPts = [], pals = ['#3BFFA8', '#00D1FF', '#FF1F7A', '#DCFF00', '#FFFDF7'];
    for (let y = 0; y < off.height; y += 7) for (let x = 0; x < off.width; x += 7) if (img[(y * off.width + x) * 4 + 3] > 120) {
      const prev = vaporParticles[nextPts.length];
      nextPts.push({ tx: x, ty: y, x: prev ? prev.x : Math.random() * off.width, y: prev ? prev.y : Math.random() * off.height, vx: (Math.random() - 0.5) * 14, vy: (Math.random() - 0.5) * 14, col: pals[nextPts.length % pals.length], r: 2.1 + (nextPts.length % 3) * 0.6 });
    }
    vaporParticles = nextPts;
  }
  vCanvas.addEventListener('pointermove', (e) => { vaporMouse = canvasCoord(vCanvas, e); });
  vCanvas.addEventListener('pointerleave', () => { vaporMouse = { x: -999, y: -999 }; });
  vCanvas.addEventListener('click', () => vaporParticles.forEach((p) => { p.vx += (Math.random() - 0.5) * 26; p.vy += (Math.random() - 0.5) * 22; }));
  (function animVapor() {
    vctx.fillStyle = 'rgba(5, 2, 11, 0.34)'; vctx.fillRect(0, 0, vCanvas.width, vCanvas.height);
    for (let i = 0; i < vaporParticles.length; i++) {
      const p = vaporParticles[i], dx = p.x - vaporMouse.x, dy = p.y - vaporMouse.y, d = Math.hypot(dx, dy);
      if (d < 62 && d > 1) { p.vx += (dx / d) * 4.5; p.vy += (dy / d) * 4.5; }
      p.vx = (p.vx + (p.tx - p.x) * 0.08) * 0.82; p.vy = (p.vy + (p.ty - p.y) * 0.08) * 0.82; p.x += p.vx; p.y += p.vy;
      vctx.fillStyle = p.col; vctx.beginPath(); vctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); vctx.fill();
    }
    requestAnimationFrame(animVapor);
  })();
  document.querySelectorAll('.vapor-word-btn').forEach((b) => b.addEventListener('click', () => {
    document.querySelectorAll('.vapor-word-btn').forEach((x) => x.classList.remove('is-active')); b.classList.add('is-active'); buildVaporWord(b.dataset.word);
  }));
  buildVaporWord('灵感爆发');

  /* ==================== 9. ACT 6: PORTED SCENE_*.FRAG WEBGL + JIANGHU ==================== */
  (function initSceneShadersWebGL() {
    if (!window.THREE) return;
    const canvas = document.getElementById('shader-webgl');
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: false });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
    const scene = new THREE.Scene(), camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

    const uniforms = {
      uTime: { value: 0 },
      uSceneIdx: { value: 0 }, // 0 aurora, 1 ink, 2 papercut, 3 chrome
      uTilt: { value: new THREE.Vector2(0, 0) },
      uTouch: { value: new THREE.Vector4(0.5, 0.5, 9.0, 0.0) },
      uRes: { value: new THREE.Vector2(520, 248) }
    };

    const mat = new THREE.ShaderMaterial({
      uniforms,
      vertexShader: `varying vec2 vUv; void main(){ vUv=uv; gl_Position=vec4(position,1.0); }`,
      fragmentShader: `
        uniform float uTime; uniform int uSceneIdx; uniform vec2 uTilt; uniform vec4 uTouch; uniform vec2 uRes; varying vec2 vUv;
        float hash21(vec2 p){ vec3 p3=fract(vec3(p.xyx)*0.1031); p3+=dot(p3,p3.yzx+33.33); return fract((p3.x+p3.y)*p3.z); }
        float noise(vec2 p){ vec2 i=floor(p),f=fract(p); f=f*f*(3.0-2.0*f); return mix(mix(hash21(i),hash21(i+vec2(1,0)),f.x),mix(hash21(i+vec2(0,1)),hash21(i+vec2(1,1)),f.x),f.y); }
        float fbm(vec2 p){ float v=0.0,a=0.5; for(int i=0;i<4;i++){ v+=a*noise(p); p=p*2.03+17.1; a*=0.5; } return v; }

        void main(){
          float aspect = uRes.x / max(1.0, uRes.y);
          vec2 p = vec2((vUv.x - 0.5) * aspect, vUv.y - 0.5);
          vec2 tp = vec2((uTouch.x - 0.5) * aspect, uTouch.y - 0.5);
          float age = uTouch.z;
          vec3 col = vec3(0.0);

          if(uSceneIdx == 0){
            // scene_aurora.frag Faithful Port
            float hor = -0.06;
            float ridge = 0.015 + pow(noise(vec2((p.x + uTilt.x * 0.14) * 3.0, 1.3)), 2.0) * 0.14;
            if(p.y >= hor){
              float n = fbm(vec2(p.x * 2.5 + uTime * 0.08 + uTilt.x * 0.25, p.y * 1.4 - uTime * 0.05));
              float cur = sin(p.x * 6.5 + n * 5.2 + uTime * 0.6) * 0.5 + 0.5;
              vec3 sky = mix(vec3(0.04, 0.08, 0.14), vec3(0.01, 0.02, 0.05), smoothstep(hor, 0.5, p.y));
              vec3 aur = mix(vec3(0.0, 0.9, 0.55), vec3(0.25, 0.45, 1.0), n) * pow(cur, 2.2) * smoothstep(hor, hor + 0.35, p.y) * 1.1;
              col = sky + aur;
              if(p.y - hor < ridge) col = vec3(0.02, 0.03, 0.04);
            } else {
              float d = length((p - tp) * vec2(1.0, 2.5));
              float wave = sin(d * 48.0 - age * 8.0) * exp(-age * 1.1) * exp(-d * 4.0) * uTouch.w;
              float n = fbm(vec2(p.x * 2.5 + wave * 0.3 + uTilt.x * 0.2, -p.y * 1.6 - uTime * 0.08));
              col = mix(vec3(0.02, 0.04, 0.08), vec3(0.04, 0.62, 0.46) * (0.4 + 0.6 * n), 0.55) + vec3(0.8, 1.0, 0.95) * abs(wave) * 0.35;
            }
          } else if(uSceneIdx == 1){
            // scene_ink.frag Faithful Port
            vec3 paper = vec3(0.93, 0.91, 0.88); col = paper;
            float sd = length(p - vec2(aspect * 0.26 - uTilt.x * 0.04, 0.25 + uTilt.y * 0.04));
            col = mix(col, vec3(0.84, 0.26, 0.18), smoothstep(0.085, 0.075, sd) * 0.88);
            for(int k=0;k<5;k++){
              float fk=float(k), df=fk/4.0;
              float x = (p.x + 1.0) * (1.4 + df * 1.6) + fk * 4.2 + uTilt.x * (0.04 + df * 0.24) + uTime * (0.01 + df * 0.02);
              float h = mix(0.24, -0.26, df) + (fbm(vec2(x, fk * 2.3)) - 0.48) * 0.32 + uTilt.y * 0.04 * df;
              float cov = smoothstep(-0.005, 0.005, h - p.y);
              float wash = exp(-max(h - p.y, 0.0) * 6.0);
              vec3 layer = mix(paper, mix(vec3(0.09,0.11,0.12), vec3(0.28,0.38,0.40), 0.35), (0.2 + 0.8 * df) * (0.35 + 0.65 * wash));
              col = mix(col, layer, cov);
            }
            if(uTouch.w > 0.01){
              float rad = 0.22 * (1.0 - exp(-age * 2.0));
              float bloom = smoothstep(rad, rad * 0.4, length(p - tp)) * exp(-age * 0.7) * uTouch.w;
              col = mix(col, vec3(0.10, 0.12, 0.14), bloom * 0.55);
            }
          } else if(uSceneIdx == 2){
            // scene_papercut.frag Faithful Port
            vec3 light = vec3(0.98, 0.75, 0.58), mid = vec3(0.62, 0.40, 0.52), deep = vec3(0.14, 0.16, 0.32);
            col = mix(light, vec3(0.99, 0.86, 0.68), smoothstep(-0.2, 0.5, p.y));
            float sunD = length(p - vec2(-aspect * 0.22 + uTilt.x * 0.03, 0.20 + uTilt.y * 0.03));
            if(sunD < 0.17) col = mix(light, vec3(1.0, 0.95, 0.84), smoothstep(0.17, 0.06, sunD));
            for(int k=0;k<5;k++){
              float fk=float(k), df=fk/4.0;
              float x = p.x + uTilt.x * mix(0.02, 0.22, df);
              float pop = uTouch.w * exp(-age * 0.9) * exp(-pow((x - tp.x) * 3.0, 2.0)) * (0.5 + 0.5 * cos(age * 7.0 - df * 3.0)) * 0.09;
              float h = mix(0.14, -0.35, df) + 0.07 * sin(x * (2.5 + fk) + fk + uTime * 0.4) + pop;
              float cov = smoothstep(-0.004, 0.004, h - p.y);
              vec3 c = df < 0.5 ? mix(light * 0.95, mid, df * 2.0) : mix(mid, deep, df * 2.0 - 1.0);
              col = mix(col, c, cov);
            }
          } else {
            // scene_chrome.frag Studio Metallic Metaballs Port
            col = mix(vec3(0.80, 0.82, 0.86), vec3(0.94, 0.95, 0.97), smoothstep(-0.5, 0.5, p.y));
            for(int i=0;i<5;i++){
              float fi=float(i);
              vec2 cPos = vec2(sin(uTime * 0.6 + fi * 1.4) * 0.55 + uTilt.x * 0.08, cos(uTime * 0.5 + fi * 2.1) * 0.16 + uTilt.y * 0.06);
              float rad = 0.13 + mod(fi, 2.0) * 0.06;
              float d = length(p - cPos);
              if(d < rad){
                float nz = sqrt(max(0.0, 1.0 - (d / rad) * (d / rad)));
                vec3 norm = normalize(vec3((p - cPos) / rad, nz));
                vec3 film = 0.5 + 0.5 * cos(6.2832 * (vec3(0.0, 0.33, 0.67) + nz * 0.8));
                float spec = pow(max(0.0, dot(norm, normalize(vec3(-0.3, 0.6, 0.9)))), 36.0);
                col = mix(vec3(0.35, 0.38, 0.44), film * 0.95, 0.45) + vec3(spec * 0.95);
              }
            }
          }
          gl_FragColor = vec4(clamp(col, 0.0, 1.0), 1.0);
        }
      `
    });
    const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), mat); scene.add(quad);

    const gStage = document.getElementById('gravity-stage'), gDot = document.getElementById('gravity-dot');
    const lblEl = document.getElementById('shader-hero-label');
    const SHADER_META = {
      aurora:   { id: 0, lbl: 'AURORA 极光湖 (scene_aurora.frag 实时运行) · 点湖面激起水波' },
      ink:      { id: 1, lbl: 'INK 水墨山 (scene_ink.frag 实时运行) · 晃动视差 + 点击滴墨晕染' },
      papercut: { id: 2, lbl: 'PAPERCUT 立体剪纸 (scene_papercut.frag 实时运行) · 点击层叠弹出' },
      chrome:   { id: 3, lbl: 'CHROME 液态金属 (scene_chrome.frag 实时运行) · 高光流体金属珠' }
    };
    gStage.addEventListener('pointermove', (e) => {
      const r = gStage.getBoundingClientRect();
      const nx = ((e.clientX - r.left) / r.width - 0.5) * 2, ny = ((e.clientY - r.top) / r.height - 0.5) * 2;
      gDot.style.transform = `translate(${nx * 14}px, ${ny * 14}px)`;
      uniforms.uTilt.value.set(nx, ny);
    });
    gStage.addEventListener('pointerleave', () => { gDot.style.transform = ''; uniforms.uTilt.value.set(0, 0); });
    canvas.addEventListener('pointerdown', (e) => {
      const r = canvas.getBoundingClientRect();
      uniforms.uTouch.value.set((e.clientX - r.left) / r.width, 1.0 - (e.clientY - r.top) / r.height, 0.0, 1.0);
    });
    document.querySelectorAll('.shader-pick').forEach((b) => b.addEventListener('click', () => {
      document.querySelectorAll('.shader-pick').forEach((x) => x.classList.remove('is-active')); b.classList.add('is-active');
      const m = SHADER_META[b.dataset.sh]; uniforms.uSceneIdx.value = m.id; lblEl.textContent = m.lbl;
    }));

    function fitSh() { const w = canvas.clientWidth, h = canvas.clientHeight; if (!w || !h) return; renderer.setSize(w, h, false); uniforms.uRes.value.set(w, h); }
    fitSh(); window.addEventListener('resize', fitSh);
    let visSh = true; new IntersectionObserver((es) => { visSh = es[0].isIntersecting; }).observe(canvas);
    let lastT = 0;
    (function tickSh(now) {
      requestAnimationFrame(tickSh); if (!visSh) return;
      const dt = Math.min(0.05, (now - lastT) * 0.001 || 0.016); lastT = now;
      uniforms.uTime.value = now * 0.001; uniforms.uTouch.value.z += dt;
      renderer.render(scene, camera);
    })(0);
  })();

  const JIANGHU = [
    { main: './assets/jh_03.png', seal: './assets/jh_03_gold.png', cap: '<strong>场景 03 · 白衣少年：</strong>鎏金瘦金体「平地起白虹」伴指尖微移漂过（Android 全量与本地 IPA 同享 27 景字图，原字体软件不随包）。' },
    { main: './assets/jh_08.png', seal: '', cap: '<strong>场景 08 · 墨影红眸：</strong>泼墨留白搭配暗红瞳色高光，写倦了专业课随手切换一声剑鸣意象。' },
    { main: './assets/jh_13.png', seal: '', cap: '<strong>场景 13 · 孤舟寒江：</strong>寂静远山与一叶孤舟伴指尖呼吸起伏，给长篇复盘静下心来。' },
    { main: './assets/jh_14.png', seal: '', cap: '<strong>场景 14 · 铁甲策马：</strong>霜天万里的苍茫飞白墨迹铺满背板，60–120Hz 轻量着色省电顺滑。' }
  ];
  const jhFrame = document.getElementById('jianghu-frame'), jhMain = document.getElementById('jianghu-main-img'), jhSeal = document.getElementById('jianghu-seal-img'), jhCap = document.getElementById('jianghu-caption');
  jhFrame.addEventListener('pointermove', (e) => {
    const r = jhFrame.getBoundingClientRect(); if (jhSeal) jhSeal.style.transform = `translate(${((e.clientX - r.left) / r.width - 0.5) * 24}px, ${((e.clientY - r.top) / r.height - 0.5) * 16}px)`;
  });
  jhFrame.addEventListener('pointerleave', () => { if (jhSeal) jhSeal.style.transform = ''; });
  document.querySelectorAll('.jianghu-tab').forEach((b) => b.addEventListener('click', () => {
    document.querySelectorAll('.jianghu-tab').forEach((x) => x.classList.remove('is-active')); b.classList.add('is-active');
    const d = JIANGHU[parseInt(b.dataset.jh, 10)]; jhMain.src = d.main; jhSeal.style.display = d.seal ? 'block' : 'none'; jhCap.innerHTML = d.cap;
  }));

  /* ==================== 10. ACT 7 PLAYABLE PERSONAS, 300% ZOOM, 2-DEVICE RULE & CHECKSUM ==================== */
  const PERSONAS = [
    { badge: 'PERSONA 01 · 原卷多轮刷题，二刷改标绝不伤字', title: '一轮画重点，二轮一键抹荧光 + 遮挡卡通勤背公式', items: ['导入真题 PDF 原卷，一轮用黄荧光画重点，二轮开 Android「仅擦荧光」秒抹旧标记，打印墨迹稳如泰山。', '给易错推导题直接盖上「数字遮挡块」，地铁掏出手机点按揭晓，三态自测「未掌握 / 已掌握」。'], img: './assets/tut_marker_eraser.png' },
    { badge: 'PERSONA 02 · 左论文右批注，一键吐出可搜讲义', title: '外文双栏文献再也不用裁得支离破碎', items: ['横版英文 Paper 与 PPT 按原生尺寸完整导入，打开并排模式边看文献边写推导。', '右侧拉出「批注与摘录」抽屉点「回原文」复盘，结课按标签一键汇编带页码和可选文字层的新 PDF！'], img: './assets/workspace.png' },
    { badge: 'PERSONA 03 · 每天换着法子写一本高颜值日记', title: '360° 私人独立出版 + 个人 TTF 字库 + 水墨画境', items: ['自己设计正面、竖排书脊和封底徽标，点开素白封皮先欣赏一遍 22 颗 3D 水滴绽放。', '导入心爱的个人书法 TTF 字体，配水彩毛笔与花边纸胶带贴纸，背景随时切换 27 重水墨！'], img: './assets/sticker_ui.png' },
    { badge: 'PERSONA 04 · 切断云端依赖，资产安放自己兜里', title: '高铁飞行模式全速跑识别，ZIP 双重哈希永不毁稿', items: ['断网照样跑后台队列识字（Android 随包识字 / Apple Vision 本机运行），毫秒全文搜出半年前随手写下的句子。', '支持单账号两台常用设备离线许可互备，所有打包先校 ZIP CRC-32 与 SHA-256 哈希和字节大小。'], img: './assets/tut_search.png' }
  ];
  let curPersonaIdx = 0;
  document.querySelectorAll('.persona-tab').forEach((b) => b.addEventListener('click', () => {
    document.querySelectorAll('.persona-tab').forEach((x) => x.classList.remove('is-active')); b.classList.add('is-active');
    curPersonaIdx = parseInt(b.dataset.persona, 10); const d = PERSONAS[curPersonaIdx];
    document.getElementById('p-badge').textContent = d.badge; document.getElementById('p-title').textContent = d.title;
    document.getElementById('p-list').innerHTML = d.items.map((x) => `<li>${x}</li>`).join(''); document.getElementById('p-img').src = d.img;
    if (window.gsap) gsap.fromTo('#persona-panel', { opacity: 0.4, y: 12 }, { opacity: 1, y: 0, duration: 0.35, ease: 'power2.out' });
  }));
  document.getElementById('persona-zoom-btn').addEventListener('click', () => { const d = PERSONAS[curPersonaIdx]; openLightbox(d.img, d.title, d.items.join(' ')); });

  const zoomStage = document.getElementById('zoom-toy-stage');
  document.getElementById('btn-zoom-300').addEventListener('click', () => zoomStage.classList.add('is-zoomed'));
  document.getElementById('btn-zoom-100').addEventListener('click', () => zoomStage.classList.remove('is-zoomed'));

  const devSlot2 = document.getElementById('dev-slot-2'), verifyEl = document.getElementById('verify-readout');
  document.getElementById('btn-swap-dev').addEventListener('click', () => {
    const sw = devSlot2.textContent.includes('MatePad');
    devSlot2.textContent = sw ? '📱 小米 14 (已安全替换)' : '📱 MatePad 11';
    verifyEl.textContent = '单账号两设备校验：选择替换后离线许可重新签发，笔记零销毁 ✓';
  });
  document.getElementById('btn-sim-verify').addEventListener('click', () => {
    verifyEl.textContent = '1/3 CHECKING BYTE LENGTH...';
    setTimeout(() => { verifyEl.textContent = '2/3 ZIP CRC-32 PASS [0x8F4A21B9]...'; }, 260);
    setTimeout(() => { verifyEl.textContent = '3/3 SHA-256 MATCH · 原稿完好安全 ✓'; }, 580);
  });

  const toastEl = document.getElementById('pro-toast-banner'); let toastTimer = null;
  document.getElementById('trigger-celebration-btn').addEventListener('click', () => {
    fireScreenCelebration(); toastEl.classList.add('is-visible');
    clearTimeout(toastTimer); toastTimer = setTimeout(() => toastEl.classList.remove('is-visible'), 3600);
  });
  document.getElementById('finale-fireworks-btn').addEventListener('click', fireScreenCelebration);
  document.getElementById('back-top-btn').addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
})();
