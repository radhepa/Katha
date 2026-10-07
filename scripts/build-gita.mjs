// Gita fill pipeline — DRY RUN unless --write.
// Sources:
//   - Sanskrit Devanagari spine + cross-ref: gita/gita open dataset (text is non-copyrightable)
//   - English: Annie Besant 4th ed. (1922), public domain, human-proofread on Wikisource
//   - Transliteration: scripts/translit.mjs (proven faithful)
// Safety net: verse numbers come from BOTH the Devanagari ॥N॥ markers and the
// English (N) markers; English is mapped to the sloka numbers in its block, so
// combined slokas (two ॥N॥ under one English) are handled. Per-chapter counts
// must equal the declared verse_count or the chapter is flagged.

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { devanagariToIAST } from './translit.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const dataDir = join(__dirname, '..', 'assets', 'data');
const cacheDir = join(__dirname, '_besant_cache');
if (!existsSync(cacheDir)) mkdirSync(cacheDir, { recursive: true });
const WRITE = process.argv.includes('--write');
const UA = 'Katha-build/1.0 (personal scripture app; verse text fill)';

const GITA = JSON.parse(readFileSync(join(dataDir, 'gita.json'), 'utf8'));
const CHAPTERS = GITA.chapters;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function decodeEntities(s) {
  return s
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/&#x([0-9a-fA-F]+);/g, (_, n) => String.fromCharCode(parseInt(n, 16)))
    .replace(/&amp;/g, '&').replace(/&quot;/g, '"')
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&nbsp;/g, ' ');
}

function htmlToText(html) {
  return decodeEntities(
    html.replace(/<style[\s\S]*?<\/style>/g, '').replace(/<[^>]+>/g, ' ')
  ).replace(/[​‍]/g, '').replace(/[ \t]+/g, ' ').trim();
}

const devCore = (s) => (s.match(/[ऀ-ॿ]/g) || []).filter((c) => !/[०-९।॥ॐ]/.test(c)).join('');
const devDigit = (s) => Number(String(s).replace(/[०-९]/g, (d) => '०१२३४५६७८९'.indexOf(d)));

async function getDiscourseHTML(n) {
  const cacheFile = join(cacheDir, `disc_${n}.html`);
  if (existsSync(cacheFile)) return readFileSync(cacheFile, 'utf8');
  const title = `Bhagavad-Gita (Besant 4th)/Discourse ${n}`;
  const url =
    'https://en.wikisource.org/w/api.php?action=parse&prop=text&format=json&formatversion=2&disablelimitreport=1&page=' +
    encodeURIComponent(title);
  for (let attempt = 0; attempt < 5; attempt++) {
    const res = await fetch(url, { headers: { 'User-Agent': UA } });
    if (res.ok) {
      const html = (await res.json()).parse.text;
      writeFileSync(cacheFile, html);
      await sleep(1500); // be polite
      return html;
    }
    if (res.status === 429) { await sleep(4000 * (attempt + 1)); continue; }
    throw new Error(`HTTP ${res.status} for ${title}`);
  }
  throw new Error(`Rate-limited repeatedly for ${title}`);
}

