/**
 * Eigenes Icon-Set – eine einzige Shape-Definition pro Icon, zwei Renderer:
 * Canvas (`drawIcon`) für den Spiel-Canvas, Inline-SVG (`iconSvg`) für DOM-UI.
 * Raster: 16×16, Koordinaten 0–16, rein geometrisch, keine Fremd-Assets.
 *
 * Ops-Formate:
 *   ['l', x1, y1, x2, y2]      Linie (Stroke)
 *   ['p', x1, y1, ...]         Polyline (Stroke)
 *   ['pf', x1, y1, ...]        Polygon (Fill)
 *   ['c', cx, cy, r]           Kreis (Stroke)
 *   ['cf', cx, cy, r]          Kreis (Fill)
 *   ['r', x, y, w, h]          Rechteck (Stroke)
 *   ['rf', x, y, w, h]         Rechteck (Fill)
 *   ['arc', cx, cy, r, a, b]   Bogen (Stroke, Bogenmaß)
 */

const D = Math.PI / 180;

export const ICONS = {
  /* ------- Maschinen / Gebäude ------- */
  belt: [
    ['l', 2, 5.5, 14, 5.5],
    ['l', 2, 10.5, 14, 10.5],
    ['p', 5, 6, 8, 8, 5, 10],
    ['p', 9, 6, 12, 8, 9, 10],
  ],
  spawn: [
    ['r', 2, 4, 6, 8],
    ['l', 9.5, 8, 14, 8],
    ['p', 11.5, 5.5, 14, 8, 11.5, 10.5],
  ],
  spike: [
    ['c', 8, 8, 4.2],
    ['l', 12.2, 8, 15, 8],
    ['l', 3.8, 8, 1, 8],
    ['l', 8, 12.2, 8, 15],
    ['l', 8, 3.8, 8, 1],
    ['l', 11, 11, 13, 13],
    ['l', 5, 5, 3, 3],
    ['l', 11, 5, 13, 3],
    ['l', 5, 11, 3, 13],
  ],
  press: [
    ['r', 3, 2, 10, 3],
    ['r', 3, 11, 10, 3],
    ['l', 8, 6, 8, 9.5],
    ['p', 6.5, 8, 8, 10, 9.5, 8],
  ],
  blade: [
    ['l', 3.5, 3.5, 12.5, 12.5],
    ['l', 12.5, 3.5, 3.5, 12.5],
    ['cf', 8, 8, 1.4],
  ],
  schleuder: [
    ['c', 8, 8, 2.2],
    ['arc', 8, 8, 6, -80 * D, 20 * D],
    ['cf', 13.5, 4, 1.3],
  ],
  bin: [
    ['l', 2.5, 4, 13.5, 4],
    ['p', 4.5, 4, 3.5, 13.5, 12.5, 13.5, 11.5, 4],
    ['l', 7, 6, 6.6, 11.5],
    ['l', 9, 6, 9.4, 11.5],
  ],
  oven: [
    ['r', 3, 7, 10, 7],
    ['pf', 8, 1.5, 10.5, 6, 8, 5, 5.5, 6],
    ['l', 5.5, 9.5, 10.5, 9.5],
  ],
  acid: [
    ['p', 6, 1.5, 6, 6, 2.5, 13.5, 13.5, 13.5, 10, 6, 10, 1.5],
    ['l', 5, 1.5, 11, 1.5],
    ['cf', 6.5, 10.5, 0.9],
    ['cf', 9.5, 9, 0.7],
  ],
  shop: [
    ['p', 1.5, 6, 8, 1.5, 14.5, 6],
    ['r', 3.5, 6, 9, 7],
    ['cf', 8, 9.5, 1.6],
  ],
  lab: [
    ['r', 2.5, 2.5, 11, 11],
    ['l', 8, 5, 8, 11],
    ['l', 5, 8, 11, 8],
  ],
  weiche: [
    ['l', 1.5, 8, 6, 8],
    ['l', 6, 8, 10, 4],
    ['l', 6, 8, 10, 12],
    ['l', 10, 4, 14.5, 4],
    ['l', 10, 12, 14.5, 12],
  ],
  merge: [
    ['l', 1.5, 4, 6, 4],
    ['l', 1.5, 12, 6, 12],
    ['l', 6, 4, 10, 8],
    ['l', 6, 12, 10, 8],
    ['l', 10, 8, 14.5, 8],
  ],
  filter: [
    ['p', 2, 3, 14, 3, 9.5, 8, 9.5, 13.5, 6.5, 13.5, 6.5, 8, 2, 3],
  ],
  pipe: [
    ['l', 8, 1.5, 8, 14.5],
    ['r', 5, 4, 6, 2.6],
    ['r', 5, 9.4, 6, 2.6],
  ],
  tank: [
    ['r', 3.5, 2.5, 9, 11],
    ['l', 3.5, 6, 12.5, 6],
    ['l', 3.5, 11, 12.5, 11],
  ],
  drain: [
    ['r', 2.5, 3, 11, 10],
    ['l', 2.5, 6.3, 13.5, 6.3],
    ['l', 2.5, 8, 13.5, 8],
    ['l', 2.5, 9.7, 13.5, 9.7],
  ],
  market: [
    ['c', 8, 8, 5.8],
    ['arc', 8, 8, 3.2, 32 * D, 328 * D],
    ['l', 4.5, 6.3, 11.5, 6.3],
    ['l', 4.5, 9.7, 11.5, 9.7],
  ],
  gen: [
    ['c', 8, 8, 6],
    ['pf', 8.9, 3.2, 5.4, 8.6, 7.7, 8.6, 7.1, 12.8, 10.6, 7.4, 8.3, 7.4],
  ],

  /* ------- UI ------- */
  play: [['pf', 4.5, 3, 13, 8, 4.5, 13]],
  pause: [
    ['rf', 4, 3, 3, 10],
    ['rf', 9, 3, 3, 10],
  ],
  close: [
    ['l', 4, 4, 12, 12],
    ['l', 12, 4, 4, 12],
  ],
  power: [
    ['arc', 8, 9, 5.2, -90 * D + 26 * D, 270 * D - 26 * D],
    ['l', 8, 3.2, 8, 8.4],
  ],
  clean: [
    ['pf', 8, 1, 9.6, 6.4, 15, 8, 9.6, 9.6, 8, 15, 6.4, 9.6, 1, 8, 6.4, 6.4],
  ],
  energy: [['pf', 9.2, 1.2, 5, 8.4, 7.6, 8.4, 6.6, 14.8, 11, 7.4, 8.4, 7.4]],
  blood: [['pf', 8, 1.2, 11.4, 7, 12.2, 10, 8, 14.8, 3.8, 10, 4.6, 7]],
  money: [
    ['c', 8, 8, 5.8],
    ['arc', 8, 8, 3.2, 32 * D, 328 * D],
    ['l', 4.5, 6.3, 11.5, 6.3],
    ['l', 4.5, 9.7, 11.5, 9.7],
  ],
  settings: [
    ['c', 8, 8, 2.4],
    ['l', 8, 1, 8, 3.4],
    ['l', 8, 12.6, 8, 15],
    ['l', 1, 8, 3.4, 8],
    ['l', 12.6, 8, 15, 8],
    ['l', 3, 3, 4.8, 4.8],
    ['l', 11.2, 11.2, 13, 13],
    ['l', 13, 3, 11.2, 4.8],
    ['l', 4.8, 11.2, 3, 13],
  ],
};

