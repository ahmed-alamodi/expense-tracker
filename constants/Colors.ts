const tintColorLight = '#2563EB';
const tintColorDark = '#60A5FA';

export default {
  light: {
    text: '#1F2937',
    textSecondary: '#6B7280',
    background: '#F3F4F6',
    card: '#FFFFFF',
    tint: tintColorLight,
    tabIconDefault: '#9CA3AF',
    tabIconSelected: tintColorLight,
    border: '#E5E7EB',
    success: '#10B981',
    warning: '#F59E0B',
    danger: '#EF4444',
    income: '#10B981',
    expense: '#EF4444',
  },
  dark: {
    text: '#F9FAFB',
    textSecondary: '#9CA3AF',
    background: '#111827',
    card: '#1F2937',
    tint: tintColorDark,
    tabIconDefault: '#6B7280',
    tabIconSelected: tintColorDark,
    border: '#374151',
    success: '#34D399',
    warning: '#FBBF24',
    danger: '#F87171',
    income: '#34D399',
    expense: '#F87171',
  },
} as const;

export type ThemeColors = typeof import('./Colors').default.light;
