import { describe, it, expect } from 'vitest';
import { galleryHtml } from '../src/ui/gallery.js';
import { ICONS } from '../src/render/icons.js';

describe('Dev-Galerie (?ui / ?gallery)', () => {
  it('enthält alle Abschnitte', () => {
    const html = galleryHtml('gallery');
    for (const title of [
      'Farben',
      'Abstände',
      'Typografie',
      'Buttons',
      'Statusbalken',
      'Baukarten',
      'Toasts',
      'Icons',
    ])
      expect(html).toContain(title);
  });

  it('listet jedes Icon mit Namen', () => {
    const html = galleryHtml('gallery');
    for (const name of Object.keys(ICONS)) expect(html).toContain(`<small>${name}</small>`);
  });

  it('nennt den Modus im Kopf', () => {
    expect(galleryHtml('ui')).toContain('UI-Komponenten');
    expect(galleryHtml('gallery')).toContain('Stil-Galerie');
  });

  it('rendert Token-Namen und keine leeren Werte', () => {
    const html = galleryHtml('gallery');
    expect(html).toContain('sp1');
    expect(html).toContain('r1');
    expect(html).not.toContain('<code></code>');
  });
});
