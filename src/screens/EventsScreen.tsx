import React, { memo, useMemo, useState } from 'react';
import { Pressable, ScrollView, SectionList, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Scale } from 'lucide-react-native';
import { Screen } from '@/components/Screen';
import { SearchField } from '@/components/SearchField';
import { Chip } from '@/components/Chip';
import { useTheme } from '@/theme/ThemeProvider';
import { BOOK_ORDER, getEvents, matchesEvent } from '@/lib/companions';
import { getBookMeta } from '@/lib/scripture';
import type { StoryEvent } from '@/types/companions';
import type { BookId } from '@/types/scripture';

type Filter = 'all' | BookId;

const FILTERS: { key: Filter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'mahabharata', label: 'Mahabharata' },
  { key: 'ramayana', label: 'Ramayana' },
  { key: 'gita', label: 'Gita' },
];

export function EventsScreen() {
  const theme = useTheme();
  const navigation = useNavigation<any>();
  const [filter, setFilter] = useState<Filter>('all');
  const [dilemmasOnly, setDilemmasOnly] = useState(false);
  const [query, setQuery] = useState('');

  const sections = useMemo(() => {
    const all = getEvents();
    return BOOK_ORDER.filter((b) => filter === 'all' || b === filter)
      .map((b) => ({
        key: b,
        title: getBookMeta(b).title,
        data: all.filter((e) => e.book === b && (!dilemmasOnly || e.dilemma) && matchesEvent(e, query)),
      }))
      .filter((s) => s.data.length > 0);
  }, [filter, dilemmasOnly, query]);

  return (
    <Screen title="Events" subtitle="What happens, why it happens, and the hard choices inside it.">
      <View style={{ paddingHorizontal: theme.spacing.md, paddingBottom: theme.spacing.xs }}>
        <SearchField
          value={query}
          onChangeText={setQuery}
          placeholder="Search events"
          accessibilityLabel="Search events"
        />
      </View>
      <View style={{ paddingVertical: theme.spacing.xs }}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: theme.spacing.md, gap: 8, alignItems: 'center' }}
          keyboardShouldPersistTaps="handled"
        >
          {FILTERS.map((f) => (
            <Chip key={f.key} label={f.label} active={filter === f.key} onPress={() => setFilter(f.key)} />
          ))}
          <View style={{ width: 1, height: 22, backgroundColor: theme.colors.border, marginHorizontal: 2 }} />
          <Chip label="Dilemmas" active={dilemmasOnly} onPress={() => setDilemmasOnly((d) => !d)} />
        </ScrollView>
      </View>
      <SectionList
        sections={sections}
        keyExtractor={(e) => e.id}
        stickySectionHeadersEnabled={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        contentContainerStyle={{ paddingHorizontal: theme.spacing.md, paddingBottom: theme.spacing.xl }}
        renderSectionHeader={({ section }) => (
          <Text
            accessibilityRole="header"
            style={{
              fontFamily: theme.fonts.display,
              fontSize: theme.fontSize.lg,
              color: theme.colors.textPrimary,
              marginTop: theme.spacing.md,
              marginBottom: theme.spacing.xs,
            }}
          >
            {section.title}
          </Text>
        )}
        renderItem={({ item, index, section }) => (
          <EventRow
            event={item}
            first={index === 0}
            last={index === section.data.length - 1}
            onPress={() => navigation.navigate('Event', { id: item.id })}
          />
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
            No events match.
          </Text>
        }
      />
    </Screen>
  );
}

// One stop on the timeline: a dot on a thin rail, then the card.
const EventRow = memo(function EventRow({
  event,
  first,
  last,
  onPress,
}: {
  event: StoryEvent;
  first: boolean;
  last: boolean;
  onPress: () => void;
}) {
  const theme = useTheme();
  return (
    <View style={{ flexDirection: 'row' }}>
      <View style={{ width: 22, alignItems: 'center' }}>
        <View style={{ width: 1.5, height: 18, backgroundColor: first ? 'transparent' : theme.colors.border }} />
        <View
          style={{
            width: 11,
            height: 11,
            borderRadius: 6,
            borderWidth: 2,
            borderColor: theme.colors.accent,
            backgroundColor: event.dilemma ? theme.colors.accent : theme.colors.bgPrimary,
          }}
        />
        <View style={{ width: 1.5, flex: 1, backgroundColor: last ? 'transparent' : theme.colors.border }} />
      </View>
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={`${event.title}, ${event.where}`}
        style={({ pressed }) => ({
          flex: 1,
          marginLeft: 8,
          marginBottom: 10,
          padding: 14,
          borderRadius: 14,
          borderWidth: 1,
          borderColor: theme.colors.border,
          backgroundColor: pressed ? theme.colors.accentSoft : theme.colors.bgSecondary,
        })}
      >
        <Text
          style={{
            fontFamily: theme.fonts.ui,
            fontSize: theme.fontSize.xs,
            color: theme.colors.accent,
            textTransform: 'uppercase',
            letterSpacing: 1,
            marginBottom: 3,
          }}
        >
          {event.where}
        </Text>
        <Text
          style={{
            fontFamily: theme.fonts.display,
            fontSize: theme.fontSize.md,
            color: theme.colors.textPrimary,
            lineHeight: theme.fontSize.md * 1.3,
          }}
        >
          {event.title}
        </Text>
        <Text
          numberOfLines={2}
          style={{
            fontFamily: theme.fonts.body,
            fontSize: theme.fontSize.sm,
            color: theme.colors.textSecondary,
            lineHeight: theme.fontSize.sm * 1.55,
            marginTop: 4,
          }}
        >
          {event.summary}
        </Text>
        {event.dilemma || event.outside ? (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 10 }}>
            {event.dilemma ? (
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 4,
                  paddingHorizontal: 8,
                  paddingVertical: 3,
                  borderRadius: 999,
                  backgroundColor: theme.colors.accentSoft,
                }}
              >
                <Scale size={11} strokeWidth={1.8} color={theme.colors.textPrimary} />
                <Text style={{ fontFamily: theme.fonts.ui, fontSize: theme.fontSize.xs, color: theme.colors.textPrimary }}>
                  Moral dilemma
                </Text>
              </View>
            ) : null}
            {event.outside ? (
              <View
                style={{
                  paddingHorizontal: 8,
                  paddingVertical: 3,
                  borderRadius: 999,
                  borderWidth: 1,
                  borderColor: theme.colors.border,
                }}
              >
                <Text style={{ fontFamily: theme.fonts.ui, fontSize: theme.fontSize.xs, color: theme.colors.textSecondary }}>
                  Summary only
                </Text>
              </View>
            ) : null}
          </View>
        ) : null}
      </Pressable>
    </View>
  );
});
