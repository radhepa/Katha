import React, { useEffect, useState } from 'react';
import { FlatList, Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronDown, ChevronRight, X } from 'lucide-react-native';
import { useTheme } from '@/theme/ThemeProvider';
import { getBookMeta, getChapters } from '@/lib/scripture';
import { AppModal } from '@/components/AppModal';
import type { BookId } from '@/types/scripture';

interface Props {
  bookId: BookId;
  visible: boolean;
  activeChapter: number;
  // verseId set when a specific sarga / adhyaya was picked.
  onSelect: (chapter: number, verseId?: string) => void;
  onClose: () => void;
}

// Chapter list. For the Ramayana and Mahabharata each kanda / parva also
// opens into its sargas / adhyayas, so a reader can jump straight to one
// instead of scrolling through thousands of verses.
export function ChapterSelector({ bookId, visible, activeChapter, onSelect, onClose }: Props) {
  const theme = useTheme();
  const meta = getBookMeta(bookId);
  const chapters = getChapters(bookId);
  const subLabel = meta.sub_structure_unit === 'sarga' ? 'Sarga' : meta.sub_structure_unit === 'adhyaya' ? 'Adhyaya' : null;
  const [expanded, setExpanded] = useState<number | null>(activeChapter);

  useEffect(() => {
    if (visible) setExpanded(activeChapter);
  }, [visible, activeChapter]);

  return (
    <AppModal visible={visible} presentation="overlay" onRequestClose={onClose}>
      <SafeAreaView edges={['top', 'bottom']} style={{ flex: 1, backgroundColor: theme.colors.bgPrimary }}>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingLeft: theme.spacing.md,
            paddingRight: theme.spacing.xs,
            paddingVertical: 6,
            borderBottomWidth: 1,
            borderBottomColor: theme.colors.border,
          }}
        >
          <Text style={{ fontFamily: theme.fonts.display, fontSize: theme.fontSize.lg, color: theme.colors.textPrimary }}>
            {meta.title}
          </Text>
          <Pressable
            onPress={onClose}
            accessibilityRole="button"
            accessibilityLabel="Close chapter list"
            style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }}
          >
            <X size={22} strokeWidth={1.5} color={theme.colors.textPrimary} />
          </Pressable>
        </View>
        <FlatList
          data={chapters}
          keyExtractor={(c) => String(c.number)}
          contentContainerStyle={{ paddingVertical: theme.spacing.xs, paddingBottom: theme.spacing.xl }}
          renderItem={({ item }) => {
            const active = item.number === activeChapter;
            const subs = item.subunits ?? [];
            const open = subs.length > 0 && expanded === item.number;
            return (
              <View>
                <Pressable
                  onPress={() => (subs.length > 0 ? setExpanded(open ? null : item.number) : onSelect(item.number))}
                  accessibilityRole="button"
                  accessibilityLabel={`${meta.structure_label} ${item.number}, ${item.name}`}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    paddingHorizontal: theme.spacing.md,
                    paddingVertical: theme.spacing.sm,
                    backgroundColor: active ? theme.colors.accentSoft : 'transparent',
                  }}
                >
                  <View style={{ flex: 1 }}>
                    <Text
                      style={{
                        fontFamily: theme.fonts.ui,
                        fontSize: theme.fontSize.xs,
                        color: theme.colors.textSecondary,
                        marginBottom: 2,
                        textTransform: 'uppercase',
                        letterSpacing: 1,
                      }}
                    >
                      {meta.structure_label} {item.number}
                    </Text>
                    <Text style={{ fontFamily: theme.fonts.body, fontSize: theme.fontSize.base, color: theme.colors.textPrimary }}>
                      {item.name}
                    </Text>
                    <Text style={{ fontFamily: theme.fonts.ui, fontSize: theme.fontSize.xs, color: theme.colors.textSecondary, marginTop: 4 }}>
                      {item.verse_count.toLocaleString()} verses
                      {subs.length > 0 && subLabel ? ` · ${subs.length} ${subLabel.toLowerCase()}s` : ''}
                    </Text>
                  </View>
                  {subs.length > 0 ? (
                    open ? (
                      <ChevronDown size={18} strokeWidth={1.5} color={theme.colors.textSecondary} />
                    ) : (
                      <ChevronRight size={18} strokeWidth={1.5} color={theme.colors.textSecondary} />
                    )
                  ) : null}
                </Pressable>
                {open ? (
                  <View style={{ paddingHorizontal: theme.spacing.md, paddingBottom: theme.spacing.sm }}>
                    <Pressable
                      onPress={() => onSelect(item.number)}
                      accessibilityRole="button"
                      style={{ paddingVertical: 10 }}
                    >
                      <Text style={{ fontFamily: theme.fonts.uiBold, fontSize: theme.fontSize.sm, color: theme.colors.accent }}>
                        Start from the beginning
                      </Text>
                    </Pressable>
                    <Text style={{ fontFamily: theme.fonts.ui, fontSize: theme.fontSize.xs, color: theme.colors.textSecondary, marginBottom: 8 }}>
                      Or jump to a {subLabel?.toLowerCase()}:
                    </Text>
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                      {subs.map((s) => (
                        <Pressable
                          key={s.n}
                          onPress={() => onSelect(item.number, s.first)}
                          accessibilityRole="button"
                          accessibilityLabel={`${subLabel} ${s.n}`}
                          style={({ pressed }) => ({
                            width: 46,
                            height: 40,
                            borderRadius: 10,
                            alignItems: 'center',
                            justifyContent: 'center',
                            borderWidth: 1,
                            borderColor: theme.colors.border,
                            backgroundColor: pressed ? theme.colors.accentSoft : theme.colors.bgSecondary,
                          })}
                        >
                          <Text style={{ fontFamily: theme.fonts.ui, fontSize: theme.fontSize.sm, color: theme.colors.textPrimary }}>
                            {s.n}
                          </Text>
                        </Pressable>
                      ))}
                    </View>
                  </View>
                ) : null}
              </View>
            );
          }}
        />
      </SafeAreaView>
    </AppModal>
  );
}
