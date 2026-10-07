import React from 'react';
import { Platform } from 'react-native';
import { NavigationContainer, type RouteProp } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import {
  createBottomTabNavigator,
  type BottomTabNavigationOptions,
} from '@react-navigation/bottom-tabs';
import {
  House as IconHome,
  BookOpen as IconLibrary,
  Users as IconCharacters,
  Milestone as IconEvents,
  Activity as IconProgress,
} from 'lucide-react-native';
import { useTheme } from '@/theme/ThemeProvider';
import { HomeScreen } from '@/screens/HomeScreen';
import { LibraryScreen } from '@/screens/LibraryScreen';
import { ReaderScreen } from '@/screens/ReaderScreen';
import { CalendarScreen } from '@/screens/CalendarScreen';
import { ProgressScreen } from '@/screens/ProgressScreen';
import { SettingsScreen } from '@/screens/SettingsScreen';
import { CharactersScreen } from '@/screens/CharactersScreen';
import { CharacterScreen } from '@/screens/CharacterScreen';
import { EventsScreen } from '@/screens/EventsScreen';
import { EventScreen } from '@/screens/EventScreen';
import { BookmarksScreen } from '@/screens/BookmarksScreen';

export type TabParamList = {
  Home: undefined;
  Library: undefined;
  Characters: undefined;
  Events: undefined;
  Progress: undefined;
};

// Everything that isn't a tab opens full-screen above the tab bar. The Reader
// in particular gets the whole screen: no tab bar competing with the text.
export type RootStackParamList = {
  Tabs: undefined;
  Reader: undefined;
  Character: { id: string };
  Event: { id: string };
  Calendar: undefined;
  Settings: undefined;
  Bookmarks: undefined;
};

const Tab = createBottomTabNavigator<TabParamList>();
const Stack = createNativeStackNavigator<RootStackParamList>();

const TAB_LABELS: Record<keyof TabParamList, string> = {
  Home: 'Home',
  Library: 'Library',
  Characters: 'Characters',
  Events: 'Events',
  Progress: 'Progress',
};

function Tabs() {
  const theme = useTheme();

  const screenOptions = ({
    route,
  }: {
    route: RouteProp<TabParamList, keyof TabParamList>;
  }): BottomTabNavigationOptions => ({
    headerShown: false,
    // Icons only, per UI.md — labels make the bar heavy on small screens.
    // Each icon still carries an accessible name for screen readers.
    tabBarShowLabel: false,
    tabBarAccessibilityLabel: TAB_LABELS[route.name],
    tabBarActiveTintColor: theme.colors.accent,
    tabBarInactiveTintColor: theme.colors.textSecondary,
    tabBarStyle: {
      backgroundColor: theme.colors.bgPrimary,
      borderTopColor: theme.colors.border,
      borderTopWidth: 1,
      ...(Platform.OS === 'web' ? { boxShadow: 'none' as any } : null),
    },
    tabBarIcon: ({ color, focused }) => {
      // Active tab gets a slightly heavier stroke alongside the accent tint.
      const sw = focused ? 2.1 : 1.5;
      const px = 23;
      switch (route.name) {
        case 'Home':
          return <IconHome color={color} size={px} strokeWidth={sw} />;
        case 'Library':
          return <IconLibrary color={color} size={px} strokeWidth={sw} />;
        case 'Characters':
          return <IconCharacters color={color} size={px} strokeWidth={sw} />;
        case 'Events':
          return <IconEvents color={color} size={px} strokeWidth={sw} />;
        case 'Progress':
          return <IconProgress color={color} size={px} strokeWidth={sw} />;
      }
    },
  });

  return (
    <Tab.Navigator screenOptions={screenOptions}>
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Library" component={LibraryScreen} />
      <Tab.Screen name="Characters" component={CharactersScreen} />
      <Tab.Screen name="Events" component={EventsScreen} />
      <Tab.Screen name="Progress" component={ProgressScreen} />
    </Tab.Navigator>
  );
}

export function RootNavigator() {
  const theme = useTheme();

  return (
    <NavigationContainer
      documentTitle={{ formatter: () => 'Katha' }}
      theme={{
        dark: false,
        colors: {
          primary: theme.colors.accent,
          background: theme.colors.bgPrimary,
          card: theme.colors.bgPrimary,
          text: theme.colors.textPrimary,
          border: theme.colors.border,
          notification: theme.colors.accent,
        },
        fonts: {
          regular: { fontFamily: theme.fonts.body, fontWeight: '400' },
          medium: { fontFamily: theme.fonts.ui, fontWeight: '500' },
          bold: { fontFamily: theme.fonts.uiBold, fontWeight: '700' },
          heavy: { fontFamily: theme.fonts.uiBold, fontWeight: '700' },
        },
      }}
    >
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: theme.colors.bgPrimary },
          animation: 'slide_from_right',
        }}
      >
        <Stack.Screen name="Tabs" component={Tabs} />
        <Stack.Screen name="Reader" component={ReaderScreen} />
        <Stack.Screen name="Character" component={CharacterScreen} />
        <Stack.Screen name="Event" component={EventScreen} />
        <Stack.Screen name="Calendar" component={CalendarScreen} />
        <Stack.Screen name="Settings" component={SettingsScreen} />
        <Stack.Screen name="Bookmarks" component={BookmarksScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
