// Checks assets/data/characters.json and events.json against the bundled
// scripture so a guide can never point at a passage that doesn't exist.
//
//   - every id is unique, every group / relation / event character resolves
//   - every passage link (character "read" lists, event "ref") is a real verse
//   - every Devanagari name appears in the Sanskrit of the books it is tied to
//   - events are either linked to a passage or marked as told "outside" the
//     parvas Katha carries
//
// Run: node scripts/verify-companions.mjs   (exits 1 on any problem)

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.join(__dirname, '..', 'assets', 'data');
const read = (f) => JSON.parse(fs.readFileSync(path.join(dataDir, f), 'utf8'));

const BOOKS = ['gita', 'ramayana', 'mahabharata'];
const verseIds = new Map();
const sanskrit = {};
for (const b of BOOKS) {
  const book = read(`${b}.json`);
  verseIds.set(b, new Set(book.verses.map((v) => v.id)));
  sanskrit[b] = book.verses.map((v) => v.sanskrit).join('\n').normalize('NFC');
}
const bookOfVerse = (id) => (id.startsWith('gita_') ? 'gita' : id.startsWith('ramayana_') ? 'ramayana' : id.startsWith('mbh_') ? 'mahabharata' : null);
const verseExists = (id) => {
  const b = bookOfVerse(id);
  return !!b && verseIds.get(b).has(id);
};

const { groups, characters } = read('characters.json');
const { events } = read('events.json');
const problems = [];
const fail = (msg) => problems.push(msg);

const groupIds = new Set(groups.map((g) => g.id));
const charIds = new Set();
for (const c of characters) {
  if (charIds.has(c.id)) fail(`duplicate character id ${c.id}`);
  charIds.add(c.id);
}

for (const c of characters) {
  if (!groupIds.has(c.group)) fail(`${c.id}: unknown group ${c.group}`);
  for (const b of c.books) if (!BOOKS.includes(b)) fail(`${c.id}: unknown book ${b}`);
  for (const r of c.relations) if (!charIds.has(r.id)) fail(`${c.id}: relation to unknown ${r.id}`);
  for (const p of c.read ?? []) if (!verseExists(p.verseId)) fail(`${c.id}: missing verse ${p.verseId}`);
  for (const part of c.sanskrit.split(' · ')) {
    const name = part.normalize('NFC');
    if (!c.books.some((b) => sanskrit[b].includes(name))) fail(`${c.id}: "${part}" not found in the Sanskrit of ${c.books.join('/')}`);
  }
}

const eventIds = new Set();
for (const e of events) {
  if (eventIds.has(e.id)) fail(`duplicate event id ${e.id}`);
  eventIds.add(e.id);
  if (!BOOKS.includes(e.book)) fail(`${e.id}: unknown book ${e.book}`);
  for (const id of e.characters) if (!charIds.has(id)) fail(`${e.id}: unknown character ${id}`);
  if (e.ref) {
    if (!verseExists(e.ref)) fail(`${e.id}: missing verse ${e.ref}`);
    else if (bookOfVerse(e.ref) !== e.book) fail(`${e.id}: ref ${e.ref} is not in ${e.book}`);
  } else if (!e.outside) {
    fail(`${e.id}: needs either a ref or an "outside" note`);
  }
}
for (const b of BOOKS) {
  const orders = events.filter((e) => e.book === b).map((e) => e.order);
  if (new Set(orders).size !== orders.length) fail(`${b}: duplicate event order numbers`);
}

const linked = events.filter((e) => e.ref).length;
const dilemmas = events.filter((e) => e.dilemma).length;
console.log(
  `${characters.length} characters · ${events.length} events (${linked} linked to the text, ${events.length - linked} summary only, ${dilemmas} with a dilemma)`
);
if (problems.length) {
  console.error(problems.map((p) => '  ✗ ' + p).join('\n'));
  process.exit(1);
}
console.log('All links, names and references check out.');
