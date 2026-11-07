(() => {
  const root = document.documentElement;
  const preference = matchMedia('(prefers-color-scheme: dark)');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const roles = ['background', 'surface', 'text', 'secondary-text', 'border', 'action', 'on-action', 'focus', 'highlight'];
  let choice, frame = null, ready = false;
  try { choice = localStorage.getItem('aoc-theme'); } catch {}
  if (choice !== 'light' && choice !== 'dark') choice = null;
  const current = () => choice || (preference.matches ? 'dark' : 'light');
  const channels = value => {
    const hex = /^#([0-9a-f]{6})$/i.exec(value.trim());
    if (hex) return [0, 2, 4].map(offset => parseInt(hex[1].slice(offset, offset + 2), 16));
    const rgb = /^rgba?\(\s*([\d.]+)[, ]+([\d.]+)[, ]+([\d.]+)/.exec(value.trim());
    return rgb ? rgb.slice(1).map(Number) : null;
  };
  function stop() {
    if (frame !== null) cancelAnimationFrame(frame);
    frame = null;
  }
  function settle() {
    stop();
    for (const role of roles) root.style.removeProperty(`--${role}`);
    root.dataset.themeTransition = 'false';
  }
  function apply() {
    const mode = current();
    const changed = root.dataset.theme !== mode;
    const toggle = document.querySelector('.theme-toggle');
    if (toggle) toggle.setAttribute('aria-pressed', String(mode === 'dark'));
    if (!changed) return;
    const animate = changed && ready && !reduced.matches && typeof requestAnimationFrame === 'function';
    // Read the colours actually on screen, including an interrupted blend.
    const fromStyle = animate ? getComputedStyle(root) : null;
    const from = fromStyle && roles.map(role => channels(fromStyle.getPropertyValue(`--${role}`)));
    stop();
    root.dataset.theme = mode;
    if (!animate) {
      if (root.style) settle();
      return;
    }
    // Resolve the destination through CSS so tokens remain the source of truth.
    for (const role of roles) root.style.removeProperty(`--${role}`);
    const targetStyle = getComputedStyle(root);
    const to = roles.map(role => channels(targetStyle.getPropertyValue(`--${role}`)));
    const timing = targetStyle.getPropertyValue('--motion-theme').trim();
    const duration = parseFloat(timing) * (timing.endsWith('ms') ? 1 : 1000);
    if (!Number.isFinite(duration) || duration <= 0 || from.some(value => !value) || to.some(value => !value)) { settle(); return; }
    root.dataset.themeTransition = 'true';
    const started = performance.now();
    const tick = now => {
      if (reduced.matches) { settle(); return; }
      const progress = Math.min(1, Math.max(0, (now - started) / duration));
      // Smoothstep matches Gym Circuit Logger's 700 ms sRGB palette settling.
      const eased = progress * progress * (3 - 2 * progress);
      if (progress === 1) { settle(); return; }
      roles.forEach((role, i) => {
        const rgb = from[i].map((value, channel) => Math.round(value + (to[i][channel] - value) * eased));
        root.style.setProperty(`--${role}`, `rgb(${rgb.join(', ')})`);
      });
      frame = requestAnimationFrame(tick);
    };
    tick(started);
  }
  apply();
  preference.addEventListener('change', apply);
  reduced.addEventListener('change', () => { if (reduced.matches && frame !== null) settle(); });
  document.addEventListener('DOMContentLoaded', () => {
    const toggle = document.querySelector('.theme-toggle');
    if (toggle) {
      toggle.hidden = false;
      toggle.addEventListener('click', () => {
        choice = current() === 'dark' ? 'light' : 'dark';
        try { localStorage.setItem('aoc-theme', choice); } catch {}
        apply();
      });
    }
    apply();
    ready = true;
  });
})();
