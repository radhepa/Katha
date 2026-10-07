// Characters & Events — the reading companions. These are explanatory
// summaries written for Katha (not scripture text); every passage link
// points at a verse that exists in the bundled text, checked by
// scripts/verify-companions.mjs.

import type { BookId } from './scripture';

export interface CharacterGroup {
  id: string;
  book: BookId;
  label: string;
}

export interface Dilemma {
  // Characters: a short title. Events: the question at the heart of it.
  title: string;
  body: string;
}

export interface PassageLink {
  verseId: string;
  label: string;
}

export interface Character {
  id: string;
  name: string;
  // Name in Devanagari, as it appears in the Sanskrit text.
  sanskrit: string;
  aka: string[];
  role: string;
  books: BookId[];
  group: string;
  summary: string;
  dilemma?: Dilemma;
  relations: { id: string; label: string }[];
  read?: PassageLink[];
}

export interface StoryEvent {
  id: string;
  book: BookId;
  // Position in the story, within its book.
  order: number;
  title: string;
  // Human location label, e.g. "Sabha Parva" or "Ayodhya Kanda".
  where: string;
  summary: string;
  why: string;
  dilemma?: Dilemma;
  characters: string[];
  // Verse id where the episode starts in Katha's text.
  ref?: string;
  // Set when the episode is told in a part of the epic Katha doesn't carry yet.
  outside?: string;
}

export interface CharactersFile {
  groups: CharacterGroup[];
  characters: Character[];
}

export interface EventsFile {
  events: StoryEvent[];
}
