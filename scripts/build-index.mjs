// Builds the two small files the app reads at startup so Home and Library
// never have to parse the full scripture JSON (~40 MB) just to show titles,
// chapter lists and the daily verses:
//
//   assets/data/index.json  - meta + chapter list for each book
//   assets/data/daily.json  - every daily_quote_eligible verse, in book order
//
// Re-run after any change to gita.json / ramayana.json / mahabharata.json:
//   node scripts/build-index.mjs

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.join(__dirname, '..', 'assets', 'data');
const BOOKS = ['gita', 'ramayana', 'mahabharata'];

const index = { books: {} };
const daily = { verses: [] };

for (const id of BOOKS) {
  const book = JSON.parse(fs.readFileSync(path.join(dataDir, `${id}.json`), 'utf8'));
  // `source` blocks are long provenance notes; the app only needs the display meta.
  const { source, ...meta } = book.meta;
  // Sub-units (Ramayana sargas, Mahabharata adhyayas) with their first
  // bundled verse, so the chapter picker can jump straight to one.
  const subs = new Map();
  for (const v of book.verses) {
    if (v.daily_quote_eligible) daily.verses.push(v);
    if (id === 'gita') continue;
    const top = id === 'ramayana' ? v.kanda : v.parva;
    const sub = id === 'ramayana' ? v.sarga : v.chapter;
    if (!subs.has(top)) subs.set(top, new Map());
    const m = subs.get(top);
    if (!m.has(sub)) m.set(sub, { n: sub, first: v.id, count: 0 });
    m.get(sub).count++;
  }
  const chapters = book.chapters.map((c) => {
    const m = subs.get(c.number);
    return m ? { ...c, subunits: [...m.values()].sort((a, b) => a.n - b.n) } : c;
  });
  index.books[id] = { meta, chapters };
}

fs.writeFileSync(path.join(dataDir, 'index.json'), JSON.stringify(index) + '\n');
fs.writeFileSync(path.join(dataDir, 'daily.json'), JSON.stringify(daily, null, 1) + '\n');
console.log(`index.json: ${BOOKS.length} books · daily.json: ${daily.verses.length} verses`);
