/**
 * Ein zentrales Tooltip-Element (Hover + Fokus) für Elemente mit `data-tip`.
 * Ersetzt langsam native `title`-Tooltips; mehrzeiliger Text über `\n`.
 * Ohne DOM (Tests) remains inaktiv – die Listener laufen, finden aber kein Ziel.
 */

let el = null;
let timer = 0;
let current = null;

function ensure() {
  if (el || typeof document === 'undefined') return el;
  el = document.createElement('div');
  el.id = 'tooltip';
  el.setAttribute('role', 'tooltip');
  const host = document.body || document.documentElement;
  if (host && host.appendChild) host.appendChild(el);
  return el;
}

function show(target) {
  const tip = ensure();
  if (!tip || !target || !target.getAttribute) return;
  const text = target.getAttribute('data-tip');
  if (!text) return hide();
  tip.textContent = text;
  tip.classList.add('show');
  current = target;
  position(target);
}

function position(target) {
  const tip = el;
  if (!tip || !target.getBoundingClientRect) return;
  const r = target.getBoundingClientRect();
  const t = tip.getBoundingClientRect();
  let x = r.left + r.width / 2 - t.width / 2;
  let y = r.bottom + 8;
  if (y + t.height > innerHeight - 6) y = r.top - t.height - 8;
  x = Math.max(6, Math.min(x, innerWidth - t.width - 6));
  tip.style.left = x + 'px';
  tip.style.top = y + 'px';
}

export function hide() {
  clearTimeout(timer);
  timer = 0;
  current = null;
  if (el) el.classList.remove('show');
}

const delayedShow = (target) => {
  clearTimeout(timer);
  timer = setTimeout(() => show(target), 350);
};

export function initTooltip() {
  if (typeof document === 'undefined') return;
  document.addEventListener('pointerover', (e) => {
    const t = e.target && e.target.closest ? e.target.closest('[data-tip]') : null;
    if (t) delayedShow(t);
    else if (current) hide();
  });
  document.addEventListener('pointerout', (e) => {
    const t = e.target && e.target.closest ? e.target.closest('[data-tip]') : null;
    if (t) hide();
  });
  document.addEventListener('focusin', (e) => {
    const t = e.target && e.target.closest ? e.target.closest('[data-tip]') : null;
    if (t) show(t);
  });
  document.addEventListener('focusout', hide);
  document.addEventListener('pointerdown', hide, true);
  addEventListener('scroll', hide, true);
}
