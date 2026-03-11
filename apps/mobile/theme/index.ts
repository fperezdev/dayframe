import { MD3LightTheme, MD3DarkTheme, MD3Theme } from 'react-native-paper';

// ─── Brand Colors ─────────────────────────────────────────────────────────────

const brand = {
  primary: '#6366F1',      // indigo-500
  primaryDark: '#4F46E5',  // indigo-600
  secondary: '#8B5CF6',    // violet-500
  surface: '#FFFFFF',
  surfaceVariant: '#F8F8FF',
  background: '#F5F5FA',
  outline: '#E2E2F0',
  onPrimary: '#FFFFFF',
};

const brandDark = {
  primary: '#818CF8',      // indigo-400
  primaryDark: '#6366F1',
  secondary: '#A78BFA',    // violet-400
  surface: '#1E1E2E',
  surfaceVariant: '#2A2A3E',
  background: '#13131F',
  outline: '#3A3A52',
  onPrimary: '#FFFFFF',
};

// ─── Light Theme ──────────────────────────────────────────────────────────────

export const LightTheme: MD3Theme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: brand.primary,
    onPrimary: brand.onPrimary,
    primaryContainer: '#E0E1FF',
    onPrimaryContainer: '#1A1A6C',
    secondary: brand.secondary,
    onSecondary: '#FFFFFF',
    secondaryContainer: '#EDE9FE',
    onSecondaryContainer: '#2E1F6C',
    surface: brand.surface,
    onSurface: '#1C1C2E',
    surfaceVariant: brand.surfaceVariant,
    onSurfaceVariant: '#4A4A6A',
    background: brand.background,
    onBackground: '#1C1C2E',
    outline: brand.outline,
    outlineVariant: '#C8C8E0',
    error: '#EF4444',
    onError: '#FFFFFF',
    errorContainer: '#FEE2E2',
    onErrorContainer: '#7F1D1D',
    inverseSurface: '#313147',
    inverseOnSurface: '#F3F3FF',
    inversePrimary: '#818CF8',
    shadow: '#000000',
    scrim: '#000000',
    surfaceDisabled: 'rgba(28,28,46,0.12)',
    onSurfaceDisabled: 'rgba(28,28,46,0.38)',
    backdrop: 'rgba(45,45,75,0.4)',
    elevation: {
      level0: 'transparent',
      level1: '#EFEFFF',
      level2: '#E8E8FF',
      level3: '#E2E2FA',
      level4: '#E0E0F8',
      level5: '#DCDCF5',
    },
  },
};

// ─── Dark Theme ───────────────────────────────────────────────────────────────

export const DarkTheme: MD3Theme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    primary: brandDark.primary,
    onPrimary: '#1A1A6C',
    primaryContainer: '#3730A3',
    onPrimaryContainer: '#E0E1FF',
    secondary: brandDark.secondary,
    onSecondary: '#2E1F6C',
    secondaryContainer: '#5B21B6',
    onSecondaryContainer: '#EDE9FE',
    surface: brandDark.surface,
    onSurface: '#E6E6F5',
    surfaceVariant: brandDark.surfaceVariant,
    onSurfaceVariant: '#B0B0C8',
    background: brandDark.background,
    onBackground: '#E6E6F5',
    outline: brandDark.outline,
    outlineVariant: '#3A3A52',
    error: '#F87171',
    onError: '#7F1D1D',
    errorContainer: '#991B1B',
    onErrorContainer: '#FEE2E2',
    inverseSurface: '#E6E6F5',
    inverseOnSurface: '#313147',
    inversePrimary: '#6366F1',
    shadow: '#000000',
    scrim: '#000000',
    surfaceDisabled: 'rgba(230,230,245,0.12)',
    onSurfaceDisabled: 'rgba(230,230,245,0.38)',
    backdrop: 'rgba(0,0,0,0.5)',
    elevation: {
      level0: 'transparent',
      level1: '#252535',
      level2: '#2A2A3E',
      level3: '#2F2F46',
      level4: '#31314A',
      level5: '#34344E',
    },
  },
};

// ─── Spacing & Typography Helpers ─────────────────────────────────────────────

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
};

export const priorityColors = {
  low: '#22C55E',
  medium: '#F97316',
  high: '#EF4444',
};

export const priorityBgColors = {
  low: '#DCFCE7',
  medium: '#FFEDD5',
  high: '#FEE2E2',
};
