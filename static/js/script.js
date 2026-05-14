(function () {
  const bar = document.getElementById('progressBar');
  if (!bar) return;
  window.addEventListener('scroll', () => {
    const pct = window.scrollY / (document.documentElement.scrollHeight - window.innerHeight);
    bar.style.width = Math.min(pct * 100, 100) + '%';
  }, { passive: true });
})();

// Anonymous engagement tracking
(function () {
  const endpoint = '/track-section';

  window.trackEvent = function (eventType, target, metadata) {
    if (!eventType || !target || !window.fetch) return;

    try {
      fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        keepalive: true,
        body: JSON.stringify({
          event_type: eventType,
          target: target,
          page: window.location.pathname,
          metadata: metadata || {}
        })
      }).catch(() => {});
    } catch (err) {
      // Analytics must never block the page experience.
    }
  };
})();



//Fade-in Sections 
(function () {
  const obs = new IntersectionObserver((entries) => {
    entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible'); });
  }, { threshold: 0.08 });

  document.querySelectorAll('.fade-in-section').forEach(el => obs.observe(el));
})();
// Track section views once per page load
(function () {
  if (!('IntersectionObserver' in window) || !window.trackEvent) return;

  const seen = new Set();
  const obs = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting || !entry.target.id || seen.has(entry.target.id)) return;
      seen.add(entry.target.id);
      window.trackEvent('section_view', entry.target.id, {
        visible_ratio: Number(entry.intersectionRatio.toFixed(2))
      });
    });
  }, { threshold: 0.45 });

  document.querySelectorAll('main section[id], header[id]').forEach(el => obs.observe(el));
})();




// Human health organ selector
(function () {
  const explorer = document.querySelector('[data-health-explorer]');
  if (!explorer) return;

  const buttons = [...explorer.querySelectorAll('.organ-option')];
  const panel = document.getElementById('organ-detail-panel');
  const title = document.getElementById('organPanelTitle');
  const year = document.getElementById('organPanelYear');
  const evidence = document.getElementById('organPanelEvidence');
  const detected = document.getElementById('organPanelDetected');
  const suggests = document.getElementById('organPanelSuggests');
  const caveat = document.getElementById('organPanelCaveat');

  if (!buttons.length || !panel || !title || !year || !evidence || !detected || !suggests || !caveat) return;

  function selectOrgan(button, shouldTrack) {
    buttons.forEach(btn => {
      const active = btn === button;
      btn.classList.toggle('active', active);
      btn.setAttribute('aria-selected', active ? 'true' : 'false');
      btn.tabIndex = active ? 0 : -1;
    });

    panel.setAttribute('aria-labelledby', button.id);
    title.textContent = button.dataset.title;
    year.textContent = button.dataset.year;
    evidence.textContent = button.dataset.evidence;
    detected.textContent = button.dataset.detected;
    suggests.textContent = button.dataset.suggests;
    caveat.textContent = button.dataset.caveat;

    if (shouldTrack && window.trackEvent) {
      window.trackEvent('organ_select', button.dataset.organ, {
        title: button.dataset.title,
        evidence: button.dataset.evidence
      });
    }
  }

  buttons.forEach((button, index) => {
    button.tabIndex = button.classList.contains('active') ? 0 : -1;

    button.addEventListener('click', () => selectOrgan(button, true));
    button.addEventListener('keydown', event => {
      const current = buttons.indexOf(button);
      let next = current;

      if (event.key === 'ArrowDown' || event.key === 'ArrowRight') next = (current + 1) % buttons.length;
      else if (event.key === 'ArrowUp' || event.key === 'ArrowLeft') next = (current - 1 + buttons.length) % buttons.length;
      else if (event.key === 'Home') next = 0;
      else if (event.key === 'End') next = buttons.length - 1;
      else return;

      event.preventDefault();
      buttons[next].focus();
      selectOrgan(buttons[next], true);
    });
  });

  selectOrgan(buttons.find(btn => btn.classList.contains('active')) || buttons[0], false);
})();

