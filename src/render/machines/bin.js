import { C, ctx } from '../canvas.js';
import { rgba } from '../../config/palette.js';
import { DEF } from '../../config/building-defs.js';
import { bar } from '../prims.js';
import { drawCorpseShape, drawLimbShape } from '../figures.js';

export function draw(b, r) {
  ctx.fillStyle = rgba(C.glass, 0.35);
  ctx.fillRect(r.x + 7, r.y + 15, r.w - 14, r.h - 22);
  b.items.forEach((it, i) => {
    const ix = r.x + 24 + (i % 4) * 26;
    const iy = r.y + r.h - 14 - Math.floor(i / 4) * 14;
    if (it.kind === 'limb') {
      ctx.save();
      ctx.translate(ix, iy);
      ctx.rotate((it.rot || 0) * 1.5);
      ctx.strokeStyle = C.dim;
      ctx.fillStyle = C.dim;
      ctx.lineWidth = 2.2;
      drawLimbShape(it.part || 'armL', 0, 0);
      ctx.restore();
    } else drawCorpseShape(ix, iy, (it.rot || 0) * 1.5 + i, 0.85, it.missing);
  });
  const f = b.items.length / (DEF.bin.cap || 9);
  bar(r.x + 8, r.y - 8, r.w - 16, f, f > 0.75 ? C.accent2 : C.dim);
}
