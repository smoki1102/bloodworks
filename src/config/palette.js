/**
 * Einzige Farbquelle des Projekts.
 *
 * - `UI` wird beim Start auf `:root` als CSS-Variablen geschrieben (siehe
 *   `applyTokens()` in `ui.js`); die statischen Werte in `main.css` bleiben
 *   als Fallback stehen, sind aber kanonisch veraltet.
 * - `CANVAS` ist die Canvas-Palette `C` des Renderer (gleiche Schlüsselnamen
 *   wie bisher, damit `renderer.js` unverändert weiterverwenden kann).
 *
 * Richtung: dunkle, warme Industriehalle – Anthrazit-Flächen, Stahlgrau-
 * Textstaffel, gedämpftes Gelb-Grün als Aktionsfarbe (Buttons, Tabs, Fokus),
 * Blut-Rot bleibt einziger Akzent (Ressource, Gefahr, Verkauf).
 */

export const UI = {
  bg: '#131512',
  panel: '#1b1e19',
  panel2: '#242822',
  line: '#343830',
  line2: '#474d40',
  txt: '#d2d4c8',
  dim: '#8b8e80',
  bright: '#f2f3ea',
  accent: '#b03528',
  accent2: '#e5483a',
  action: '#9fb52e',
  action2: '#c0d64a',
  warn: '#dfa033',
  ok: '#6a9a34',
  err: '#e5483a',
  soft: 'rgba(176, 53, 40, 0.14)',
  softAction: 'rgba(159, 181, 46, 0.16)',
};

export const CANVAS = {
  bg: '#11130f',
  hall: '#1e2119',
  grid: 'rgba(160,170,140,.09)',
  grid2: 'rgba(160,170,140,.18)',
  body: '#d6d9c8',
  dark: '#2c3026',
  steel: '#7e8472',
  light: '#3e4436',
  bright: '#101208',
  dim: '#5c6353',
  accent: '#9fb52e',
  accent2: '#c0d64a',
  err: '#e5483a',
  warn: '#e0a040',
  ok: '#2f9e44',
  /* Materialien (Maschinen, Rohre, Bänder, Overlays) – Alpha per rgba(). */
  panel: '#e6e9df', // Maschinen-Gehäusefläche
  accentDim: '#6a9a34', // dunkles Aktionsgrün (Port-Pfeile rein, Hinweise)
  pipe: '#8a3a3a', // Rohr-Korpus
  pipe2: '#b05555', // Rohr-Mitte
  pipeDirt: '#32190f', // Rohr-Dreck
  glass: '#1e303e', // Maschinen-Innenraum (Glas)
  beltInner: '#1e2c3c', // Band-Innenfläche (Maschinen mit Pass)
  beltOff: '#0a0e14', // abgeschaltetes Band
  beltDirt: '#462819', // Band-Dreck
  spawnGlass: '#2d405a', // Spawn-Fenster
  fire: '#e57832', // Ofenfeuer
  acid: '#78c86e', // Säure
  glow: '#d64030', // Rohr-Puls, Drain-Glow
  barBg: '#14202d', // Fortschrittsbalken Hintergrund
  dirtBar: '#0f1928', // Dreck-Balken Hintergrund
  shadow: '#111c2a', // Gebäudeschatten
  hallEdge: '#bec5aa', // Hallenrand
  shade: '#000000', // generischer Abdunkler
  fog: '#bebebe', // Reinigungs-Overlay
  white: '#fff',
  /* Blut je Gore-Level (Öl / Mittel / Cartoon) und Staub. */
  blood0: '#36424f',
  blood50: '#8e2a22',
  blood100: '#cf3020',
  dust: 'rgba(92,110,132,.5)',
};

/** Hex-Token mit Deckkraft zu `rgba()` – nur für Hex-Werte, nicht für rgba-Strings. */
export function rgba(hex, a) {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
}

/** CSS-Variablenname → Token, der beim Start auf :root gesetzt wird. */
export const CSS_MAP = {
  bg: 'bg',
  panel: 'panel',
  panel2: 'panel2',
  line: 'line',
  line2: 'line2',
  txt: 'txt',
  dim: 'dim',
  bright: 'bright',
  accent: 'accent',
  accent2: 'accent2',
  action: 'action',
  action2: 'action2',
  warn: 'warn',
  ok: 'ok',
  err: 'err',
  soft: 'soft',
  softAction: 'softAction',
};
