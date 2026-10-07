/**
 * Tutorial als reine Daten: feste Zielzellen in einer leeren Welt.
 * `need.bld` ist erfüllt, wenn ein Gebäude vom Typ die Zellen abdeckt;
 * `need.custom` prüft einen Spezialfall (siehe ui/ui.js).
 * `cells` markiert die Stelle im Raum, `item` die Baukarte in der Liste.
 */
export const TUT_STEPS = [
  {
    id: 'spawn',
    item: 'spawn',
    text: 'Baue den <b>Eingang</b> hier. Er setzt frische Sticks aufs Band – die ganze Kette beginnt bei ihm.',
    need: { bld: 'spawn', cells: [[10, 56]] },
    cells: [
      [10, 56],
      [11, 56],
    ],
  },
  {
    id: 'belt1',
    item: 'belt',
    text: 'Zieh ein <b>Förderband</b> vom Eingang nach rechts. Bänder verbinden sich automatisch – mit <b>R</b> drehst du die Richtung.',
    need: {
      bld: 'belt',
      cells: [
        [12, 56],
        [13, 56],
        [14, 56],
      ],
    },
    cells: [
      [12, 56],
      [13, 56],
      [14, 56],
    ],
  },
  {
    id: 'spike',
    item: 'spike',
    text: 'Stelle die <b>Spikes-Walze</b> direkt ins Band. Sie reißt Gliedmaßen ab – im Inspektor wählst du später ein Zielkörperteil.',
    need: { bld: 'spike', cells: [[15, 56]] },
    cells: [
      [15, 56],
      [16, 56],
    ],
  },
  {
    id: 'belt2',
    item: 'belt',
    text: 'Führe das Band hinter der Walze weiter bis zum Container.',
    need: {
      bld: 'belt',
      cells: [
        [17, 56],
        [18, 56],
        [19, 56],
      ],
    },
    cells: [
      [17, 56],
      [18, 56],
      [19, 56],
    ],
  },
  {
    id: 'bin',
    item: 'bin',
    text: 'Der <b>Container</b> fängt alles, was am Bandende ankommt. Er verwandelt die Ware in Blut und Asche.',
    need: { bld: 'bin', cells: [[20, 56]] },
    cells: [
      [20, 56],
      [21, 56],
    ],
  },
  {
    id: 'drain',
    item: 'drain',
    text: 'Der <b>Abfluss</b> saugt das Blut vom Boden auf – er braucht Platz direkt über dem Boden.',
    need: { bld: 'drain', cells: [[19, 63]] },
    cells: [
      [19, 63],
      [19, 62],
    ],
  },
  {
    id: 'tank',
    item: 'tank',
    text: 'Der <b>Bluttank</b> daneben speichert das Blut und schafft Kapazität.',
    need: { bld: 'tank', cells: [[17, 63]] },
    cells: [
      [17, 63],
      [18, 63],
    ],
  },
  {
    id: 'market',
    item: 'market',
    text: 'Der <b>Blutmarkt</b> verkauft das Blut – er braucht den Tank in seinem Netz.',
    need: { bld: 'market', cells: [[17, 62]] },
    cells: [
      [17, 62],
      [18, 62],
    ],
  },
  {
    id: 'pipes',
    item: 'pipe',
    text: 'Verbinde Markt, Tank und Abfluss mit <b>Blut-Pipes</b>. Ein Netz bringt das Blut dorthin, wo es gebraucht wird.',
    need: { custom: 'pipes' },
    cells: [
      [16, 63],
      [16, 62],
      [19, 62],
    ],
  },
  {
    id: 'run',
    text: 'Drücke <b>Start</b> und lass die Anlage laufen.',
    need: { custom: 'run' },
    cells: [],
  },
  {
    id: 'reserve',
    item: 'market',
    text: 'Wähle den <b>Blutmarkt</b> und stelle im Inspektor die <b>Blutreserve</b> ein: Sie bleibt im Tank, damit der Generator nicht ohne Blut dasteht.',
    need: { custom: 'reserve' },
    cells: [
      [17, 62],
      [18, 62],
    ],
  },
  {
    id: 'skill',
    text: 'Die <b>Forschung</b> öffnet das große Fenster mit dem <b>Skill-Netz</b>. Präzision kostet Blut, alles andere Körperteile – hier ist ein Startvorrat.',
    need: { custom: 'skill' },
    cells: [],
    gift: true,
  },
];