// Consequence evidence selector
(function () {
  const explorer = document.querySelector('[data-risk-explorer]');
  if (!explorer) return;

  const tabs = [...explorer.querySelectorAll('.risk-tab')];
  const panel = document.getElementById('risk-detail-panel');
  const title = document.getElementById('riskPanelTitle');
  const strength = document.getElementById('riskPanelStrength');
  const source = document.getElementById('riskPanelSource');
  const main = document.getElementById('riskPanelMain');
  const detail = document.getElementById('riskPanelDetail');

  if (!tabs.length || !panel || !title || !strength || !source || !main || !detail) return;

  function selectRisk(tab, shouldTrack) {
    tabs.forEach(item => {
      const active = item === tab;
      item.classList.toggle('active', active);
      item.setAttribute('aria-selected', active ? 'true' : 'false');
      item.tabIndex = active ? 0 : -1;
    });

    panel.setAttribute('aria-labelledby', tab.id);
    title.textContent = tab.dataset.title;
    strength.textContent = tab.dataset.strength;
    source.textContent = tab.dataset.source;
    main.textContent = tab.dataset.main;
    detail.textContent = tab.dataset.detail;

    if (shouldTrack && window.trackEvent) {
      window.trackEvent('risk_select', tab.dataset.risk, {
        title: tab.dataset.title,
        strength: tab.dataset.strength
      });
    }
  }

  tabs.forEach(tab => {
    tab.tabIndex = tab.classList.contains('active') ? 0 : -1;

    tab.addEventListener('click', () => selectRisk(tab, true));
    tab.addEventListener('keydown', event => {
      const current = tabs.indexOf(tab);
      let next = current;

      if (event.key === 'ArrowDown' || event.key === 'ArrowRight') next = (current + 1) % tabs.length;
      else if (event.key === 'ArrowUp' || event.key === 'ArrowLeft') next = (current - 1 + tabs.length) % tabs.length;
      else if (event.key === 'Home') next = 0;
      else if (event.key === 'End') next = tabs.length - 1;
      else return;

      event.preventDefault();
      tabs[next].focus();
      selectRisk(tabs[next], true);
    });
  });

  selectRisk(tabs.find(tab => tab.classList.contains('active')) || tabs[0], false);
})();

