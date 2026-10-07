import React, { useCallback, useState } from 'react';
import { FlatList, Pressable, Text, View } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { Bookmark } from 'lucide-react-native';
import { StackScreen } from '@/components/StackScreen';
import { useTheme } from '@/theme/ThemeProvider';
import { listBookmarks, toggleBookmark } from '@/db/bookmarks';
import { getVerseById, verseReferenceLabel } from '@/lib/scripture';
import { openPassage } from '@/lib/openPassage';
import { relativeTime } from '@/lib/format';
import type { Verse } from '@/types/scripture';

interface Row {
  verse: Verse;
  createdAt: number;
}

export function BookmarksScreen() {
  const theme = useTheme();
  const navigation = useNavigation<any>();
  const [rows, setRows] = useState<Row[] | null>(null);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      listBookmarks().then((list) => {
        if (cancelled) return;
        const next: Row[] = [];
        for (const b of list) {
          const v = getVerseById(b.verse_id);
          if (v) next.push({ verse: v, createdAt: b.created_at });
        }
        setRows(next);
      });
      return () => {
        cancelled = true;
      };
    }, [])
  );

  const remove = async (v: Verse) => {
    await toggleBookmark(v.book, v.id);
    setRows((prev) => (prev ? prev.filter((r) => r.verse.id !== v.id) : prev));
  };

  return (
    <StackScreen label="Bookmarks">
      <FlatList
        data={rows ?? []}
        keyExtractor={(r) => r.verse.id}
        contentContainerStyle={{ padding: theme.spacing.md, paddingBottom: theme.spacing.xl, width: '100%', maxWidth: 680, alignSelf: 'center' }}
        ListEmptyComponent={
          rows ? (
            <View style={{ paddingTop: theme.spacing.lg }}>
              <Text style={{ fontFamily: theme.fonts.display, fontSize: theme.fontSize.lg, color: theme.colors.textPrimary, marginBottom: 6 }}>
                No bookmarks yet
              </Text>
              <Text style={{ fontFamily: theme.fonts.body, fontSize: theme.fontSize.base, lineHeight: theme.fontSize.base * 1.6, color: theme.colors.textSecondary }}>
                Tap the bookmark beside any verse while reading and it will be kept here.
              </Text>
            </View>
          ) : null
        }
        renderItem={({ item }) => (
          <Pressable
            onPress={() => openPassage(navigation, item.verse.id)}
            accessibilityRole="button"
            accessibilityLabel={`Open ${verseReferenceLabel(item.verse)}`}
            style={({ pressed }) => ({
              flexDirection: 'row',
              gap: 10,
              padding: theme.spacing.sm,
              marginBottom: theme.spacing.xs,
              borderRadius: 14,
              borderWidth: 1,
              borderColor: theme.colors.border,
              backgroundColor: pressed ? theme.colors.accentSoft : theme.colors.bgSecondary,
            })}
          >
            <View style={{ flex: 1 }}>
              <Text style={{ fontFamily: theme.fonts.ui, fontSize: theme.fontSize.xs, color: theme.colors.accent, marginBottom: 4 }}>
                {verseReferenceLabel(item.verse)}
              </Text>
              <Text
                numberOfLines={3}
                style={{
                  fontFamily: theme.fonts.body,
                  fontSize: theme.fontSize.base,
                  lineHeight: theme.fontSize.base * 1.5,
                  color: theme.colors.textPrimary,
                }}
              >
                {item.verse.translations.english ?? item.verse.transliteration}
              </Text>
              <Text style={{ fontFamily: theme.fonts.ui, fontSize: theme.fontSize.xs, color: theme.colors.textSecondary, marginTop: 6 }}>
                Saved {relativeTime(item.createdAt)}
              </Text>
            </View>
            <Pressable
              onPress={() => remove(item.verse)}
              accessibilityRole="button"
              accessibilityLabel="Remove bookmark"
              style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center', marginTop: -10, marginRight: -10 }}
            >
              <Bookmark size={18} strokeWidth={1.5} color={theme.colors.accent} fill={theme.colors.accent} />
            </Pressable>
          </Pressable>
        )}
      />
    </StackScreen>
  );
}
