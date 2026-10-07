import React from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { ArrowLeft, ArrowRight, BookOpen, Scale } from 'lucide-react-native';
import { StackScreen } from '@/components/StackScreen';
import { SectionLabel } from '@/components/SectionLabel';
import { Chip, ChipWrap } from '@/components/Chip';
import { Prose } from '@/components/Prose';
import { useTheme } from '@/theme/ThemeProvider';
import { getCharacter, getEvent, neighbours } from '@/lib/companions';
import { getBookMeta, positionLabel } from '@/lib/scripture';
import { openPassage } from '@/lib/openPassage';

export function EventScreen() {
  const theme = useTheme();
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const event = getEvent(route.params?.id);

  if (!event) {
    return (
      <StackScreen label="Event">
        <Text style={{ padding: theme.spacing.md, fontFamily: theme.fonts.body, color: theme.colors.textSecondary }}>
          This event could not be found.
        </Text>
      </StackScreen>
    );
  }

  const book = getBookMeta(event.book);
  const { prev, next } = neighbours(event);
  const people = event.characters.map((id) => getCharacter(id)).filter(Boolean);

  return (
    <StackScreen label={book.title}>
      <ScrollView
        contentContainerStyle={{
          padding: theme.spacing.md,
          paddingBottom: theme.spacing.xxl,
          width: '100%',
          maxWidth: 680,
          alignSelf: 'center',
        }}
      >
        <Text
          style={{
            fontFamily: theme.fonts.ui,
            fontSize: theme.fontSize.xs,
            color: theme.colors.accent,
            textTransform: 'uppercase',
            letterSpacing: 1.2,
            marginBottom: 6,
          }}
        >
          {event.where}
        </Text>
        <Text
          accessibilityRole="header"
          style={{
            fontFamily: theme.fonts.display,
            fontSize: theme.fontSize.xl,
            color: theme.colors.textPrimary,
            lineHeight: theme.fontSize.xl * 1.25,
            marginBottom: theme.spacing.md,
          }}
        >
          {event.title}
        </Text>

        <SectionLabel>What happens</SectionLabel>
        <Prose text={event.summary} />

        <SectionLabel style={{ marginTop: theme.spacing.lg }}>Why it happens</SectionLabel>
        <Prose text={event.why} />

        {event.dilemma ? (
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
              <SectionLabel style={{ marginBottom: 0, color: theme.colors.accent }}>The dilemma</SectionLabel>
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
              {event.dilemma.title}
            </Text>
            <Prose text={event.dilemma.body} />
          </View>
        ) : null}

        {people.length > 0 ? (
          <View style={{ marginTop: theme.spacing.lg }}>
            <SectionLabel>People</SectionLabel>
            <ChipWrap>
              {people.map((c) => (
                <Chip
                  key={c!.id}
                  label={c!.name}
                  variant="link"
                  onPress={() => navigation.push('Character', { id: c!.id })}
                />
              ))}
            </ChipWrap>
          </View>
        ) : null}

        <View style={{ marginTop: theme.spacing.lg }}>
          {event.ref ? (
            <Pressable
              onPress={() => openPassage(navigation, event.ref!)}
              accessibilityRole="button"
              accessibilityLabel={`Read the passage: ${positionLabel(event.ref) ?? ''}`}
              style={({ pressed }) => ({
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                minHeight: 50,
                borderRadius: 14,
                backgroundColor: theme.colors.accent,
                opacity: pressed ? 0.85 : 1,
              })}
            >
              <BookOpen size={18} strokeWidth={1.8} color={theme.colors.bgPrimary} />
              <Text style={{ fontFamily: theme.fonts.uiBold, fontSize: theme.fontSize.base, color: theme.colors.bgPrimary }}>
                Read the passage
              </Text>
            </Pressable>
          ) : null}
          {event.ref ? (
            <Text
              style={{
                fontFamily: theme.fonts.ui,
                fontSize: theme.fontSize.xs,
                color: theme.colors.textSecondary,
                textAlign: 'center',
                marginTop: 8,
              }}
            >
              {positionLabel(event.ref)}
            </Text>
          ) : null}
          {event.outside ? (
            <Text
              style={{
                fontFamily: theme.fonts.ui,
                fontSize: theme.fontSize.sm,
                color: theme.colors.textSecondary,
                lineHeight: theme.fontSize.sm * 1.5,
                padding: theme.spacing.sm,
                borderRadius: 12,
                borderWidth: 1,
                borderColor: theme.colors.border,
              }}
            >
              This is told in the {event.outside}, which isn't part of Katha's text yet. Katha carries the six core
              parvas: Adi, Sabha, Vana, Udyoga, Bhishma and Shanti.
            </Text>
          ) : null}
        </View>

        {prev || next ? (
          <View style={{ flexDirection: 'row', gap: 10, marginTop: theme.spacing.xl }}>
            {prev ? (
              <StepCard direction="prev" title={prev.title} onPress={() => navigation.replace('Event', { id: prev.id })} />
            ) : (
              <View style={{ flex: 1 }} />
            )}
            {next ? (
              <StepCard direction="next" title={next.title} onPress={() => navigation.replace('Event', { id: next.id })} />
            ) : (
              <View style={{ flex: 1 }} />
            )}
          </View>
        ) : null}
      </ScrollView>
    </StackScreen>
  );
}

function StepCard({ direction, title, onPress }: { direction: 'prev' | 'next'; title: string; onPress: () => void }) {
  const theme = useTheme();
  const isNext = direction === 'next';
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${isNext ? 'Next' : 'Previous'} event: ${title}`}
      style={({ pressed }) => ({
        flex: 1,
        padding: 12,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: theme.colors.border,
        backgroundColor: pressed ? theme.colors.accentSoft : theme.colors.bgSecondary,
        alignItems: isNext ? 'flex-end' : 'flex-start',
      })}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 4 }}>
        {!isNext ? <ArrowLeft size={12} strokeWidth={2} color={theme.colors.accent} /> : null}
        <Text
          style={{
            fontFamily: theme.fonts.ui,
            fontSize: theme.fontSize.xs,
            color: theme.colors.accent,
            textTransform: 'uppercase',
            letterSpacing: 1,
          }}
        >
          {isNext ? 'Next' : 'Before'}
        </Text>
        {isNext ? <ArrowRight size={12} strokeWidth={2} color={theme.colors.accent} /> : null}
      </View>
      <Text
        numberOfLines={2}
        style={{
          fontFamily: theme.fonts.display,
          fontSize: theme.fontSize.sm,
          color: theme.colors.textPrimary,
          textAlign: isNext ? 'right' : 'left',
        }}
      >
        {title}
      </Text>
    </Pressable>
  );
}
