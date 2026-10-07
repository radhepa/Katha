// SQLite bootstrap. User data only — never put scripture content in here.
// Schema mirrors DATA.md §4 exactly.

import * as SQLite from 'expo-sqlite';

const SCHEMA = `
PRAGMA journal_mode = WAL;

CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS progress (
  book_id TEXT NOT NULL,
  verse_id TEXT NOT NULL,
  read_at INTEGER NOT NULL,
  PRIMARY KEY (book_id, verse_id)
);

CREATE TABLE IF NOT EXISTS bookmarks (
  verse_id TEXT PRIMARY KEY,
  book_id TEXT NOT NULL,
  created_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS streak (
  date TEXT PRIMARY KEY,
  verses_read INTEGER NOT NULL,
  goal_met INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS last_position (
  book_id TEXT PRIMARY KEY,
  verse_id TEXT NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS certificates (
  book_id TEXT PRIMARY KEY,
  completed_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS reading_time (
  book_id TEXT NOT NULL,
  date TEXT NOT NULL,
  seconds INTEGER NOT NULL,
  PRIMARY KEY (book_id, date)
);

CREATE INDEX IF NOT EXISTS progress_book_idx ON progress(book_id);
CREATE INDEX IF NOT EXISTS bookmarks_book_idx ON bookmarks(book_id);
`;

let db: SQLite.SQLiteDatabase | null = null;

export async function initDb(): Promise<SQLite.SQLiteDatabase> {
  if (db) return db;
  // The file keeps its pre-rename name: changing it would orphan every
  // existing reader's progress, bookmarks and streak history.
  db = await SQLite.openDatabaseAsync('dharma.db');
  await db.execAsync(SCHEMA);
  return db;
}

export function getDb(): SQLite.SQLiteDatabase {
  if (!db) throw new Error('SQLite not initialized. Call initDb() before any DAO.');
  return db;
}
