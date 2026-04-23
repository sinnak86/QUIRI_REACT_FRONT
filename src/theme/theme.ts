import { Platform } from 'react-native';

const COLORS = {
  primary: '#1A73E8',
  background: '#0A0A0A',
  surface: '#1C1C1C',
  border: '#2E2E2E',
  text: '#F0F0F0',
  textSecondary: '#A0A0A0',
  headerBg: '#111111',
  bottomBarBg: '#111111',
  menuItemBg: '#1C1C1C',
  menuItemBorder: '#2E2E2E',
  inputBorder: '#3A3A3A',
  inputBorderFocused: '#1A73E8',
  checkboxBorder: '#555555',
  checkboxActive: '#1A73E8',
  buttonText: '#FFFFFF',
  error: '#CF6679',
} as const;

const FONT_FAMILY = Platform.select({
  web: "'Consolas', 'Courier New', monospace",
  ios: 'Courier New',
  default: 'monospace',
}) as string;

const TYPOGRAPHY = {
  fontFamily: FONT_FAMILY,
  fontSize: {
    xs: 11,
    sm: 13,
    md: 15,
    lg: 18,
    xl: 22,
    xxl: 28,
  },
  fontWeight: {
    regular: '400' as const,
    medium: '500' as const,
    bold: '700' as const,
  },
} as const;

const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

const BORDER_RADIUS = {
  sm: 4,
  md: 8,
  lg: 16,
} as const;

const SHADOW = {
  light: Platform.select({
    web: {
      boxShadow: '0px 1px 3px rgba(0,0,0,0.4)',
    },
    default: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.4,
      shadowRadius: 3,
      elevation: 2,
    },
  }),
  medium: Platform.select({
    web: {
      boxShadow: '0px 3px 8px rgba(0,0,0,0.5)',
    },
    default: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.5,
      shadowRadius: 8,
      elevation: 5,
    },
  }),
} as const;

const HEADER = {
  height: 56,
  paddingHorizontal: 16,
} as const;

const BOTTOM_BAR = {
  height: 48,
  paddingHorizontal: 16,
} as const;

export const theme = {
  colors: COLORS,
  typography: TYPOGRAPHY,
  spacing: SPACING,
  borderRadius: BORDER_RADIUS,
  shadow: SHADOW,
  header: HEADER,
  bottomBar: BOTTOM_BAR,
} as const;

export type Theme = typeof theme;
