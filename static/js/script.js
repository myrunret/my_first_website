// ── Progress Bar 
(function () {
  const bar = document.getElementById('progressBar');
  if (!bar) return;
  window.addEventListener('scroll', () => {
    const pct = window.scrollY / (document.documentElement.scrollHeight - window.innerHeight);
    bar.style.width = Math.min(pct * 100, 100) + '%';
  }, { passive: true });
})();


// ── Fade-in Sections 
(function () {
  const obs = new IntersectionObserver((entries) => {
    entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible'); });
  }, { threshold: 0.08 });

  document.querySelectorAll('.fade-in-section').forEach(el => obs.observe(el));
})();


// ── In-page section nav (highlights current section)
(function () {
  const nav = document.querySelector('.in-page-nav');
  if (!nav) return;

  const links = [...nav.querySelectorAll('a[href^="#"]')];
  if (!links.length) return;

  const sections = links
    .map(a => document.querySelector(a.getAttribute('href')))
    .filter(Boolean);
  if (!sections.length) return;

  function pickActive() {
    const marker = window.innerHeight * 0.22;
    let active = sections[0];
    for (const s of sections) {
      if (s.getBoundingClientRect().top <= marker) active = s;
    }
    const id = active.id;
    links.forEach(a => {
      if (a.getAttribute('href') === '#' + id) a.setAttribute('aria-current', 'true');
      else a.removeAttribute('aria-current');
    });
  }

  window.addEventListener('scroll', pickActive, { passive: true });
  window.addEventListener('resize', pickActive, { passive: true });
  pickActive();
})();


// ── Size Comparison Slider
(function () {
  const slider = document.getElementById('sizeRange');
  if (!slider) return;

  const stages = document.querySelectorAll('.size-stage');

  function update() {
    const idx = parseInt(slider.value);
    stages.forEach((s, i) => s.classList.toggle('active', i === idx));
  }

  slider.addEventListener('input', update);
  update();
})();


