// Font loading — UI fonts always at startup, Indic scripts loaded on demand.
// Per DONTS.md: never preload every script at startup.

import { useFonts as useExpoFonts } from 'expo-font';
import {
  Lora_400Regular,
  Lora_400Regular_Italic,
  Lora_700Bold,
} from '@expo-google-fonts/lora';
import {
  DMSans_500Medium,
  DMSans_700Bold,
} from '@expo-google-fonts/dm-sans';
import { NotoSerifDevanagari_400Regular } from '@expo-google-fonts/noto-serif-devanagari';
import { NotoSerif_400Regular_Italic } from '@expo-google-fonts/noto-serif';
import { NotoSerifGujarati_400Regular } from '@expo-google-fonts/noto-serif-gujarati';
import { NotoSerifTamil_400Regular } from '@expo-google-fonts/noto-serif-tamil';
import { useSettingsStore } from '@/store/settings';
import type { UiLang } from '@/types/scripture';

// Always-on UI fonts. The reader is unusable without these.
const UI_FONTS = {
  'Lora-Regular': Lora_400Regular,
  'Lora-Italic': Lora_400Regular_Italic,
  'Lora-Bold': Lora_700Bold,
  'DMSans-Medium': DMSans_500Medium,
  'DMSans-Bold': DMSans_700Bold,
  // Devanagari covers Hindi + Sanskrit — Sanskrit is always shown in the reader,
  // so this counts as a "UI" requirement and ships with the base bundle.
  NotoSerifDevanagari: NotoSerifDevanagari_400Regular,
  // Transliteration needs the full IAST set (ṁ ṃ ṇ ṣ ṭ ḍ ḥ ṛ ...). Lora has
  // none of the dotted letters, so browsers patch them together from parts
  // and the dots land in the wrong place. Noto Serif carries them all.
  'NotoSerif-Italic': NotoSerif_400Regular_Italic,
};

// Lazy fonts — only loaded if user picks that language.
function scriptFontFor(lang: UiLang): Record<string, any> {
  switch (lang) {
    case 'gu':
      return { NotoSerifGujarati: NotoSerifGujarati_400Regular };
    case 'ta':
      return { NotoSerifTamil: NotoSerifTamil_400Regular };
    default:
      return {};
  }
}

export function useFontLoader(): { loaded: boolean; error: Error | null } {
  const lang = useSettingsStore((s) => s.settings.language);
  const fontMap = { ...UI_FONTS, ...scriptFontFor(lang) };
  const [loaded, error] = useExpoFonts(fontMap);
  return { loaded, error };
}
