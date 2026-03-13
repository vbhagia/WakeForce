import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEYS = {
  ALARMS: 'wakeforce:alarms',
  STATS: 'wakeforce:stats',
  SETTINGS: 'wakeforce:settings',
};

// ─── Alarm CRUD ──────────────────────────────────────────────────────────────

export async function getAlarms() {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEYS.ALARMS);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export async function saveAlarm(alarm) {
  const alarms = await getAlarms();
  const idx = alarms.findIndex(a => a.id === alarm.id);
  if (idx >= 0) {
    alarms[idx] = alarm;
  } else {
    alarms.push(alarm);
  }
  await AsyncStorage.setItem(STORAGE_KEYS.ALARMS, JSON.stringify(alarms));
  return alarms;
}

export async function deleteAlarm(id) {
  const alarms = await getAlarms();
  const updated = alarms.filter(a => a.id !== id);
  await AsyncStorage.setItem(STORAGE_KEYS.ALARMS, JSON.stringify(updated));
  return updated;
}

export async function toggleAlarm(id) {
  const alarms = await getAlarms();
  const idx = alarms.findIndex(a => a.id === id);
  if (idx >= 0) {
    alarms[idx].enabled = !alarms[idx].enabled;
    await AsyncStorage.setItem(STORAGE_KEYS.ALARMS, JSON.stringify(alarms));
  }
  return alarms;
}

// ─── Default alarm template ───────────────────────────────────────────────────

export function createDefaultAlarm(overrides = {}) {
  return {
    id: Date.now().toString(),
    label: 'Wake Up',
    hour: 7,
    minute: 0,
    days: [1, 2, 3, 4, 5], // Mon-Fri
    enabled: true,
    soundProfile: 'intense',
    volume: 1.0,              // 0.0–1.0, overrides profile default
    customSoundUri: null,
    remTrick: false,          // fires 90min pre-alarm too
    challenge: {
      type: 'math',           // 'math' | 'photo' | 'both'
      difficulty: 'medium',   // auto-adjusted
      photoObjectName: '',    // what to take pic of
      photoObjectHint: '',
    },
    vibrate: true,
    createdAt: Date.now(),
    ...overrides,
  };
}

// ─── Stats ────────────────────────────────────────────────────────────────────

export async function getStats() {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEYS.STATS);
    return raw ? JSON.parse(raw) : getDefaultStats();
  } catch {
    return getDefaultStats();
  }
}

function getDefaultStats() {
  return {
    totalAlarms: 0,
    totalSolveTime: 0,        // ms
    solveSessions: [],        // [{date, solveTime, difficulty, challenge}]
    avgSolveTime: 0,
    fastestSolve: null,
    currentDifficulty: 'medium',
    difficultyHistory: [],
  };
}

export async function recordSolveSession(session) {
  const stats = await getStats();
  stats.totalAlarms++;
  stats.totalSolveTime += session.solveTime;
  stats.solveSessions = [session, ...stats.solveSessions].slice(0, 100); // keep last 100

  // Calculate avg over last 5 sessions
  const recent = stats.solveSessions.slice(0, 5);
  stats.avgSolveTime = recent.reduce((s, r) => s + r.solveTime, 0) / recent.length;

  if (!stats.fastestSolve || session.solveTime < stats.fastestSolve) {
    stats.fastestSolve = session.solveTime;
  }

  // Adaptive difficulty logic
  stats.currentDifficulty = computeNextDifficulty(stats);

  await AsyncStorage.setItem(STORAGE_KEYS.STATS, JSON.stringify(stats));
  return stats;
}

// If avg solve time < 30s → harder. If > 90s → easier.
export function computeNextDifficulty(stats) {
  if (stats.solveSessions.length < 3) return stats.currentDifficulty;
  const avg = stats.avgSolveTime / 1000; // to seconds

  if (avg < 30) {
    // Too fast — escalate
    const levels = ['easy', 'medium', 'hard', 'brutal'];
    const idx = levels.indexOf(stats.currentDifficulty);
    return levels[Math.min(idx + 1, levels.length - 1)];
  }
  if (avg > 90) {
    // Too slow / struggling — ease off
    const levels = ['easy', 'medium', 'hard', 'brutal'];
    const idx = levels.indexOf(stats.currentDifficulty);
    return levels[Math.max(idx - 1, 0)];
  }
  return stats.currentDifficulty;
}

// ─── Settings ─────────────────────────────────────────────────────────────────

export async function getSettings() {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEYS.SETTINGS);
    return raw ? JSON.parse(raw) : getDefaultSettings();
  } catch {
    return getDefaultSettings();
  }
}

function getDefaultSettings() {
  return {
    psychoAudio: true,        // use panning/stereo tricks for louder perception
    hapticFeedback: true,
    keepScreenOn: true,
  };
}

export async function saveSettings(settings) {
  await AsyncStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
}
