import React, { memo, useMemo, useState } from 'react';
import { Pressable, SectionList, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { ChevronRight } from 'lucide-react-native';
import { Screen } from '@/components/Screen';
import { SearchField } from '@/components/SearchField';
import { ChipRow } from '@/components/Chip';
import { Avatar } from '@/components/Avatar';
import { useTheme } from '@/theme/ThemeProvider';
import { getCharacterGroups, getCharacters, matchesCharacter } from '@/lib/companions';
import type { Character } from '@/types/companions';
import type { BookId } from '@/types/scripture';

type Filter = 'all' | BookId;

const FILTERS: { key: Filter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'mahabharata', label: 'Mahabharata' },
  { key: 'ramayana', label: 'Ramayana' },
  { key: 'gita', label: 'Gita' },
];

export function CharactersScreen() {
  const theme = useTheme();
  const navigation = useNavigation<any>();
  const [filter, setFilter] = useState<Filter>('all');
  const [query, setQuery] = useState('');

  const sections = useMemo(() => {
    const all = getCharacters();
    return getCharacterGroups()
      .map((g) => ({
        key: g.id,
        title: g.label,
        data: all.filter(
          (c) =>
            c.group === g.id &&
            (filter === 'all' || c.books.includes(filter)) &&
            matchesCharacter(c, query)
        ),
      }))
      .filter((s) => s.data.length > 0);
  }, [filter, query]);

  const count = sections.reduce((n, s) => n + s.data.length, 0);

  return (
    <Screen title="Characters" subtitle="Who they are, what they want, and the choices that define them.">
      <View style={{ paddingHorizontal: theme.spacing.md, paddingBottom: theme.spacing.xs }}>
        <SearchField
          value={query}
          onChangeText={setQuery}
          placeholder="Search by name or title"
          accessibilityLabel="Search characters"
        />
      </View>
      <View style={{ paddingVertical: theme.spacing.xs }}>
        <ChipRow options={FILTERS} value={filter} onChange={setFilter} />
      </View>
      <SectionList
        sections={sections}
        keyExtractor={(c) => c.id}
        stickySectionHeadersEnabled={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        contentContainerStyle={{ paddingHorizontal: theme.spacing.md, paddingBottom: theme.spacing.xl }}
        renderSectionHeader={({ section }) => (
          <Text
            accessibilityRole="header"
            style={{
              fontFamily: theme.fonts.ui,
              fontSize: theme.fontSize.xs,
              color: theme.colors.accent,
              textTransform: 'uppercase',
              letterSpacing: 1.2,
              marginTop: theme.spacing.md,
              marginBottom: theme.spacing.xs,
            }}
          >
            {section.title}
          </Text>
        )}
        renderItem={({ item }) => (
          <CharacterRow character={item} onPress={() => navigation.navigate('Character', { id: item.id })} />
        )}
        ListEmptyComponent={
          <Text
            style={{
              fontFamily: theme.fonts.body,
              fontSize: theme.fontSize.base,
              color: theme.colors.textSecondary,
              marginTop: theme.spacing.md,
            }}
          >
            No one matches "{query.trim()}".
          </Text>
        }
        ListFooterComponent={
          count > 0 ? (
            <Text
              style={{
                fontFamily: theme.fonts.ui,
                fontSize: theme.fontSize.xs,
                color: theme.colors.textSecondary,
                textAlign: 'center',
                marginTop: theme.spacing.lg,
              }}
            >
              {count} {count === 1 ? 'character' : 'characters'}
            </Text>
          ) : null
        }
      />
    </Screen>
  );
}

const CharacterRow = memo(function CharacterRow({
  character,
  onPress,
}: {
  character: Character;
  onPress: () => void;
}) {
  const theme = useTheme();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${character.name}, ${character.role}`}
      style={({ pressed }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing.sm,
        paddingVertical: 12,
        paddingHorizontal: 12,
        marginBottom: 8,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: theme.colors.border,
        backgroundColor: pressed ? theme.colors.accentSoft : theme.colors.bgSecondary,
      })}
    >
      <Avatar id={character.id} name={character.name} size={46} />
      <View style={{ flex: 1 }}>
        <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 8, flexWrap: 'wrap' }}>
          <Text
            style={{
              fontFamily: theme.fonts.display,
              fontSize: theme.fontSize.md,
              color: theme.colors.textPrimary,
            }}
          >
            {character.name}
          </Text>
          <Text
            style={{
              fontFamily: theme.fonts.devanagari,
              fontSize: theme.fontSize.sm,
              color: theme.colors.textSecondary,
            }}
          >
            {character.sanskrit}
          </Text>
        </View>
        <Text
          numberOfLines={2}
          style={{
            fontFamily: theme.fonts.ui,
            fontSize: theme.fontSize.sm,
            color: theme.colors.textSecondary,
            lineHeight: theme.fontSize.sm * 1.45,
            marginTop: 2,
          }}
        >
          {character.role}
        </Text>
      </View>
      <ChevronRight size={18} strokeWidth={1.5} color={theme.colors.textSecondary} />
    </Pressable>
  );
});