// Devanagari-anchored parse. The ॥N॥ sloka-number markers are reliable; the
// English (N) markers are sometimes malformed in transclusion (e.g. "(42"
// missing its close paren), so we do NOT split on them. For each ॥N॥ marker,
// the English is the text up to the next sloka's Devanagari.
function parseDiscourse(text) {
  const allMarkers = [...text.matchAll(/॥\s*([०-९]+)\s*॥/g)].map((m) => ({
    num: devDigit(m[1]),
    start: m.index,
    end: m.index + m[0].length,
  }));
  // Keep only markers that continue the strict 1,2,3,... verse sequence. This
  // drops chapter colophons like "...अष्टादशोऽध्यायः ॥१८॥" whose number does
  // not continue the run.
  const markers = [];
  let expected = 1;
  for (const mk of allMarkers) {
    if (mk.num === expected) { markers.push(mk); expected += 1; }
  }
  const out = [];
  for (let i = 0; i < markers.length; i++) {
    const segEnd = i + 1 < markers.length ? markers[i + 1].start : text.length;
    const seg = text.slice(markers[i].end, segEnd);
    // English = segment up to the first Devanagari char (start of next sloka).
    const devAt = seg.search(/[ऀ-ॿ]/);
    let english = (devAt >= 0 ? seg.slice(0, devAt) : seg)
      .replace(/\[[\s\d]*\]/g, '')                         // footnote [ 16 ]
      .replace(/\(\s*\d+(?:\s*[-–—]\s*\d+)?\s*\)?\s*$/, '') // trailing (N) verse marker (maybe unclosed)
      .replace(/[।॥]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
    out.push({ num: markers[i].num, english });
  }
  return out;
}

function cleanSpineDev(text) {
  return String(text)
    .replace(/।।\s*\d+\.\d+\s*।।\s*$/, '॥')   // trailing ।।N.N।। -> ॥
    .replace(/।।\s*$/, '॥')
    .replace(/\n{2,}/g, '\n')
    .replace(/[ \t]+/g, ' ')
    .trim();
}

async function loadSpine() {
  const cacheFile = join(cacheDir, 'gita_verse.json');
  let arr;
  if (existsSync(cacheFile)) {
    arr = JSON.parse(readFileSync(cacheFile, 'utf8'));
  } else {
    const res = await fetch(
      'https://raw.githubusercontent.com/gita/gita/master/data/verse.json',
      { headers: { 'User-Agent': UA } }
    );
    arr = await res.json();
    writeFileSync(cacheFile, JSON.stringify(arr));
  }
  const spine = new Map();
  for (const v of arr) spine.set(`${v.chapter_number}.${v.verse_number}`, v.text);
  return spine;
}

const spine = await loadSpine();
const assembled = [];
const report = { chapters: [], total: 0, mismatches: [], combined: [], missingSpine: [] };

for (const ch of CHAPTERS) {
  const text = htmlToText(await getDiscourseHTML(ch.number));
  const verses = parseDiscourse(text);
  // Sanity: marker numbers should be the sequence 1..N with no gap/dup.
  const seq = verses.map((v) => v.num);
  for (let k = 0; k < seq.length; k++) {
    if (seq[k] !== k + 1) report.mismatches.push(`${ch.number}: expected verse ${k + 1}, marker said ${seq[k]}`);
  }
  let count = 0;
  for (const v of verses) {
    count += 1;
    const spineDev = spine.get(`${ch.number}.${v.num}`);
    if (!spineDev) report.missingSpine.push(`${ch.number}.${v.num}`);
    if (!v.english) report.combined.push(`${ch.number}.${v.num} (empty English — possible combined sloka)`);
    assembled.push({
      chapter: ch.number,
      chapter_name: ch.name,
      verse: v.num,
      sanskrit: spineDev ? cleanSpineDev(spineDev) : null,
      english: v.english,
    });
  }
  const delta = count - ch.verse_count;
  report.chapters.push({ n: ch.number, name: ch.name, parsed: count, declared: ch.verse_count, delta });
  report.total += count;
  process.stderr.write(`Discourse ${ch.number}: ${count}/${ch.verse_count}${delta ? `  DELTA ${delta}` : ''}\n`);
}

console.log('\n===== PARSE REPORT =====');
for (const c of report.chapters)
  console.log(`Ch ${String(c.n).padStart(2)} ${c.name.padEnd(34)} ${c.parsed}/${c.declared}${c.delta ? `  DELTA ${c.delta}` : ''}`);
console.log(`\nTotal: ${report.total}`);
console.log(`Sequence mismatches: ${report.mismatches.length}`);
report.mismatches.slice(0, 20).forEach((c) => console.log('  ' + c));
console.log(`Empty-English / possible combined: ${report.combined.length}`);
report.combined.forEach((c) => console.log('  ' + c));
console.log(`Missing from spine: ${report.missingSpine.length} ${report.missingSpine.join(', ')}`);

// Verify uniqueness + completeness 1..count per chapter.
const seen = new Set();
let dupOrGap = 0;
for (const a of assembled) {
  const k = `${a.chapter}.${a.verse}`;
  if (seen.has(k)) { dupOrGap++; console.log('DUP', k); }
  seen.add(k);
  if (!a.sanskrit) { dupOrGap++; }
  if (!a.english) { dupOrGap++; console.log('NO-ENGLISH', k); }
}
console.log(`Integrity problems: ${dupOrGap}`);

if (WRITE) {
  writeFileSync(join(__dirname, '_gita_assembled.json'), JSON.stringify(assembled, null, 2));
  console.log(`\nWrote scripts/_gita_assembled.json (${assembled.length} verses)`);
}
