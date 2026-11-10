const slides = [...document.querySelectorAll('.slide')];
const previous = document.querySelector('#prev');
const next = document.querySelector('#next');
const present = document.querySelector('#present');
const status = document.querySelector('output');
const motion = matchMedia('(prefers-reduced-motion: reduce)');
const chapters = [[0, 'The opportunity'], [3, 'Zoundio'], [7, 'The gym'], [10, 'Room to play'], [11, 'Engineering'], [13, 'Your ideas']];
let index = Math.max(0, slides.findIndex(slide => '#' + slide.id === location.hash));
let animations = [];
let animatedSlide = null;

// Navigation doubles as a quiet map of the conversation, never an auto-advance timer.
const map = document.createElement('nav');
map.className = 'chapter-map';
map.setAttribute('aria-label', 'Presentation chapters');
for (const [start, label] of chapters) {
  const button = document.createElement('button');
  button.type = 'button';
  button.textContent = label;
  button.onclick = () => go(start);
  map.append(button);
}
document.body.append(map);
const replay = document.createElement('button');
replay.type = 'button';
replay.textContent = 'Replay details';
replay.title = 'Replay the current slide’s visual details';
replay.onclick = () => animateDetails(slides[index]);
document.querySelector('.controls').append(replay);

function cancelMotion() {
  animations.forEach(animation => animation.cancel());
  animations = [];
}
function animateDetails(slide) {
  cancelMotion();
  if (motion.matches || !document.body.classList.contains('presenting')) return;
  const tokens = getComputedStyle(document.documentElement);
  const duration = parseFloat(tokens.getPropertyValue('--motion-settle')) || 400;
  const easing = tokens.getPropertyValue('--motion-ease').trim() || 'ease-out';
  const play = (element, frames, delay = 0, length = duration) => {
    animations.push(element.animate(frames, {duration: length, delay, easing, fill: 'backwards'}));
  };
  // Text stays in place. Rules, diagram accents and artwork carry the movement.
  const artwork = slide.querySelector('.hero-wave, .wave-edge');
  if (artwork) play(artwork, [
    {clipPath: 'inset(0 100% 0 0)'}, {clipPath: 'inset(0 0% 0 0)'}
  ], 0, duration * 2);
  const nodes = [...slide.querySelectorAll('.columns > div, .pipeline > span, .process-loop li, .review-grid > div, .demo-steps > span, .opportunity-list > span')];
  nodes.forEach((node, position) => {
    const accent = getComputedStyle(slide).getPropertyValue('--detail-accent').trim();
    play(node, [{boxShadow: `inset 0 3px ${accent}`}, {boxShadow: 'inset 0 0px transparent'}], position * 90, duration * 1.5);
  });
  slide.querySelectorAll('.phone, .media-slot').forEach((node, position) => {
    play(node, [{outline: '1px solid currentColor', outlineOffset: '5px'}, {outline: '1px solid transparent', outlineOffset: '0px'}], position * 90);
  });
}
function update() {
  const presenting = document.body.classList.contains('presenting');
  slides.forEach((slide, position) => { slide.hidden = presenting && position !== index; });
  previous.disabled = index === 0;
  next.disabled = index === slides.length - 1;
  status.textContent = `${index + 1} / ${slides.length}`;
  const chapter = chapters.findLastIndex(([start]) => start <= index);
  [...map.children].forEach((button, position) => {
    if (position === chapter) button.setAttribute('aria-current', 'step');
    else button.removeAttribute('aria-current');
    button.style.setProperty('--chapter-progress', position < chapter ? '100%' : position === chapter ? `${100 * (index - chapters[position][0] + 1) / ((chapters[position + 1]?.[0] ?? slides.length) - chapters[position][0])}%` : '0%');
  });
  replay.hidden = !presenting || motion.matches;
  if (presenting && animatedSlide !== slides[index]) {
    animateDetails(slides[index]);
    animatedSlide = slides[index];
  } else if (!presenting) {
    cancelMotion();
    animatedSlide = null;
  }
}
function go(to) {
  index = Math.max(0, Math.min(slides.length - 1, to));
  history.replaceState(null, '', '#' + slides[index].id);
  update();
  if (!document.body.classList.contains('presenting')) slides[index].scrollIntoView();
}
function togglePresentation() {
  document.body.classList.toggle('presenting');
  present.textContent = document.body.classList.contains('presenting') ? 'All slides' : 'Present';
  update();
}
previous.onclick = () => go(index - 1);
next.onclick = () => go(index + 1);
present.onclick = togglePresentation;
document.querySelector('#full').onclick = async () => {
  try {
    if (document.fullscreenElement) await document.exitFullscreen();
    else {
      if (!document.body.classList.contains('presenting')) togglePresentation();
      await document.documentElement.requestFullscreen();
    }
  } catch { status.textContent = 'Use Present mode'; }
};
addEventListener('hashchange', () => {
  const found = slides.findIndex(slide => '#' + slide.id === location.hash);
  if (found >= 0) { index = found; update(); }
});
motion.addEventListener('change', () => { cancelMotion(); update(); });
addEventListener('keydown', event => {
  if (!document.body.classList.contains('presenting') || event.altKey || event.ctrlKey || event.metaKey || event.target.closest('input,textarea,select,[contenteditable=true]')) return;
  if (['Enter', ' '].includes(event.key) && event.target.closest('button,a')) return;
  const to = {ArrowRight:index+1, ArrowDown:index+1, PageDown:index+1, ArrowLeft:index-1, ArrowUp:index-1, PageUp:index-1, Home:0, End:slides.length-1, ' ':index+(event.shiftKey?-1:1)}[event.key];
  if (event.key === 'Escape') { event.preventDefault(); togglePresentation(); present.focus(); }
  if (to !== undefined) { event.preventDefault(); go(to); }
});
update();
