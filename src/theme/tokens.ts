// Theme color tokens — values lifted verbatim from UI.md §Color System.
// Do not change without updating UI.md.

import type { ThemeId } from '@/types/settings';

export interface ColorTokens {
  bgPrimary: string;
  bgSecondary: string;
  textPrimary: string;
  textSecondary: string;
  accent: string;
  accentSoft: string;
  border: string;
}

export const THEMES: Record<ThemeId, { id: ThemeId; label: string; colors: ColorTokens }> = {
  lotus: {
    id: 'lotus',
    label: 'Lotus',
    colors: {
      bgPrimary: '#FAF8F4',
      bgSecondary: '#F2EDE6',
      textPrimary: '#1C1814',
      textSecondary: '#6B5E52',
      accent: '#C4956A',
      accentSoft: '#E8D5BC',
      border: '#E0D5C8',
    },
  },
  ashram: {
    id: 'ashram',
    label: 'Ashram',
    colors: {
      bgPrimary: '#2C2018',
      bgSecondary: '#3A2E22',
      textPrimary: '#F0E6D3',
      textSecondary: '#B8A48C',
      accent: '#D4A96A',
      accentSoft: '#4A3828',
      border: '#4A3828',
    },
  },
  night_puja: {
    id: 'night_puja',
    label: 'Night Puja',
    colors: {
      bgPrimary: '#0F1520',
      bgSecondary: '#1A2235',
      textPrimary: '#E8E0D0',
      textSecondary: '#8899AA',
      accent: '#D4AF70',
      accentSoft: '#2A3448',
      border: '#2A3448',
    },
  },
  saffron: {
    id: 'saffron',
    label: 'Saffron',
    colors: {
      bgPrimary: '#FF9933',
      bgSecondary: '#E8872A',
      textPrimary: '#1A0A00',
      textSecondary: '#5C2800',
      accent: '#8B0000',
      accentSoft: '#FFBB66',
      border: '#CC7722',
    },
  },
  minimalist: {
    id: 'minimalist',
    label: 'Minimalist',
    colors: {
      bgPrimary: '#111111',
      bgSecondary: '#1A1A1A',
      textPrimary: '#F0F0F0',
      textSecondary: '#888888',
      accent: '#F0F0F0',
      accentSoft: '#222222',
      border: '#333333',
    },
  },
};

// 8px-based spacing scale per UI.md §Spacing System.
export const SPACING = {
  micro: 4,
  xs: 8,
  sm: 16,
  md: 24,
  lg: 32,
  xl: 48,
  xxl: 64,
} as const;

// Type-size scale per UI.md §Typography System.
export const FONT_SIZE = {
  xs: 11,
  sm: 13,
  base: 16,
  md: 18,
  lg: 22,
  xl: 28,
  xxl: 36,
} as const;

// Font family names — must match keys passed to useFonts.
// Lora + DM Sans are loaded at startup; Indic Noto Serifs are lazy-loaded.
export const FONTS = {
  display: 'Lora-Bold',
  body: 'Lora-Regular',
  bodyItalic: 'Lora-Italic',
  // Romanised Sanskrit (IAST) — see fonts.ts for why this isn't Lora.
  transliteration: 'NotoSerif-Italic',
  ui: 'DMSans-Medium',
  uiBold: 'DMSans-Bold',
  devanagari: 'NotoSerifDevanagari',
  gujarati: 'NotoSerifGujarati',
  tamil: 'NotoSerifTamil',
} as const;
