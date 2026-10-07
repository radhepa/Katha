import React, { memo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Bookmark, Info } from 'lucide-react-native';
import { useTheme } from '@/theme/ThemeProvider';
import type { Verse, TranslationKey, Script } from '@/types/scripture';

interface Props {
  verse: Verse;
  translationKey: TranslationKey;
  translationText: string | null;
  bookmarked: boolean;
  explained: boolean;
  fontScale?: number;
  // Receive the verse so parents can pass one stable callback to every block
  // (keeps memo() effective across thousands of verses).
  onPressExplain: (verse: Verse) => void;
  onToggleBookmark: (verse: Verse) => void;
}

const SANSKRIT_LINE_HEIGHT_MULT = 1.9;
const BODY_LINE_HEIGHT_MULT = 1.65;

// Script-aware font family for the translation panel.
// Sanskrit + Transliteration have their own rendering above; this is only for
// the language-translation text below the divider.
function fontFamilyForTranslation(
  translationKey: TranslationKey,
  fonts: ReturnType<typeof useTheme>['fonts']
): string {
  switch (translationKey) {
    case 'hi':
    case 'sanskrit':
      return fonts.devanagari;
    case 'gu':
      return fonts.gujarati;
    case 'ta':
      return fonts.tamil;
    case 'transliteration':
      return fonts.transliteration;
    default:
      return fonts.body;
  }
}

function VerseBlockImpl({
  verse,
  translationKey,
  translationText,
  bookmarked,
  explained,
  fontScale = 1,
  onPressExplain,
  onToggleBookmark,
}: Props) {
  const theme = useTheme();
  const translationFont = fontFamilyForTranslation(translationKey, theme.fonts);

  return (
    <View style={{ flexDirection: 'row', paddingVertical: theme.spacing.md }}>
      {/* Explain button — Gita only; hidden for Ramayana and Mahabharata until explanations are added */}
      {verse.book === 'gita' ? (
        <View style={{ width: 32, paddingTop: 6, alignItems: 'center' }}>
          <Pressable
            onPress={() => onPressExplain(verse)}
            hitSlop={11}
            accessibilityRole="button"
            accessibilityLabel={`Open explanation for verse ${verse.verse}`}
            style={{
              width: 22,
              height: 22,
              borderRadius: 11,
              borderWidth: 1,
              borderColor: explained ? theme.colors.accent : theme.colors.border,
              backgroundColor: explained ? theme.colors.accent : 'transparent',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Info
              size={12}
              strokeWidth={2}
              color={explained ? theme.colors.bgPrimary : theme.colors.textSecondary}
            />
          </Pressable>
        </View>
      ) : (
        <View style={{ width: 8 }} />
      )}

      <View style={{ flex: 1 }}>
        {/* Verse number marker — accent gold gives the page a quiet rhythm. */}
        <Text
          style={{
            fontFamily: theme.fonts.ui,
            fontSize: theme.fontSize.xs,
            color: theme.colors.accent,
            marginBottom: 6,
            textTransform: 'uppercase',
            letterSpacing: 1.2,
          }}
        >
          Verse {verse.verse}
        </Text>

        {/* Sanskrit — full, never truncated per DONTS.md */}
        <Text
          selectable
          style={{
            fontFamily: theme.fonts.devanagari,
            fontSize: theme.fontSize.md * fontScale,
            color: theme.colors.textPrimary,
            lineHeight: theme.fontSize.md * fontScale * SANSKRIT_LINE_HEIGHT_MULT,
          }}
        >
          {verse.sanskrit}
        </Text>

        {/* Transliteration — smaller, muted, italic */}
        <Text
          selectable
          style={{
            // The font file is already italic; adding fontStyle would make
            // browsers slant it a second time.
            fontFamily: theme.fonts.transliteration,
            fontSize: theme.fontSize.sm * fontScale,
            color: theme.colors.textSecondary,
            marginTop: theme.spacing.xs,
            lineHeight: theme.fontSize.sm * fontScale * BODY_LINE_HEIGHT_MULT,
          }}
        >
          {verse.transliteration}
        </Text>

        {/* Verse divider — thin line */}
        <View
          style={{
            height: 1,
            backgroundColor: theme.colors.border,
            marginVertical: theme.spacing.sm,
            opacity: 0.6,
          }}
        />

        {/* Translation row: text + bookmark icon */}
        <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12 }}>
          <Text
            selectable
            style={{
              flex: 1,
              fontFamily: translationFont,
              fontSize: theme.fontSize.base * fontScale,
              color: theme.colors.textPrimary,
              lineHeight: theme.fontSize.base * fontScale * BODY_LINE_HEIGHT_MULT,
              textAlign: 'left',
            }}
          >
            {translationText ?? '— translation not available for the selected language —'}
          </Text>
          <Pressable
            onPress={() => onToggleBookmark(verse)}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel={bookmarked ? 'Remove bookmark' : 'Add bookmark'}
            style={{ paddingTop: 2 }}
          >
            <Bookmark
              size={18}
              strokeWidth={1.5}
              color={bookmarked ? theme.colors.accent : theme.colors.textSecondary}
              fill={bookmarked ? theme.colors.accent : 'transparent'}
            />
          </Pressable>
        </View>
      </View>
    </View>
  );
}

export const VerseBlock = memo(VerseBlockImpl);