/** Zeichnet ein Icon zentriert bei (cx, cy) mit Kantenlänge `size` (Canvas). */
export function drawIcon(ctx, name, cx, cy, size, color) {
  const ops = ICONS[name];
  if (!ops) return;
  const s = size / 16;
  ctx.save();
  ctx.translate(cx - size / 2, cy - size / 2);
  ctx.scale(s, s);
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.lineWidth = 1.7;
  for (const op of ops) {
    const [k, ...v] = op;
    ctx.beginPath();
    if (k === 'l') {
      ctx.strokeStyle = color;
      ctx.moveTo(v[0], v[1]);
      ctx.lineTo(v[2], v[3]);
      ctx.stroke();
    } else if (k === 'p') {
      ctx.strokeStyle = color;
      ctx.moveTo(v[0], v[1]);
      for (let i = 2; i < v.length; i += 2) ctx.lineTo(v[i], v[i + 1]);
      ctx.stroke();
    } else if (k === 'pf') {
      ctx.fillStyle = color;
      ctx.moveTo(v[0], v[1]);
      for (let i = 2; i < v.length; i += 2) ctx.lineTo(v[i], v[i + 1]);
      ctx.closePath();
      ctx.fill();
    } else if (k === 'c' || k === 'arc') {
      ctx.strokeStyle = color;
      if (k === 'c') ctx.arc(v[0], v[1], v[2], 0, 7);
      else ctx.arc(v[0], v[1], v[2], v[3], v[4]);
      ctx.stroke();
    } else if (k === 'cf') {
      ctx.fillStyle = color;
      ctx.arc(v[0], v[1], v[2], 0, 7);
      ctx.fill();
    } else if (k === 'r' || k === 'rf') {
      if (k === 'rf') {
        ctx.fillStyle = color;
        ctx.fillRect(v[0], v[1], v[2], v[3]);
      } else {
        ctx.strokeStyle = color;
        ctx.strokeRect(v[0], v[1], v[2], v[3]);
      }
    }
  }
  ctx.restore();
}

