// Data access for Characters & Events. Both files are small, so they load on
// first use and stay cached; nothing here touches the full scripture JSON.

import type { BookId } from '@/types/scripture';
import type {
  Character,
  CharacterGroup,
  CharactersFile,
  EventsFile,
  StoryEvent,
} from '@/types/companions';

export const BOOK_ORDER: BookId[] = ['mahabharata', 'ramayana', 'gita'];

export const BOOK_SHORT: Record<BookId, string> = {
  gita: 'Gita',
  ramayana: 'Ramayana',
  mahabharata: 'Mahabharata',
};

let chars: CharactersFile | null = null;
let events: EventsFile | null = null;
let charById: Map<string, Character> | null = null;
let eventById: Map<string, StoryEvent> | null = null;
let eventsByVerse: Map<string, StoryEvent[]> | null = null;

function loadChars(): CharactersFile {
  if (!chars) {
    chars = require('../../assets/data/characters.json') as CharactersFile;
    charById = new Map(chars.characters.map((c) => [c.id, c]));
  }
  return chars;
}

function loadEvents(): EventsFile {
  if (!events) {
    events = require('../../assets/data/events.json') as EventsFile;
    const sorted = [...events.events].sort(
      (a, b) => BOOK_ORDER.indexOf(a.book) - BOOK_ORDER.indexOf(b.book) || a.order - b.order
    );
    events = { events: sorted };
    eventById = new Map(sorted.map((e) => [e.id, e]));
    eventsByVerse = new Map();
    for (const e of sorted) {
      if (!e.ref) continue;
      const list = eventsByVerse.get(e.ref) ?? [];
      list.push(e);
      eventsByVerse.set(e.ref, list);
    }
  }
  return events;
}

export function getCharacterGroups(): CharacterGroup[] {
  return loadChars().groups;
}

export function getCharacters(): Character[] {
  return loadChars().characters;
}

export function getCharacter(id: string): Character | null {
  loadChars();
  return charById!.get(id) ?? null;
}

// Events in story order: Mahabharata, then Ramayana, then the Gita.
export function getEvents(): StoryEvent[] {
  return loadEvents().events;
}

export function getEvent(id: string): StoryEvent | null {
  loadEvents();
  return eventById!.get(id) ?? null;
}

export function eventsForCharacter(id: string): StoryEvent[] {
  return getEvents().filter((e) => e.characters.includes(id));
}

// Events whose reading link starts at this verse — the Reader shows a small
// "story note" above it.
export function eventsStartingAt(verseId: string): StoryEvent[] {
  loadEvents();
  return eventsByVerse!.get(verseId) ?? [];
}

// The previous and next event in the same book's story order.
export function neighbours(e: StoryEvent): { prev: StoryEvent | null; next: StoryEvent | null } {
  const list = getEvents().filter((x) => x.book === e.book);
  const i = list.findIndex((x) => x.id === e.id);
  return { prev: i > 0 ? list[i - 1] : null, next: i >= 0 && i < list.length - 1 ? list[i + 1] : null };
}

// One event per day, the same for everyone on a given date (like the daily verses).
export function getDailyEvent(date: Date = new Date()): StoryEvent | null {
  const pool = getEvents().filter((e) => e.dilemma);
  if (pool.length === 0) return null;
  const day = Math.floor(date.getTime() / 86400000);
  // A different stride from the daily verses so the two don't move in lockstep.
  return pool[(day * 7) % pool.length];
}

const fold = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

export function matchesCharacter(c: Character, query: string): boolean {
  const q = fold(query.trim());
  if (!q) return true;
  return [c.name, c.role, c.sanskrit, ...c.aka].some((s) => fold(s).includes(q));
}

export function matchesEvent(e: StoryEvent, query: string): boolean {
  const q = fold(query.trim());
  if (!q) return true;
  return [e.title, e.where, e.summary].some((s) => fold(s).includes(q));
}