// ── Recycling Pie Chart Guesser 
(function () {
  const canvas  = document.getElementById('recyclingChart');
  if (!canvas) return;

  const ctx     = canvas.getContext('2d');
  const slider  = document.getElementById('recyclingSlider');
  const display = document.getElementById('guessValue');
  const btn     = document.getElementById('recyclingRevealBtn');
  const panel   = document.getElementById('revealPanel');
  const center  = document.getElementById('chartCenterLabel');

  // Canvas is 240×240
  const W = canvas.width, H = canvas.height;
  const cx = W / 2, cy = H / 2;
  const R = W * 0.44;   // outer radius
  const r = W * 0.26;   // inner (donut hole)

  const COL = {
    guess:    '#00d4ff',
    rest:     'rgba(0,212,255,0.07)',
    recycled: '#00ffcc',
    burn:     '#ff9820',
    landfill: '#162840',
  };

  let revealed = false;

  function drawArc(startDeg, endDeg, color) {
    const s = (startDeg - 90) * Math.PI / 180;
    const e = (endDeg   - 90) * Math.PI / 180;
    ctx.beginPath();
    ctx.moveTo(cx + r * Math.cos(s), cy + r * Math.sin(s));
    ctx.arc(cx, cy, R, s, e);
    ctx.arc(cx, cy, r, e, s, true);
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();
  }

  function drawGuess(pct) {
    ctx.clearRect(0, 0, W, H);
    const deg = pct * 3.6;
    drawArc(0, deg, COL.guess);
    drawArc(deg, 360, COL.rest);
  }

  function drawRevealed(progress) {
    const p = Math.min(progress, 1);
    ctx.clearRect(0, 0, W, H);
    const R_DEG  = 9  * 3.6 * p;
    const B_DEG  = 12 * 3.6 * p;
    const L_DEG  = 79 * 3.6 * p;

    drawArc(0,               R_DEG,                    COL.recycled);
    drawArc(R_DEG,           R_DEG + B_DEG,            COL.burn);
    drawArc(R_DEG + B_DEG,   R_DEG + B_DEG + L_DEG,   COL.landfill);

    if (p < 1) {
      drawArc(360 * p, 360, COL.rest);
    }
  }

  // Initial state
  drawGuess(50);

  slider.addEventListener('input', () => {
    if (revealed) return;
    const v = parseInt(slider.value);
    display.textContent = v;
    drawGuess(v);
  });

  btn.addEventListener('click', () => {
    if (revealed) return;
    revealed = true;
    btn.disabled = true;
    btn.textContent = '↓ See the breakdown below';
    center.textContent = '9%';
    center.classList.add('revealed');

    const dur = 1300;
    const t0  = performance.now();

    (function tick(now) {
      const raw    = (now - t0) / dur;
      const eased  = 1 - Math.pow(1 - Math.min(raw, 1), 3);
      drawRevealed(eased);
      if (raw < 1) requestAnimationFrame(tick);
      else {
        drawRevealed(1);
        panel.classList.add('shown');
        panel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    })(t0);
  });
})();


// ── Production Scroll Timeline 
(function () {
  const yearEl  = document.getElementById('timelineYear');
  const valEl   = document.getElementById('timelineValue');
  const barFill = document.getElementById('timelineBarFill');
  const section = document.getElementById('production');
  const ticks   = document.querySelectorAll('.tick-item');

  if (!yearEl || !section || typeof window.plasticData === 'undefined') return;

  const data   = window.plasticData;
  const minVal = data[0].value;
  const maxVal = data[data.length - 1].value;

  function fmt(n) {
    if (n >= 1_000_000_000) return (n / 1_000_000_000).toFixed(1) + 'B';
    if (n >= 1_000_000)     return Math.round(n / 1_000_000) + 'M';
    if (n >= 1_000)         return Math.round(n / 1_000) + 'K';
    return n.toLocaleString();
  }

  let lastIdx = -1;

  function update() {
    const rect    = section.getBoundingClientRect();
    const visible = -rect.top / (rect.height - window.innerHeight);
    const scrolled = Math.max(0, Math.min(1, visible));
    const idx     = Math.min(Math.floor(scrolled * (data.length - 1)), data.length - 1);

    if (idx === lastIdx) return;
    lastIdx = idx;

    const entry  = data[idx];
    const barPct = ((entry.value - minVal) / (maxVal - minVal)) * 100;

    yearEl.textContent  = entry.year;
    valEl.textContent   = fmt(entry.value);
    barFill.style.width = barPct + '%';

    // Shift year colour cyan → red with production growth
    const hue = Math.round(180 - (barPct / 100) * 180);
    yearEl.style.color = `hsl(${hue}, 100%, 65%)`;

    ticks.forEach(t => {
      const y = parseInt(t.dataset.year);
      t.classList.toggle('active', y === entry.year);
      t.classList.toggle('past',   y <  entry.year);
    });
  }

  window.addEventListener('scroll', update, { passive: true });
  update();
})();


// ── Pledge ───────────────────────────────────────────────────────
(function () {
  const input   = document.getElementById('pledgeName');
  const btn     = document.getElementById('pledgeBtn');
  const box     = document.getElementById('pledgeBox');
  const success = document.getElementById('pledgeSuccess');
  const nameOut = document.getElementById('pledgeCardName');
  const dateOut = document.getElementById('pledgeCardDate');
  const counter = document.getElementById('pledgeCount');

  if (!input) return;

  // Enable button only when name is typed
  input.addEventListener('input', () => {
    btn.disabled = input.value.trim().length === 0;
  });

  // Handle Enter key
  input.addEventListener('keydown', e => {
    if (e.key === 'Enter' && !btn.disabled) btn.click();
  });

  btn.addEventListener('click', () => {
    const name = input.value.trim();
    if (!name) return;

    // Persist locally
    const pledges = JSON.parse(localStorage.getItem('microacting_pledges') || '[]');
    if (!pledges.includes(name.toLowerCase())) {
      pledges.push(name.toLowerCase());
      localStorage.setItem('microacting_pledges', JSON.stringify(pledges));
    }

    // Show card
    nameOut.textContent = name;
    dateOut.textContent = new Date().toLocaleDateString('en-GB', {
      day: 'numeric', month: 'long', year: 'numeric'
    });

    // Fake community counter (replace with real API if you build one)
    const seed    = pledges.length + 1247;
    counter.textContent = seed.toLocaleString();

    // Swap panels
    box.style.display = 'none';
    success.classList.add('shown');
    success.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  });
})();
