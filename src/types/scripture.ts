// Scripture content types — matches DATA.md schemas exactly.
// All scripture content is read-only and lives in bundled JSON.

export type BookId = 'gita' | 'ramayana' | 'mahabharata';

export type TranslationKey =
  | 'english'
  | 'sanskrit'
  | 'transliteration'
  | 'hi'
  | 'gu'
  | 'ta';

export type ExplanationLang = 'en' | 'hi' | 'gu' | 'ta';

export type UiLang = 'en' | 'hi' | 'gu' | 'ta';

export type Script = 'Latin' | 'Devanagari' | 'Gujarati' | 'Tamil';

export interface VerseBase {
  id: string;
  book: BookId;
  verse: number;
  sanskrit: string;
  transliteration: string;
  translations: Partial<Record<TranslationKey, string>>;
  explanations: Partial<Record<ExplanationLang, string>>;
  daily_quote_eligible: boolean;
  holiday_tags: string[];
}

export interface GitaVerse extends VerseBase {
  book: 'gita';
  chapter: number;
  chapter_name: string;
}

export interface RamayanaVerse extends VerseBase {
  book: 'ramayana';
  kanda: number;
  kanda_name: string;
  sarga: number;
  sarga_name: string;
}

export interface MahabharataVerse extends VerseBase {
  book: 'mahabharata';
  parva: number;
  parva_name: string;
  chapter: number;
}

export type Verse = GitaVerse | RamayanaVerse | MahabharataVerse;

// A Ramayana sarga or Mahabharata adhyaya inside a kanda/parva, with the id
// of its first bundled verse (generated into index.json).
export interface SubUnitIndex {
  n: number;
  first: string;
  count: number;
}

export interface ChapterIndex {
  number: number;
  name: string;
  verse_count: number;
  subunits?: SubUnitIndex[];
}

export interface BookMeta {
  id: BookId;
  title: string;
  subtitle: string;
  total_chapters: number;
  total_verses: number;
  structure_unit: 'chapter' | 'kanda' | 'parva';
  structure_label: string;
  sub_structure_unit: 'sarga' | 'adhyaya' | null;
  language_of_origin: 'Sanskrit';
  tradition: 'Hindu';
  icon: 'lotus' | 'bow' | 'chariot';
}

export interface BookFile {
  meta: BookMeta;
  chapters: ChapterIndex[];
  verses: Verse[];
}

// assets/data/index.json — built by scripts/build-index.mjs.
export interface BookIndexFile {
  books: Record<BookId, { meta: BookMeta; chapters: ChapterIndex[] }>;
}

// assets/data/daily.json — every daily_quote_eligible verse, in book order.
export interface DailyFile {
  verses: Verse[];
}

export interface Holiday {
  id: string;
  name: string;
  name_hi: string;
  name_gu: string;
  name_ta: string;
  date: string;
  description_en: string;
  description_hi: string;
  description_gu: string;
  description_ta: string;
  tied_verses: string[];
  type: 'major' | 'minor' | 'ekadashi';
  recurring: boolean;
}

export interface CalendarFile {
  year: number;
  holidays: Holiday[];
}
