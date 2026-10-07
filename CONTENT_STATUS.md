# Content Status — V1 Seed

This file tracks the state of bundled scripture content vs. the production target
defined in `DATA.md` (which lives in the user's spec folder, not committed here).

## TL;DR

The JSON files under `assets/data/` are **a verified seed for pipeline testing,
not the production content**. The full text-sourcing track (per DATA.md §5)
is a separate workstream that must run before V1 ship.

## Current state (updated 2026-06-11)

| File | Verses | Translation | Explanations | Status |
|---|---|---|---|---|
| `gita.json` | **701 (complete)** | English — Annie Besant, 1922 (public domain) | 9 curated; 692 pending | **FILLED + verified** |
| `ramayana.json` | **15,187 (ALL 7 Kandas, 605/606 sargas)** | English — M. N. Dutt, 1891–94 (PD); Sanskrit — critical edition e-text (PD) | pending | **FILLED + fuzzy cross-verified** |
| `mahabharata.json` | **38,425 (6 curated parvas, 1,261/1,263 adhyayas)** | English — M. N. Dutt, 1895–1905 (PD); Sanskrit — BORI critical edition e-text (PD) | 1 (mangalacharana, carried from seed) | **FILLED + fuzzy cross-verified** |
| `calendar.json` | 7 holidays for 2026 | n/a | n/a | verify dates before ship |

Mahabharata scope per FEATURES.md: the six curated core parvas — Adi, Sabha, Vana,
Udyoga, Bhishma, Shanti (app parva numbers 1–6 = BORI books 1/2/3/5/6/12). 86.9%
of the BORI CE verses in those parvas cross-verified and shipped; the rest dropped,
never guessed. Audit trail: `scripts/_mahabharata_run_report.json` + `_mahabharata_pairs.json`.

**Attribution correction (2026-06-11):** the Sanskrit e-text from bombay.indology.info
was previously labeled "Bombay recension". The site states it is **"the electronic
text of the critical edition of the Rāmāyaṇa"** (Tokunaga/Smith — Baroda CE), and the
sarga counts (76/111/71/66/66/116/100) confirm it. References in the app use CE
numbering. Corrected in `ramayana.json` meta.source and all reports this run.

Ramayana coverage detail: 15,187 of 18,761 CE verses shipped (81.0%). The 3,574
unshipped verses are ones where Dutt's paragraph-grained prose (or gaps/OCR noise in
the Itihāsa corpus) left no cross-verifiable English — dropped per the cardinal rule,
never guessed. Per-kanda: Bala 1,553/1,941 · Ayodhya 2,722/3,160 · Aranya 1,639/2,060 ·
Kishkindha 1,598/1,987 · Sundara 1,990/2,487 · Yuddha 3,677/4,436 · Uttara 2,008/2,690.
Only sarga 6.112 shipped zero verses. Full audit trail: `scripts/_ramayana_run_report.json`
and `scripts/_ramayana_pairs.json`.

See `FILL_SUMMARY.md`, `VERIFICATION_LOG.md`, `FLAGGED_VERSES.md` for the Gita fill detail
(sources, the Ch13=35 recension note, the BG 18.66 variant, and what remains).

## Characters & Events (added 2026-10-06)

`characters.json` (54 people) and `events.json` (58 episodes) power the
Characters and Events tabs. They are **explanatory guides written for Katha,
not scripture**: short descriptions, why each episode happens, and the moral
dilemmas the texts raise, in the explanatory (not devotional) tone of DATA.md.
They follow the critical editions the app ships and say so where popular
retellings differ (Lakshmana's line, Shabari's berries, Draupadi's prayer to
Krishna, Ahalya turned to stone, Shakuni's revenge motive).

- 52 events link to the verse where the episode begins; the Reader shows a
  "story note" above that verse. 6 Mahabharata events (Virata, Drona, Karna,
  Shalya and Sauptika Parvas) are summaries only, because those parvas are not
  in the bundled text.
- `node scripts/verify-companions.mjs` checks every passage link against the
  bundled verses, every cross-reference between characters and events, and
  that every Devanagari name appears in the Sanskrit of its book. Run it after
  any edit to either file.

## Generated index files

`index.json` (book meta, chapter lists, sarga/adhyaya jump points) and
`daily.json` (the daily-verse pool) are generated from the three book files so
Home and Library never parse the full texts. Re-run
`node scripts/build-index.mjs` after any change to `gita.json`,
`ramayana.json` or `mahabharata.json`.

## Why so small

Per `DONTS.md`:
- **Never generate or reconstruct scripture text.** Sanskrit must come from verified
  source texts only. Each Sanskrit verse in the seed is one that is reproduced
  identically across the most widely cited print and digital editions (Sacred
  Texts, GRETIL, ISKCON, Gita Press) and that I could include with high
  confidence in the exact reading.
- **Do not ship unreviewed translations.** Hindi / Gujarati / Tamil
  translations and the non-English explanations are intentionally omitted from
  this seed. They must be authored, or drafted and then human-reviewed, per
  DATA.md §5 before ship.

## What remains to do before V1 ship

1. Source full Sanskrit + transliteration for all 700 Gita verses from GRETIL
   or Sacred Texts. Cross-reference at least two editions per verse.
2. License or include public-domain English translations for all 700 Gita
   verses (Sivananda is public domain; Prabhupada requires ISKCON licensing
   confirmation per DATA.md §5).
3. ~~Source curated Ramayana Sarga set (Valmiki) per the "full text, 7 Kandas"
   line in FEATURES.md.~~ **DONE 2026-06-11** — all 7 kandas, 15,187 cross-verified
   verses. Optional follow-up: human review of the 986 low-confidence pairings
   listed in `scripts/_ramayana_run_report.json`.
4. ~~Source the six curated Mahabharata Parvas (Adi, Sabha, Vana, Udyoga,
   Bhishma, Shanti) per FEATURES.md §1.~~ **DONE 2026-06-11** — 38,425
   cross-verified verses. Optional follow-up: human review of the 2,833
   low-confidence pairings listed in `scripts/_mahabharata_run_report.json`.
5. Draft Hindi / Gujarati / Tamil translations, then human review
   for accuracy and tone — only ship after sign-off.
6. Draft English / Hindi / Gujarati / Tamil explanations in the explanatory
   (not devotional) tone described in DATA.md §5, with human review.
7. Verify all 2026 holiday dates with a panchang authority before ship.
   The current dates in `calendar.json` are conservative best-knowledge
   placeholders.
8. Curate `daily_quote_eligible: true` on ~150–200 verses per text per
   DATA.md §6.

## Why the app still works with this seed

The reader, library, daily-quote, calendar, and holiday-verse-tie-in screens
read from the same JSON schema regardless of how many verses are present.
The seed verifies the rendering pipeline end-to-end. As the production content
files drop in, no code changes are needed.
