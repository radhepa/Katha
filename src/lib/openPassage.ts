import { useReaderStore } from '@/store/reader';
import { parseVerseId } from '@/lib/scripture';

// Opens the full-screen Reader scrolled to a verse. Used by Home, Library,
// search results, bookmarks, and the Characters & Events pages. The verse id
// carries its own book and chapter, so nothing is loaded until the Reader mounts.
export function openPassage(navigation: { navigate: (name: string) => void }, verseId: string): boolean {
  const p = parseVerseId(verseId);
  if (!p) return false;
  useReaderStore.getState().openBook(p.book, p.chapter, verseId);
  navigation.navigate('Reader');
  return true;
}
