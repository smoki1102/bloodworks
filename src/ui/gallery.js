import { METRICS, UI } from '../config/palette.js';
import { ICONS, iconSvg } from '../render/icons.js';

/**
 * Entwickler-Galerie für Design-Review, nur über den Query-Parameter
 * `?ui` oder `?gallery` erreichbar (siehe `main.js`). Reines DOM/CSS,
 * startet keine Simulation und ist im normalen Spiel deaktiviert.
 * `galleryHtml()` ist rein und wird separat getestet.
 */
export function galleryHtml(mode = 'gallery') {
  return `
    <header class="galHead">
      <b>BloodWorks · ${mode === 'ui' ? 'UI-Komponenten' : 'Stil-Galerie'}</b>
      <span>Query-Parameter <code>?${mode}</code> · nur für Entwicklung</span>
      <button data-gal-close>Schließen</button>
    </header>
    ${sectionFarben()}
    ${sectionMasse()}
    ${sectionTypo()}
    ${sectionButtons()}
    ${sectionBars()}
    ${sectionKarten()}
    ${sectionToasts()}
    ${sectionIcons()}`;
}

/** Hängt die Galerie als Overlay an `<body>` (idempotent). */
export function openGallery(mode = 'gallery') {
  if (document.getElementById('gallery')) return;
  const wrap = document.createElement('div');
  wrap.id = 'gallery';
  wrap.className = 'gal';
  wrap.innerHTML = galleryHtml(mode);
  document.body.appendChild(wrap);
  wrap.querySelector('[data-gal-close]').addEventListener('click', () => wrap.remove());
}

const swatch = (name, val) =>
  `<div class="galSw"><i class="galChip" style="background:${val}"></i><span>${name}</span><code>${val}</code></div>`;

function sectionFarben() {
  return block(
    'Farben (UI)',
    `<div class="galGrid">${Object.entries(UI)
      .map(([k, v]) => swatch(k, v))
      .join('')}</div>`,
  );
}

function sectionMasse() {
  const sp = ['sp1', 'sp2', 'sp3', 'sp4', 'sp5', 'sp6'];
  const r = ['r1', 'r2', 'r3'];
  return block(
    'Abstände & Radien',
    `<div class="galGrid">
      ${sp.map((k) => `<div class="galSw"><i class="galSp" style="width:${METRICS[k]}"></i><span>${k}</span><code>${METRICS[k]}</code></div>`).join('')}
      ${r.map((k) => `<div class="galSw"><i class="galR" style="border-radius:${METRICS[k]}"></i><span>${k}</span><code>${METRICS[k]}</code></div>`).join('')}
    </div>`,
  );
}

function sectionTypo() {
  return block(
    'Typografie',
    `<div class="galStack">
      <div style="font:700 var(--fontTitle) var(--mono)">Titel 26 · BLOODWORKS</div>
      <div style="font:700 var(--fontHead) var(--mono)">Überschrift 22</div>
      <div style="font:var(--fontLg) var(--mono)">Ressource 15</div>
      <div>Fließtext 13 – Abstrakte Cartoon-Darstellung, rein mechanische Abläufe.</div>
      <div style="font:var(--fontSm) var(--mono)">Label 11</div>
      <div style="font:var(--fontXs) var(--mono);color:var(--dim)">STATUS 10</div>
    </div>`,
  );
}

function sectionButtons() {
  return block(
    'Buttons',
    `<div class="galStack galRow">
      <button>Standard</button>
      <button class="big" style="width:auto;margin:0">Aktion</button>
      <button class="danger">Verkaufen</button>
      <button class="on">Ausgewählt</button>
      <button disabled>Gesperrt</button>
      <button><span>${iconSvg('power')}</span> Mit Icon</button>
    </div>`,
  );
}

function sectionBars() {
  const fills = ['fill-dim', 'fill-blood', 'fill-ok', 'fill-warn', 'fill-err'];
  return block(
    'Statusbalken',
    `<div class="galStack" style="max-width:360px">${fills
      .map(
        (f) =>
          `<div class="bar"><i class="${f}" style="width:${[30, 45, 60, 75, 90][fills.indexOf(f)]}%"></i></div>`,
      )
      .join('')}</div>`,
  );
}

function sectionKarten() {
  return block(
    'Baukarten',
    `<div class="galRow">
      <div class="card"><div class="r1"><span class="g">${iconSvg('power')}</span><span class="nm">Walze</span><span class="cost">120 €</span></div><div class="ds">Zerfetzt Sticks.</div><div class="tag">VERARBEITUNG</div></div>
      <div class="card sel"><div class="r1"><span class="g">${iconSvg('power')}</span><span class="nm">Presse</span><span class="cost">200 €</span></div><div class="ds">Extrahiert Blut.</div><div class="tag">VERARBEITUNG</div></div>
      <div class="card poor"><div class="r1"><span class="g">${iconSvg('power')}</span><span class="nm">Ofen</span><span class="cost">900 €</span></div><div class="ds">Zu teuer.</div><div class="tag">ENTsorgung</div></div>
      <div class="card locked"><div class="r1"><span class="g">${iconSvg('close')}</span><span class="nm">Markt</span><span class="cost">—</span></div><div class="ds">Noch gesperrt.</div><div class="tag lock">GESPERRT</div></div>
    </div>`,
  );
}

function sectionToasts() {
  return block(
    'Toasts',
    `<div class="galStack" style="align-items:flex-start">
      <span class="toast">Neutraler Hinweis</span>
      <span class="toast good">Erfolg</span>
      <span class="toast bad">Fehler / Gefahr</span>
    </div>`,
  );
}

function sectionIcons() {
  return block(
    `Icons (${Object.keys(ICONS).length})`,
    `<div class="galIcons">${Object.keys(ICONS)
      .map((n) => `<span class="galIco">${iconSvg(n)}<small>${n}</small></span>`)
      .join('')}</div>`,
  );
}

const block = (title, body) =>
  `<section class="galBlock"><h2>${title}</h2>${body}</section>`;
