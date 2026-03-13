export const COLORS = {
  bg: '#0a0a0f',
  bgCard: '#111118',
  bgElevated: '#1a1a24',
  border: '#2a2a3a',
  borderBright: '#3a3a50',

  accent: '#ff3b30',        // alarm red
  accentGlow: '#ff3b3040',
  accentSoft: '#ff6b5b',

  cyan: '#00d4ff',
  cyanGlow: '#00d4ff30',
  cyanDim: '#00d4ff80',

  yellow: '#ffd60a',
  yellowGlow: '#ffd60a30',

  green: '#30d158',
  greenGlow: '#30d15830',

  text: '#f2f2f7',
  textSecondary: '#8e8e9a',
  textDim: '#48485a',

  white: '#ffffff',
  black: '#000000',
};

export const FONTS = {
  // Use system fonts — specify in StyleSheet
  mono: 'Courier New',
  display: 'System',
};

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const RADIUS = {
  sm: 8,
  md: 12,
  lg: 20,
  xl: 28,
  full: 999,
};

// Sound profiles
export const SOUND_PROFILES = {
  gentle: {
    id: 'gentle',
    name: 'Gentle Rise',
    description: 'Soft tones that gradually increase',
    icon: '🌅',
    color: COLORS.cyan,
    startVolume: 0.1,
    targetVolume: 0.7,
    rampDuration: 120, // seconds to full volume
    frequency: 'low',
    pattern: 'gradual',
  },
  intense: {
    id: 'intense',
    name: 'Shock & Awe',
    description: 'Instant jarring alarm at max volume',
    icon: '⚡',
    color: COLORS.accent,
    startVolume: 1.0,
    targetVolume: 1.0,
    rampDuration: 0,
    frequency: 'high',
    pattern: 'burst', // irregular bursts to prevent habituation
  },
  military: {
    id: 'military',
    name: 'No Mercy',
    description: 'Alternating high/low tones, maximum disruption',
    icon: '🚨',
    color: COLORS.yellow,
    startVolume: 1.0,
    targetVolume: 1.0,
    rampDuration: 0,
    frequency: 'alternating',
    pattern: 'military',
  },
  custom: {
    id: 'custom',
    name: 'Custom Sound',
    description: 'Use your own audio file',
    icon: '🎵',
    color: COLORS.green,
    startVolume: 0.8,
    targetVolume: 1.0,
    rampDuration: 5,
    frequency: 'custom',
    pattern: 'custom',
  },
};

// Challenge types
export const CHALLENGE_TYPES = {
  math: {
    id: 'math',
    name: 'Math Problem',
    description: 'Solve equations to prove you\'re awake',
    icon: '🧮',
    color: COLORS.cyan,
  },
  photo: {
    id: 'photo',
    name: 'Photo Mission',
    description: 'Take a photo of a specific object',
    icon: '📸',
    color: COLORS.yellow,
  },
  both: {
    id: 'both',
    name: 'Double Threat',
    description: 'Math first, then photo. No escape.',
    icon: '💀',
    color: COLORS.accent,
  },
};

// Math difficulty levels
export const MATH_DIFFICULTY = {
  easy: { label: 'Easy', ops: ['+', '-'], maxNum: 20, problems: 1 },
  medium: { label: 'Medium', ops: ['+', '-', '*'], maxNum: 50, problems: 2 },
  hard: { label: 'Hard', ops: ['+', '-', '*', '/'], maxNum: 100, problems: 3 },
  brutal: { label: 'Brutal', ops: ['+', '-', '*', '/'], maxNum: 999, problems: 4 },
};

// Optimal solve time target (seconds) - research shows 45-90s prevents sleep re-entry
export const OPTIMAL_SOLVE_TIME = 60;
export const MIN_SOLVE_TIME = 30;
export const MAX_SOLVE_TIME = 120;

// REM cycle duration in minutes
export const REM_CYCLE_MINUTES = 90;
