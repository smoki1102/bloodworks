/**
 * Profilierung in echtem Chrome (kein Node-Stub): baut das Projekt, startet
 * `vite preview` und Chrome im Headless-Modus, lädt die Bench-Welten
 * (`?bench=std` / `?bench=big`, jeweils mit `&perf`) und misst über CDP
 * (Runtime.evaluate) je Szene drei Kameraausschnitte.
 *
 *   node scripts/profile.mjs
 *
 * Braucht Chrome unter dem Standardpfad; keine zusätzlichen Dependencies
 * (nur Node-Bordmittel: child_process, fetch, WebSocket).
 */
import { spawn, execFileSync } from 'node:child_process';
import { setTimeout as sleep } from 'node:timers/promises';
import os from 'node:os';
import path from 'node:path';

const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const PORT = 4173;
const DEBUG = 9333;
const FRAMES_CHUNK = 150;
const FRAMES = 900;

const url = (bench) => `http://127.0.0.1:${PORT}/?bench=${bench}&perf`;

/** Zwei Szenarien-Sets: Normal- und Stressszene, je mit drei Kameraausschnitten. */
const scenes = [
  {
    name: 'Standard (5 Linien, Merge/Filter, Rohrnetz)',
    bench: 'std',
    cam: { x: 1680, y: 1296, z: 0.7 },
    views: [
      { name: 'A Detail (z 0,7)', cam: { x: 1680, y: 1296, z: 0.7 } },
      { name: 'B Überblick (z 0,3)', cam: { x: 1728, y: 1296, z: 0.3 } },
      { name: 'C Nah (z 2,0)', cam: { x: 520, y: 380, z: 2 } },
    ],
  },
  {
    name: 'Stress (10 Linien, doppelte Anlagengröße)',
    bench: 'big',
    cam: { x: 1440, y: 1584, z: 0.6 },
    views: [
      { name: 'A Detail (z 0,6)', cam: { x: 1440, y: 1584, z: 0.6 } },
      { name: 'B Überblick (z 0,25)', cam: { x: 1500, y: 1560, z: 0.25 } },
      { name: 'C Nah (z 2,0)', cam: { x: 520, y: 380, z: 2 } },
    ],
  },
];

function run(cmd, args, opts = {}) {
  return execFileSync(cmd, args, { stdio: 'pipe', ...opts }).toString();
}

async function waitForHttp(url, ms = 20000) {
  const t0 = Date.now();
  while (Date.now() - t0 < ms) {
    try {
      const r = await fetch(url);
      if (r.ok) return;
    } catch {
      /* noch nicht da */
    }
    await sleep(200);
  }
  throw new Error('Timeout auf ' + url);
}

class CDP {
  constructor(url) {
    this.url = url;
    this.id = 0;
    this.waiters = new Map();
    this.events = [];
  }
  async open() {
    this.ws = new WebSocket(this.url);
    await new Promise((res, rej) => {
      this.ws.onopen = res;
      this.ws.onerror = rej;
    });
    this.ws.onmessage = (e) => {
      const msg = JSON.parse(e.data);
      if (msg.id && this.waiters.has(msg.id)) {
        const { res, rej } = this.waiters.get(msg.id);
        this.waiters.delete(msg.id);
        msg.error ? rej(new Error(msg.error.message)) : res(msg.result);
      } else if (msg.method) this.events.push(msg);
    };
  }
  cmd(method, params = {}) {
    const id = ++this.id;
    this.ws.send(JSON.stringify({ id, method, params }));
    return new Promise((res, rej) => this.waiters.set(id, { res, rej }));
  }
  async eval(expression) {
    const r = await this.cmd('Runtime.evaluate', {
      expression,
      returnByValue: true,
      awaitPromise: true,
    });
    if (r.exceptionDetails)
      throw new Error(
        r.exceptionDetails.exception?.description ||
          `${r.exceptionDetails.text} :: ${expression.slice(0, 120)}`,
      );
    return r.result?.value;
  }
  close() {
    try {
      this.ws.close();
    } catch {
      /* egal */
    }
  }
}

async function waitReady(cdp, ms = 30000) {
  const t0 = Date.now();
  for (;;) {
    const ready = await cdp
      .eval('typeof __bwBenchReady === "undefined" ? -1 : (__bwBenchReady ? 1 : 0)')
      .catch(() => 0);
    if (ready === 1) return;
    if (Date.now() - t0 > ms) throw new Error('Bench-Welt nicht bereit');
    await sleep(250);
  }
}

async function measure(cdp, frames) {
  await cdp.eval('globalThis.__bwPerf.reset()');
  let t = (await cdp.eval('globalThis.__bwT || 0')) || 0;
  for (let done = 0; done < frames; done += FRAMES_CHUNK) {
    const n = Math.min(FRAMES_CHUNK, frames - done);
    t = await cdp.eval(
      `(() => { let t = ${t}; for (let i = 0; i < ${n}; i++) { t += 16.667; globalThis.__bwFrame(t); } globalThis.__bwT = t; return t; })()`,
    );
  }
  return cdp.eval('JSON.stringify(__bwPerf.snapshot())');
}