// Recycling quiz interaction
(function () {
  const guessValue = document.getElementById('guessValue');
  const revealBtn = document.getElementById('recyclingRevealBtn');
  const revealPanel = document.getElementById('revealPanel');
  const chart = document.getElementById('recyclingChart');
  const centerLabel = document.getElementById('chartCenterLabel');

  if (!guessValue || !revealBtn || !revealPanel || !chart || !centerLabel) return;

  const ctx = chart.getContext('2d');
  const fateSegments = [
    { label: 'Recycled', value: 9.3, color: 'rgba(0,255,204,0.95)' },
    { label: 'Incinerated', value: 19, color: 'rgba(255,193,7,0.95)' },
    { label: 'Mismanaged', value: 22.5, color: 'rgba(255,99,71,0.95)' },
    { label: 'Landfilled', value: 49.2, color: 'rgba(255,140,0,0.95)' }
  ];
  const actualPercent = fateSegments[0].value;
  const lineWidth = 25;
  let isDragging = false;
  let guessPercent = 50;

  function drawChart(showAnswer) {
    const width = chart.width;
    const height = chart.height;
    const radius = Math.min(width, height) / 2 - lineWidth;
    const centerX = width / 2;
    const centerY = height / 2;

    ctx.clearRect(0, 0, width, height);
    ctx.lineCap = 'round';

    // Base ring
    ctx.beginPath();
    ctx.strokeStyle = 'rgba(255,255,255,0.12)';
    ctx.lineWidth = lineWidth;
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.stroke();

    if (showAnswer) {
      let startAngle = -Math.PI / 2;
      fateSegments.forEach(segment => {
        const endAngle = startAngle + (segment.value / 100) * Math.PI * 2;
        ctx.beginPath();
        ctx.strokeStyle = segment.color;
        ctx.arc(centerX, centerY, radius, startAngle, endAngle);
        ctx.stroke();
        startAngle = endAngle;
      });
      centerLabel.classList.remove("animate");
      void centerLabel.offsetWidth;
      centerLabel.textContent = `${actualPercent}%`;
      centerLabel.classList.add("animate");
    } else {
      const endAngle = (-Math.PI / 2) + (guessPercent / 100) * Math.PI * 2;

      ctx.beginPath();
      ctx.strokeStyle = 'rgba(0,212,255,0.5)';
      ctx.arc(centerX, centerY, radius, -Math.PI / 2, endAngle);
      ctx.stroke();

      const pointerX = centerX + Math.cos(endAngle) * radius;
      const pointerY = centerY + Math.sin(endAngle) * radius;
      ctx.beginPath();
      ctx.fillStyle = 'rgba(0,212,255,1)';
      ctx.arc(pointerX, pointerY, 7, 0, Math.PI * 2);
      ctx.fill();

      centerLabel.textContent = '?';
    }
  }

  function updateGuess() {
    guessValue.textContent = guessPercent;
    if (!revealPanel.classList.contains('shown')) {
      drawChart(false);
    }
  }

  function pointerEventToPercent(event) {
    const rect = chart.getBoundingClientRect();
    const x = event.clientX - rect.left - rect.width / 2;
    const y = event.clientY - rect.top - rect.height / 2;
    let angle = Math.atan2(y, x);
    angle = angle < -Math.PI / 2 ? angle + Math.PI * 2 : angle;
    const percent = ((angle + Math.PI / 2) / (Math.PI * 2)) * 100;
    return Math.min(100, Math.max(1, Math.round(percent)));
  }

  function setGuessFromPointer(event) {
    guessPercent = pointerEventToPercent(event);
    updateGuess();
  }

  chart.addEventListener('pointerdown', event => {
    if (event.pointerType === 'mouse' && event.button !== 0) return;
    isDragging = true;
    chart.setPointerCapture(event.pointerId);
    setGuessFromPointer(event);
  });

  chart.addEventListener('pointermove', event => {
    if (!isDragging) return;
    setGuessFromPointer(event);
  });

  chart.addEventListener('pointerup', event => {
    if (!isDragging) return;
    isDragging = false;
    chart.releasePointerCapture(event.pointerId);
  });

  chart.addEventListener('pointerleave', () => {
    isDragging = false;
  });

  chart.addEventListener('pointercancel', () => {
    isDragging = false;
  });

  chart.addEventListener('click', setGuessFromPointer);

  function animateReveal() {
    const duration = 1000;
    let startTime = null;

    function step(timestamp) {
      if (!startTime) startTime = timestamp;
      const elapsed = timestamp - startTime;
      const progress = Math.min(elapsed / duration, 1);
      let drawProgress = progress;

      const width = chart.width;
      const height = chart.height;
      const radius = Math.min(width, height) / 2 - lineWidth;
      const centerX = width / 2;
      const centerY = height / 2;

      ctx.clearRect(0, 0, width, height);
      ctx.lineCap = 'round';

      ctx.beginPath();
      ctx.strokeStyle = 'rgba(255,255,255,0.12)';
      ctx.lineWidth = lineWidth;
      ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
      ctx.stroke();

      const fullAngle = Math.PI * 2 * drawProgress;
      let startAngle = -Math.PI / 2;
      let remaining = fullAngle;

      fateSegments.forEach(segment => {
        const segmentAngle = (segment.value / 100) * Math.PI * 2;
        const drawAngle = Math.min(segmentAngle, remaining);
        if (drawAngle > 0) {
          ctx.beginPath();
          ctx.strokeStyle = segment.color;
          ctx.arc(centerX, centerY, radius, startAngle, startAngle + drawAngle);
          ctx.stroke();
          remaining -= drawAngle;
        }
        startAngle += segmentAngle;
      });

      if (progress < 1) {
        requestAnimationFrame(step);
      } else {
        drawChart(true);
      }
    }

    requestAnimationFrame(step);
  }

  revealBtn.addEventListener('click', () => {
    revealPanel.classList.add('shown');
    animateReveal();
    revealBtn.disabled = true;
    // Track recycling quiz reveal
    if (window.trackEvent) {
      window.trackEvent('quiz_reveal', 'recycling_quiz', {
        user_guess: guessPercent,
        actual_answer: actualPercent,
        accuracy_difference: Math.abs(guessPercent - actualPercent)
      });
    }
  });

  window.addEventListener('resize', () => drawChart(revealPanel.classList.contains('shown')));

  updateGuess();
  drawChart(false);
})();

// Pledge form interaction
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

    if (window.fetch) {
      fetch('/submit-pledge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ name })
      })
        .then(response => response.ok ? response.json() : null)
        .then(data => {
          if (data && typeof data.pledges !== 'undefined' && counter) {
            counter.textContent = data.pledges;
          }
        })
        .catch(() => {});
    }


    // Show card
    nameOut.textContent = name;
    dateOut.textContent = new Date().toLocaleDateString('en-GB', {
      day: 'numeric', month: 'long', year: 'numeric'
    });

    // Swap panels
    box.style.display = 'none';
    success.classList.add('shown');
    success.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  });
})();

// Contact form interaction tracking
(function () {
  const form = document.querySelector('.contact-form');
  if (!form) return;

  let formInteraction = false;
  const inputs = form.querySelectorAll('input, textarea');

})();