const esc = (n) => String(Math.round(n * 100) / 100);

/** Liefert einen Inline-SVG-String (16×16, currentColor) für die DOM-UI. */
export function iconSvg(name, cls = '') {
  const ops = ICONS[name];
  if (!ops) return '';
  const strokes = [];
  const fills = [];
  for (const [k, ...v] of ops) {
    if (k === 'l')
      strokes.push(`<line x1="${esc(v[0])}" y1="${esc(v[1])}" x2="${esc(v[2])}" y2="${esc(v[3])}"/>`);
    else if (k === 'p') strokes.push(`<polyline points="${pts(v)}"/>`);
    else if (k === 'pf') fills.push(`<polygon points="${pts(v)}"/>`);
    else if (k === 'c') strokes.push(`<circle cx="${esc(v[0])}" cy="${esc(v[1])}" r="${esc(v[2])}"/>`);
    else if (k === 'cf') fills.push(`<circle cx="${esc(v[0])}" cy="${esc(v[1])}" r="${esc(v[2])}" fill="currentColor"/>`);
    else if (k === 'r') strokes.push(`<rect x="${esc(v[0])}" y="${esc(v[1])}" width="${esc(v[2])}" height="${esc(v[3])}"/>`);
    else if (k === 'rf') fills.push(`<rect x="${esc(v[0])}" y="${esc(v[1])}" width="${esc(v[2])}" height="${esc(v[3])}" fill="currentColor"/>`);
    else if (k === 'arc')
      strokes.push(
        `<path d="M ${esc(v[0] + v[2] * Math.cos(v[3]))} ${esc(v[1] + v[2] * Math.sin(v[3]))} A ${esc(v[2])} ${esc(v[2])} 0 ${Math.abs(v[4] - v[3]) > Math.PI ? 1 : 0} 1 ${esc(v[0] + v[2] * Math.cos(v[4]))} ${esc(v[1] + v[2] * Math.sin(v[4]))}"/>`,
      );
  }
  const inner =
    (fills.length ? `<g fill="currentColor" stroke="none">${fills.join('')}</g>` : '') +
    (strokes.length ? `<g fill="none" stroke="currentColor">${strokes.join('')}</g>` : '');
  return `<svg class="ico${cls ? ' ' + cls : ''}" viewBox="0 0 16 16" aria-hidden="true">${inner}</svg>`;
}

function pts(v) {
  const out = [];
  for (let i = 0; i < v.length; i += 2) out.push(esc(v[i]) + ',' + esc(v[i + 1]));
  return out.join(' ');
}
