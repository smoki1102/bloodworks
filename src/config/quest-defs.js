/* Feste Auftragskette – Metriken wertet core/quests.js aus. */
export const QUESTS = [
  { n: 'Erste Beute', d: 'Erlege 10 Sticks auf dem Band.', metric: 'kills', goal: 10, reward: 150 },
  {
    n: 'Lücke & Fang',
    d: 'Reiße eine Lücke ins Band und fange 5 Leichen im Container.',
    metric: 'caught',
    goal: 5,
    reward: 200,
  },
  {
    n: 'Bluthandel',
    d: 'Verkaufe 100 Blut über den Blutmarkt.',
    metric: 'sold',
    goal: 100,
    reward: 250,
  },
  {
    n: 'Schleudertest',
    d: 'Baue einen Abschleuderer über das Band.',
    metric: 'schleuder',
    goal: 1,
    reward: 200,
  },
  {
    n: 'Abgeworfen',
    d: 'Schleudere 10 Sticks vom Band – über Lücken oder den Abschleuderer.',
    metric: 'ejected',
    goal: 10,
    reward: 300,
  },
  {
    n: 'Schalterkritik',
    d: 'Wähle ein Gerät und schalte es mit E aus.',
    metric: 'toggled',
    goal: 1,
    reward: 100,
  },
  {
    n: 'Forschung starten',
    d: 'Erforsche eine Verbesserung für Blut.',
    metric: 'upg',
    goal: 1,
    reward: 200,
  },
  {
    n: 'Serienausstoß',
    d: 'Erreiche insgesamt 100 Kills.',
    metric: 'kills',
    goal: 100,
    reward: 500,
  },
];
