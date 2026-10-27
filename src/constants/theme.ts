/**
 * Brand Color Palette and Theme Constants
 * Matches the Soul Bites visual identity:
 * - Charcoal Black: #1C1C1C
 * - Golden Yellow: #F5B700
 * - Cream White: #FFF8E6
 */

export const THEME_COLORS = {
  charcoalBlack: '#1C1C1C',
  charcoalSurface: '#262626',
  charcoalCard: '#2B2B2B',
  charcoalBorder: '#3A3A3A',
  goldenYellow: '#F5B700',
  goldenHover: '#E0A600',
  creamWhite: '#FFF8E6',
  creamMuted: 'rgba(255, 248, 230, 0.65)',
  creamDim: 'rgba(255, 248, 230, 0.35)',
} as const;

export type ThemeColors = typeof THEME_COLORS;
