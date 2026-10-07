/**
 * Minimaler DOM-/Canvas-Stub, damit `src/main.js` und das komplette UI
 * in Node geladen und ein paar Frames lang durchlaufen werden können.
 * Elemente werden nur für die IDs aus `index.html` erzeugt – fehlt eine
 * ID im Markup, gibt `$()` null zurück und der Test fällt auf.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const html = fs.readFileSync(path.join(here, '..', 'index.html'), 'utf8');

const idTags = [...html.matchAll(/<[^>]+>/g)]
  .map((m) => m[0])
  .filter((t) => / id="/.test(t));

const ids = [];
const classById = new Map();
for (const t of idTags) {
  const id = (t.match(/\bid="([^"]+)"/) || [])[1];
  if (!id) continue;
  ids.push(id);
  classById.set(id, (t.match(/\bclass="([^"]+)"/) || [])[1] || '');
}

const CTX_PROPS = new Set([
  'fillStyle',
  'strokeStyle',
  'lineWidth',
  'lineCap',
  'lineJoin',
  'miterLimit',
  'globalAlpha',
  'globalCompositeOperation',
  'font',
  'textAlign',
  'textBaseline',
  'direction',
  'shadowBlur',
  'shadowColor',
  'shadowOffsetX',
  'shadowOffsetY',
  'filter',
  'imageSmoothingEnabled',
  'imageSmoothingQuality',
  'lineDashOffset',
]);

const ctx = new Proxy(
  {},
  {
    get(t, p) {
      if (p === 'canvas') return els.get('cv');
      if (CTX_PROPS.has(p)) return t[p];
      if (p === 'measureText') return () => ({ width: 10 });
      if (p === 'createLinearGradient' || p === 'createRadialGradient')
        return () => ({ addColorStop() {} });
      if (p === 'getImageData')
        return (x, y, w, h) => ({ data: new Uint8ClampedArray(Math.max(4, w * h * 4)) });
      if (typeof p === 'symbol') return undefined;
      if (p in t) return t[p];
      return () => {};
    },
    set(t, p, v) {
      t[p] = v;
      return true;
    },
  },
);

function makeEl(id, cls = '') {
  const classes = new Set(cls.split(/\s+/).filter(Boolean));
  const listeners = {};
  const el = {
    id,
    tagName: 'DIV',
    value: '',
    checked: false,
    hidden: false,
    textContent: '',
    innerHTML: '',
    className: cls,
    style: { display: '' },
    dataset: {},
    children: [],
    parentElement: null,
    classList: {
      add: (...c) => c.forEach((x) => classes.add(x)),
      remove: (...c) => c.forEach((x) => classes.delete(x)),
      toggle: (c, force) => {
        const on = force === undefined ? !classes.has(c) : force;
        if (on) classes.add(c);
        else classes.delete(c);
        return on;
      },
      contains: (c) => classes.has(c),
    },
    addEventListener(type, fn) {
      (listeners[type] ||= []).push(fn);
    },
    removeEventListener(type, fn) {
      listeners[type] = (listeners[type] || []).filter((f) => f !== fn);
    },
    dispatch(type, ev = {}) {
      for (const fn of listeners[type] || []) fn({ target: el, preventDefault() {}, ...ev });
    },
    click() {
      if (el.onclick) el.onclick({ target: el, preventDefault() {} });
      el.dispatch('click', { target: el });
    },
    focus() {},
    blur() {},
    remove() {
      el.parentElement?.removeChild?.(el);
    },
    setAttribute() {},
    getAttribute: () => null,
    removeAttribute() {},
    hasAttribute: () => false,
    querySelector: () => null,
    querySelectorAll: () => [],
    closest: () => null,
    appendChild(c) {
      el.children.push(c);
      c.parentElement = el;
      return c;
    },
    removeChild(c) {
      el.children = el.children.filter((x) => x !== c);
    },
    getBoundingClientRect: () => ({ left: 0, top: 0, width: 1280, height: 720, right: 1280, bottom: 720 }),
    setPointerCapture() {},
    releasePointerCapture() {},
    getContext: () => ctx,
    toDataURL: () => '',
  };
  return el;
}

const els = new Map();
for (const id of ids) els.set(id, makeEl(id, classById.get(id)));
els.get('cv').parentElement = makeEl('view');

const docListeners = {};
const document = {
  getElementById: (id) => els.get(id) || null,
  createElement: (tag) => {
    const el = makeEl('', '');
    el.tagName = String(tag).toUpperCase();
    return el;
  },
  querySelector: () => null,
  querySelectorAll: () => [],
  addEventListener(type, fn) {
    (docListeners[type] ||= []).push(fn);
  },
  removeEventListener() {},
  fire(type, ev = {}) {
    for (const fn of docListeners[type] || []) fn({ target: null, preventDefault() {}, ...ev });
  },
  activeElement: null,
  hidden: false,
};

const winListeners = {};
const raf = [];
const store = new Map();

const globals = {
  document,
  window: { devicePixelRatio: 1 },
  localStorage: {
    getItem: (k) => (store.has(k) ? store.get(k) : null),
    setItem: (k, v) => store.set(k, String(v)),
    removeItem: (k) => store.delete(k),
    clear: () => store.clear(),
  },
  requestAnimationFrame: (fn) => (raf.push(fn), raf.length),
  cancelAnimationFrame: () => {},
  ResizeObserver: class {
    observe() {}
    unobserve() {}
    disconnect() {}
  },
  addEventListener: (type, fn) => {
    (winListeners[type] ||= []).push(fn);
  },
  removeEventListener: () => {},
};
for (const [k, v] of Object.entries(globals)) Object.defineProperty(globalThis, k, { value: v, writable: true, configurable: true });
globalThis.window.addEventListener = globals.addEventListener;

/** N Frames der Hauptschleife laufen lassen (dt = 1/60 s). */
export function frames(n = 1, dtMs = 16.7) {
  for (let i = 0; i < n; i++) {
    const q = raf.splice(0, raf.length);
    for (const fn of q) fn(frames.t += dtMs);
  }
}
frames.t = 0;

/** Element aus index.html holen (oder null). */
export const el = (id) => els.get(id) || null;
export const fireDoc = (type, ev) => document.fire(type, ev);
export const fireWin = (type, ev) => (winListeners[type] || []).forEach((f) => f(ev));