/**
 * Echtzeitmessung: Seite mit `&live` neu laden, damit die normale rAF-Schleife
 * läuft – gemessen wird der echte Frame-Abstand inklusive Rasterisierung.
 */
async function realtime(cdp, bench, warmMs = 2000, measureMs = 5000) {
  await cdp.cmd('Page.navigate', { url: `${url(bench)}&live` });
  await waitReady(cdp);
  await sleep(warmMs);
  await cdp.eval('globalThis.__bwPerf.reset()');
  await sleep(measureMs);
  return JSON.parse(await cdp.eval('JSON.stringify(globalThis.__bwPerf.snapshot())'));
}

function table(title, snap) {
  const frame = snap.marks.find((m) => m.name === 'frame');
  console.log(`\n${title}`);
  console.log(
    `  ${snap.frames} Frames · Ø ${frame ? frame.avg.toFixed(2) : '?'} ms/Frame` +
      ` · ${frame ? (1000 / frame.avg).toFixed(0) : '?'} fps`,
  );
  for (const m of snap.marks) {
    if (m.name === 'frame') continue;
    if (m.count) {
      console.log(`  ${m.name.padEnd(16)} Ø ${m.avg.toFixed(2)} Aufrufe/Frame (n=${m.sum})`);
      continue;
    }
    console.log(
      `  ${m.name.padEnd(16)} Ø ${m.avg.toFixed(2)} ms  max ${m.max
        .toFixed(2)
        .padStart(6)} ms  ${String(m.pct).padStart(5)} %  (n=${m.n})`,
    );
  }
}

async function main() {
  console.log('· vite build');
  run('npm', ['run', 'build'], { cwd: process.cwd() });

  const tmp = await import('node:fs').then((fs) =>
    fs.mkdtempSync(path.join(os.tmpdir(), 'bw-chrome-')),
  );
  const preview = spawn(
    'npx',
    ['vite', 'preview', '--port', String(PORT), '--strictPort', '--host', '127.0.0.1'],
    { stdio: 'ignore' },
  );
  const chrome = spawn(
    CHROME,
    [
      '--headless',
      `--remote-debugging-port=${DEBUG}`,
      `--user-data-dir=${tmp}`,
      '--no-first-run',
      '--disable-extensions',
      '--hide-scrollbars',
      '--window-size=1280,720',
      '--enable-unsafe-swiftshader',
      'about:blank',
    ],
    { stdio: 'ignore' },
  );

  try {
    await waitForHttp(`http://127.0.0.1:${PORT}/`);
    await waitForHttp(`http://127.0.0.1:${DEBUG}/json/version`);
    const list = await (await fetch(`http://127.0.0.1:${DEBUG}/json/list`)).json();
    const page = list.find((t) => t.type === 'page');
    const cdp = new CDP(page.webSocketDebuggerUrl);
    await cdp.open();
    await cdp.cmd('Page.enable');
    await cdp.cmd('Runtime.enable');
    await cdp.cmd('Emulation.setDeviceMetricsOverride', {
      width: 1280,
      height: 720,
      deviceScaleFactor: 1,
      mobile: false,
    });
    console.log(
      `· Treiber-Szenarien je ${FRAMES} Frames (16,67 ms Spielzeit), danach je 5 s Echtzeit`,
    );
    for (const scene of scenes) {
      await cdp.cmd('Page.navigate', { url: url(scene.bench) });
      await waitReady(cdp);
      const setCam = (c) =>
        cdp.eval(
          `globalThis.__bwCam(${c.x}, ${c.y}, ${c.z})`,
        );
      // Aufwärmen (Simulation läuft an, Blut/Partikel bilden sich)
      await measure(cdp, FRAMES);
      await setCam(scene.cam);
      console.log(`\n=== ${scene.name} ===`);
      console.log('  Szene:', JSON.stringify(await cdp.eval('globalThis.__bwStats()')));
      for (const v of scene.views) {
        await setCam(v.cam);
        const raw = await measure(cdp, FRAMES);
        table(v.name, JSON.parse(raw));
        console.log('  Szene:', JSON.stringify(await cdp.eval('globalThis.__bwStats()')));
      }
      table('D Echtzeit (rAF + Rasterisierung, 5 s)', await realtime(cdp, scene.bench));
      console.log('  Szene:', JSON.stringify(await cdp.eval('globalThis.__bwStats()')));
    }

    const errors = cdp.events.filter((e) => e.method === 'Runtime.exceptionThrown');
    console.log(`\n· Seitenfehler: ${errors.length}`);
    for (const e of errors)
      console.log('  ' + (e.params.exceptionDetails?.text || 'exception'));
    cdp.close();
  } finally {
    chrome.kill();
    preview.kill();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
