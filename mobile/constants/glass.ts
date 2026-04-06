import { Platform } from 'react-native';

export const Glass = {
  // Tab bar, floating headers, modals
  nav: {
    backgroundColor: 'rgba(13, 15, 14, 0.72)',   // ground at 72% opacity
    borderTopColor:  'rgba(42, 46, 43, 0.6)',     // border at 60%
    // BlurView: intensity 80, tint 'dark'
  },

  // Cards that "float" above the surface (project header, stat cards)
  card: {
    backgroundColor: 'rgba(20, 23, 22, 0.60)',   // surface at 60%
    borderColor:     'rgba(54, 59, 55, 0.50)',   // border-2 at 50%
    // BlurView: intensity 40, tint 'dark'
  },

  // Bottom sheets, drawers
  sheet: {
    backgroundColor: 'rgba(28, 31, 29, 0.85)',   // surface-2 at 85%
    borderTopColor:  'rgba(42, 46, 43, 0.80)',
    // BlurView: intensity 60, tint 'dark'
  },

  // Toast messages, banners
  toast: {
    backgroundColor: 'rgba(20, 23, 22, 0.92)',
    borderColor:     'rgba(212, 146, 10, 0.30)',  // amber at 30%
    // BlurView: intensity 50, tint 'dark'
  },

  // Input fields (subtle glass feel)
  input: {
    backgroundColor: 'rgba(28, 31, 29, 0.70)',   // surface-2 at 70%
    borderColor:     'rgba(42, 46, 43, 0.80)',
  },
};

export const AmberGlow = {
  // Shadow values for React Native (iOS only — Android ignores elevation glow)
  soft: {
    shadowColor: '#D4920A',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,   // Android approximation
  },
  strong: {
    shadowColor: '#D4920A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.40,
    shadowRadius: 20,
    elevation: 12,
  },
  // For the progress bar fill glow
  bar: {
    shadowColor: '#D4920A',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.60,
    shadowRadius: 6,
  },
};
