import React from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { BookOpen, ChevronRight, Scale } from 'lucide-react-native';
import { StackScreen } from '@/components/StackScreen';
import { SectionLabel } from '@/components/SectionLabel';
import { Avatar } from '@/components/Avatar';
import { Prose } from '@/components/Prose';
import { useTheme } from '@/theme/ThemeProvider';
import { BOOK_SHORT, eventsForCharacter, getCharacter } from '@/lib/companions';
import { openPassage } from '@/lib/openPassage';

export function CharacterScreen() {
  const theme = useTheme();
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const character = getCharacter(route.params?.id);

  if (!character) {
    return (
      <StackScreen label="Character">
        <Text style={{ padding: theme.spacing.md, fontFamily: theme.fonts.body, color: theme.colors.textSecondary }}>
          This character could not be found.
        </Text>
      </StackScreen>
    );
  }

  const moments = eventsForCharacter(character.id);

  return (
    <StackScreen label="Character">
      <ScrollView
        contentContainerStyle={{
          padding: theme.spacing.md,
          paddingBottom: theme.spacing.xxl,
          width: '100%',
          maxWidth: 680,
          alignSelf: 'center',
        }}
      >
        {/* Identity */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm, marginBottom: theme.spacing.md }}>
          <Avatar id={character.id} name={character.name} size={72} />
          <View style={{ flex: 1 }}>
            <Text
              accessibilityRole="header"
              style={{ fontFamily: theme.fonts.display, fontSize: theme.fontSize.xl, color: theme.colors.textPrimary }}
            >
              {character.name}
            </Text>
            <Text
              style={{
                fontFamily: theme.fonts.devanagari,
                fontSize: theme.fontSize.md,
                color: theme.colors.textSecondary,
                lineHeight: theme.fontSize.md * 1.6,
              }}
            >
              {character.sanskrit}
            </Text>
          </View>
        </View>

        <Text
          style={{
            fontFamily: theme.fonts.bodyItalic,
            fontStyle: 'italic',
            fontSize: theme.fontSize.md,
            color: theme.colors.textPrimary,
            lineHeight: theme.fontSize.md * 1.5,
            marginBottom: theme.spacing.sm,
          }}
        >
          {character.role}
        </Text>

        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: theme.spacing.md }}>
          {character.books.map((b) => (
            <View
              key={b}
              style={{
                backgroundColor: theme.colors.accentSoft,
                paddingHorizontal: 10,
                paddingVertical: 3,
                borderRadius: 999,
              }}
            >
              <Text style={{ fontFamily: theme.fonts.ui, fontSize: theme.fontSize.xs, color: theme.colors.textPrimary }}>
                {BOOK_SHORT[b]}
              </Text>
            </View>
          ))}
        </View>

        {character.aka.length > 0 ? (
          <Text
            style={{
              fontFamily: theme.fonts.ui,
              fontSize: theme.fontSize.sm,
              color: theme.colors.textSecondary,
              lineHeight: theme.fontSize.sm * 1.5,
              marginBottom: theme.spacing.md,
            }}
          >
            Also called {character.aka.join(' · ')}
          </Text>
        ) : null}

        <Prose text={character.summary} />

        {character.dilemma ? (
          <View
            style={{
              marginTop: theme.spacing.lg,
              padding: theme.spacing.md,
              borderRadius: 16,
              backgroundColor: theme.colors.accentSoft,
              borderWidth: 1,
              borderColor: theme.colors.accent + '44',
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: theme.spacing.xs }}>
              <Scale size={14} strokeWidth={1.8} color={theme.colors.accent} />
              <SectionLabel style={{ marginBottom: 0, color: theme.colors.accent }}>Their dilemma</SectionLabel>
            </View>
            <Text
              style={{
                fontFamily: theme.fonts.display,
                fontSize: theme.fontSize.lg,
                color: theme.colors.textPrimary,
                lineHeight: theme.fontSize.lg * 1.3,
                marginBottom: theme.spacing.xs,
              }}
            >
              {character.dilemma.title}
            </Text>
            <Prose text={character.dilemma.body} />
          </View>
        ) : null}

        {character.relations.length > 0 ? (
          <View style={{ marginTop: theme.spacing.lg }}>
            <SectionLabel>Family & bonds</SectionLabel>
            {character.relations.map((r) => {
              const other = getCharacter(r.id);
              if (!other) return null;
              return (
                <Pressable
                  key={r.id}
                  onPress={() => navigation.push('Character', { id: r.id })}
                  accessibilityRole="button"
                  accessibilityLabel={`${other.name}, ${r.label}`}
                  style={({ pressed }) => ({
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 12,
                    paddingVertical: 10,
                    borderBottomWidth: 1,
                    borderBottomColor: theme.colors.border,
                    opacity: pressed ? 0.6 : 1,
                  })}
                >
                  <Avatar id={other.id} name={other.name} size={36} />
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontFamily: theme.fonts.display, fontSize: theme.fontSize.base, color: theme.colors.textPrimary }}>
                      {other.name}
                    </Text>
                    <Text style={{ fontFamily: theme.fonts.ui, fontSize: theme.fontSize.sm, color: theme.colors.textSecondary }}>
                      {r.label}
                    </Text>
                  </View>
                  <ChevronRight size={16} strokeWidth={1.5} color={theme.colors.textSecondary} />
                </Pressable>
              );
            })}
          </View>
        ) : null}

        {moments.length > 0 ? (
          <View style={{ marginTop: theme.spacing.lg }}>
            <SectionLabel>Key moments</SectionLabel>
            {moments.map((e) => (
              <Pressable
                key={e.id}
                onPress={() => navigation.push('Event', { id: e.id })}
                accessibilityRole="button"
                accessibilityLabel={e.title}
                style={({ pressed }) => ({
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 12,
                  paddingVertical: 12,
                  borderBottomWidth: 1,
                  borderBottomColor: theme.colors.border,
                  opacity: pressed ? 0.6 : 1,
                })}
              >
                <View style={{ flex: 1 }}>
                  <Text
                    style={{
                      fontFamily: theme.fonts.ui,
                      fontSize: theme.fontSize.xs,
                      color: theme.colors.accent,
                      textTransform: 'uppercase',
                      letterSpacing: 1,
                    }}
                  >
                    {e.where}
                  </Text>
                  <Text style={{ fontFamily: theme.fonts.display, fontSize: theme.fontSize.base, color: theme.colors.textPrimary, marginTop: 2 }}>
                    {e.title}
                  </Text>
                </View>
                {e.dilemma ? <Scale size={14} strokeWidth={1.6} color={theme.colors.textSecondary} /> : null}
                <ChevronRight size={16} strokeWidth={1.5} color={theme.colors.textSecondary} />
              </Pressable>
            ))}
          </View>
        ) : null}

        {character.read && character.read.length > 0 ? (
          <View style={{ marginTop: theme.spacing.lg }}>
            <SectionLabel>Read about them</SectionLabel>
            {character.read.map((p) => (
              <Pressable
                key={p.verseId}
                onPress={() => openPassage(navigation, p.verseId)}
                accessibilityRole="button"
                accessibilityLabel={`Read: ${p.label}`}
                style={({ pressed }) => ({
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 10,
                  paddingVertical: 12,
                  borderBottomWidth: 1,
                  borderBottomColor: theme.colors.border,
                  opacity: pressed ? 0.6 : 1,
                })}
              >
                <BookOpen size={16} strokeWidth={1.6} color={theme.colors.accent} />
                <Text style={{ flex: 1, fontFamily: theme.fonts.body, fontSize: theme.fontSize.base, color: theme.colors.textPrimary }}>
                  {p.label}
                </Text>
                <ChevronRight size={16} strokeWidth={1.5} color={theme.colors.textSecondary} />
              </Pressable>
            ))}
          </View>
        ) : null}
      </ScrollView>
    </StackScreen>
  );
}
