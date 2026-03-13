import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  Animated, Vibration, Keyboard, Alert, StatusBar,
  Dimensions,
} from 'react-native';
import { Camera } from 'expo-camera';
import * as KeepAwake from 'expo-keep-awake';
import { COLORS, SPACING, RADIUS, MATH_DIFFICULTY } from '../utils/constants';
import { generateMathChallenge, generateBrutalChain, checkAnswer, formatSolveTime } from '../utils/mathChallenge';
import { startAlarm, stopAlarm, pulseHaptic } from '../utils/audioEngine';
import { recordSolveSession, getStats, getSettings } from '../store/alarmStore';

const { width, height } = Dimensions.get('window');

// Pulsing ring animation component
function PulsingRing({ color }) {
  const scale = useRef(new Animated.Value(1)).current;
  const opacity = useRef(new Animated.Value(0.6)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.parallel([
        Animated.sequence([
          Animated.timing(scale, { toValue: 1.5, duration: 800, useNativeDriver: true }),
          Animated.timing(scale, { toValue: 1, duration: 800, useNativeDriver: true }),
        ]),
        Animated.sequence([
          Animated.timing(opacity, { toValue: 0, duration: 800, useNativeDriver: true }),
          Animated.timing(opacity, { toValue: 0.6, duration: 800, useNativeDriver: true }),
        ]),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, []);

  return (
    <Animated.View style={[
      styles.pulseRing,
      { borderColor: color, transform: [{ scale }], opacity }
    ]} />
  );
}

// Math challenge phase
function MathPhase({ alarm, difficulty, onSolved }) {
  const [problems, setProblems] = useState([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [input, setInput] = useState('');
  const [startTime] = useState(Date.now());
  const [wrong, setWrong] = useState(false);
  const shakeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const probs = difficulty === 'brutal'
      ? generateBrutalChain()
      : generateMathChallenge(difficulty);
    setProblems(probs);
  }, []);

  const shake = () => {
    setWrong(true);
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 10, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 10, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 60, useNativeDriver: true }),
    ]).start(() => setWrong(false));
    Vibration.vibrate([0, 80, 80, 80]);
  };

  const handleSubmit = () => {
    if (!problems[currentIdx]) return;
    const correct = checkAnswer(input, problems[currentIdx].answer);
    if (correct) {
      setInput('');
      if (currentIdx + 1 >= problems.length) {
        const solveTime = Date.now() - startTime;
        onSolved(solveTime);
      } else {
        setCurrentIdx(idx => idx + 1);
      }
    } else {
      shake();
      setInput('');
    }
  };

  if (!problems.length) return null;
  const problem = problems[currentIdx];
  const progress = currentIdx / problems.length;

  return (
    <View style={styles.challengeContainer}>
      <Text style={styles.challengeLabel}>MATH CHALLENGE</Text>
      <Text style={styles.challengeSubLabel}>
        Problem {currentIdx + 1} of {problems.length}
      </Text>
      <View style={styles.progressBar}>
        <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
      </View>

      <Animated.View style={[styles.problemBox, { transform: [{ translateX: shakeAnim }] }]}>
        <Text style={styles.problemText}>{problem?.display} = ?</Text>
      </Animated.View>

      <TextInput
        style={[styles.answerInput, wrong && styles.answerInputWrong]}
        value={input}
        onChangeText={setInput}
        keyboardType="number-pad"
        placeholder="Your answer"
        placeholderTextColor={COLORS.textDim}
        returnKeyType="done"
        onSubmitEditing={handleSubmit}
        autoFocus
        selectionColor={COLORS.cyan}
      />

      <TouchableOpacity style={styles.solveBtn} onPress={handleSubmit} activeOpacity={0.8}>
        <Text style={styles.solveBtnTxt}>SUBMIT →</Text>
      </TouchableOpacity>

      <Text style={styles.difficultyTag}>
        {MATH_DIFFICULTY[difficulty]?.label?.toUpperCase()} MODE
      </Text>
    </View>
  );
}

// Photo challenge phase
function PhotoPhase({ alarm, onSolved }) {
  const [permission, requestPermission] = Camera.useCameraPermissions();
  const [photoTaken, setPhotoTaken] = useState(false);
  const [startTime] = useState(Date.now());
  const cameraRef = useRef(null);

  const handleCapture = async () => {
    if (!cameraRef.current) return;
    try {
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.5 });
      setPhotoTaken(true);
      // In production: use ML Kit or Claude vision API to verify the object
      // For now: trust the user took the photo (they had to get up!)
      setTimeout(() => {
        const solveTime = Date.now() - startTime;
        onSolved(solveTime);
      }, 800);
    } catch (e) {
      console.warn('Camera error', e);
    }
  };

  if (!permission) return null;
  if (!permission.granted) {
    return (
      <View style={styles.challengeContainer}>
        <Text style={styles.problemText}>Camera access needed</Text>
        <TouchableOpacity style={styles.solveBtn} onPress={requestPermission}>
          <Text style={styles.solveBtnTxt}>Grant Access</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.challengeContainer}>
      <Text style={styles.challengeLabel}>PHOTO MISSION</Text>
      <Text style={styles.challengeSubLabel}>
        Find and photograph:
      </Text>
      <View style={styles.objectBox}>
        <Text style={styles.objectName}>📍 {alarm.challenge.photoObjectName || 'Your alarm object'}</Text>
        {alarm.challenge.photoObjectHint ? (
          <Text style={styles.objectHint}>Hint: {alarm.challenge.photoObjectHint}</Text>
        ) : null}
      </View>

      <Camera
        ref={cameraRef}
        style={styles.camera}
        facing="back"
      />

      <TouchableOpacity
        style={[styles.captureBtn, photoTaken && styles.captureBtnDone]}
        onPress={handleCapture}
        disabled={photoTaken}
        activeOpacity={0.8}
      >
        <Text style={styles.captureBtnTxt}>
          {photoTaken ? '✓ GOT IT!' : '📸 TAKE PHOTO'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

// Main active alarm screen
export default function ActiveAlarmScreen({ route, navigation }) {
  const { alarm } = route.params || {};
  const [phase, setPhase] = useState('alarm'); // 'alarm' | 'math' | 'photo' | 'done'
  const [stats, setStats] = useState(null);
  const [mathSolveTime, setMathSolveTime] = useState(0);
  const [totalSolveTime, setTotalSolveTime] = useState(0);
  const [difficulty, setDifficulty] = useState(alarm?.challenge?.difficulty || 'medium');
  const bgOpacity = useRef(new Animated.Value(0)).current;
  const alarmTime = useRef(Date.now());

  useEffect(() => {
    KeepAwake.activateKeepAwakeAsync('alarm');
    (async () => {
      const s = await getStats();
      setStats(s);
      setDifficulty(s.currentDifficulty || alarm?.challenge?.difficulty || 'medium');
      const settings = await getSettings();
      startAlarm(alarm, settings);
    })();

    Animated.timing(bgOpacity, { toValue: 1, duration: 500, useNativeDriver: true }).start();

    return () => {
      KeepAwake.deactivateKeepAwake('alarm');
      stopAlarm();
    };
  }, []);

  const handleMathSolved = useCallback(async (solveTime) => {
    setMathSolveTime(solveTime);
    if (alarm.challenge.type === 'both') {
      setPhase('photo');
    } else {
      await finishAlarm(solveTime);
    }
  }, [alarm]);

  const handlePhotoSolved = useCallback(async (photoTime) => {
    const total = mathSolveTime + photoTime;
    await finishAlarm(total);
  }, [mathSolveTime]);

  const finishAlarm = async (solveTime) => {
    stopAlarm();
    const totalTime = Date.now() - alarmTime.current;
    await recordSolveSession({
      date: new Date().toISOString(),
      solveTime,
      totalTime,
      difficulty,
      challenge: alarm.challenge.type,
    });
    setTotalSolveTime(solveTime);
    setPhase('done');
    Vibration.cancel();
  };

  const startChallenge = () => {
    stopAlarm(); // Stop audio during challenge (less stressful, but still must solve)
    pulseHaptic(2);
    if (alarm.challenge.type === 'photo') setPhase('photo');
    else setPhase('math');
  };

  const profileColors = {
    gentle: COLORS.cyan,
    intense: COLORS.accent,
    military: COLORS.yellow,
    custom: COLORS.green,
  };
  const accentColor = profileColors[alarm?.soundProfile] || COLORS.accent;

  if (phase === 'done') {
    return (
      <View style={[styles.container, styles.doneContainer]}>
        <StatusBar barStyle="light-content" />
        <Text style={styles.doneIcon}>🎯</Text>
        <Text style={styles.doneTitle}>YOU'RE UP</Text>
        <Text style={styles.doneTime}>{formatSolveTime(totalSolveTime)}</Text>
        <Text style={styles.doneLabel}>solve time</Text>
        <TouchableOpacity style={styles.doneBtn} onPress={() => navigation.navigate('Home')}>
          <Text style={styles.doneBtnTxt}>Close</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (phase === 'math') {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" />
        <MathPhase alarm={alarm} difficulty={difficulty} onSolved={handleMathSolved} />
      </View>
    );
  }

  if (phase === 'photo') {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" />
        <PhotoPhase alarm={alarm} onSolved={handlePhotoSolved} />
      </View>
    );
  }

  // Main alarm ringing phase
  return (
    <Animated.View style={[styles.container, { opacity: bgOpacity }]}>
      <StatusBar barStyle="light-content" />

      <View style={styles.alarmRingContainer}>
        <PulsingRing color={accentColor} />
        <PulsingRing color={accentColor} />
        <View style={[styles.alarmCircle, { borderColor: accentColor }]}>
          <Text style={styles.alarmIcon}>⏰</Text>
        </View>
      </View>

      <View style={styles.alarmInfo}>
        <Text style={styles.alarmTimeText}>
          {(alarm?.hour % 12 || 12).toString().padStart(2, '0')}:
          {(alarm?.minute || 0).toString().padStart(2, '0')}
          <Text style={styles.alarmAmpm}> {alarm?.hour < 12 ? 'AM' : 'PM'}</Text>
        </Text>
        <Text style={styles.alarmLabel}>{alarm?.label || 'Wake Up'}</Text>
      </View>

      <View style={styles.challengePreview}>
        <Text style={styles.challengePreviewTxt}>
          {alarm?.challenge?.type === 'photo'
            ? `📸 Find: ${alarm.challenge.photoObjectName}`
            : alarm?.challenge?.type === 'both'
            ? '🧮 Math + 📸 Photo challenge'
            : `🧮 ${MATH_DIFFICULTY[difficulty]?.label} math challenge`
          }
        </Text>
      </View>

      <TouchableOpacity style={[styles.dismissBtn, { backgroundColor: accentColor }]} onPress={startChallenge} activeOpacity={0.85}>
        <Text style={styles.dismissBtnTxt}>START CHALLENGE →</Text>
      </TouchableOpacity>

      <View style={styles.dismissHint}>
        <Text style={styles.dismissHintTxt}>
          {alarm?.challenge?.type === 'photo'
            ? 'Find and photograph the object to turn off the alarm.'
            : alarm?.challenge?.type === 'both'
            ? 'Solve math + take a photo to turn off the alarm.'
            : 'Solve a math problem to turn off the alarm.'
          }
        </Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg, alignItems: 'center', justifyContent: 'center' },

  // Alarm ring phase
  alarmRingContainer: { alignItems: 'center', justifyContent: 'center', marginBottom: SPACING.xl },
  pulseRing: {
    position: 'absolute',
    width: 180, height: 180,
    borderRadius: 90,
    borderWidth: 2,
  },
  alarmCircle: {
    width: 120, height: 120, borderRadius: 60,
    borderWidth: 2,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: COLORS.bgCard,
  },
  alarmIcon: { fontSize: 48 },

  alarmInfo: { alignItems: 'center', marginBottom: SPACING.xl },
  alarmTimeText: {
    fontSize: 72, fontWeight: '100', color: COLORS.text, letterSpacing: -2,
  },
  alarmAmpm: { fontSize: 28, fontWeight: '300', color: COLORS.textSecondary },
  alarmLabel: { fontSize: 18, color: COLORS.textSecondary, letterSpacing: 2, marginTop: 4 },

  challengePreview: {
    backgroundColor: COLORS.bgElevated, borderRadius: RADIUS.lg,
    paddingHorizontal: SPACING.lg, paddingVertical: SPACING.sm,
    marginBottom: SPACING.xl, borderWidth: 1, borderColor: COLORS.border,
  },
  challengePreviewTxt: { fontSize: 14, color: COLORS.textSecondary },

  dismissBtn: {
    paddingHorizontal: SPACING.xxl, paddingVertical: SPACING.md,
    borderRadius: RADIUS.full,
    shadowOpacity: 0.5, shadowRadius: 20, shadowOffset: { width: 0, height: 4 },
    elevation: 12,
  },
  dismissBtnTxt: { fontSize: 18, fontWeight: '800', color: COLORS.white, letterSpacing: 3 },
  dismissHint: {
    marginTop: SPACING.md,
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.sm,
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    maxWidth: 280,
    alignItems: 'center',
  },
  dismissHintTxt: {
    fontSize: 13, color: COLORS.textSecondary, textAlign: 'center', lineHeight: 18,
  },
  noSnooze: { fontSize: 12, color: COLORS.textDim, marginTop: SPACING.md, letterSpacing: 1 },

  // Challenge phases
  challengeContainer: {
    flex: 1, width: '100%', padding: SPACING.xl,
    justifyContent: 'center', alignItems: 'center',
  },
  challengeLabel: {
    fontSize: 12, fontWeight: '800', letterSpacing: 4,
    color: COLORS.accent, marginBottom: 4,
  },
  challengeSubLabel: {
    fontSize: 14, color: COLORS.textSecondary, marginBottom: SPACING.lg,
  },
  progressBar: {
    width: '100%', height: 3, backgroundColor: COLORS.bgElevated,
    borderRadius: 2, marginBottom: SPACING.xl,
  },
  progressFill: {
    height: 3, backgroundColor: COLORS.cyan, borderRadius: 2,
  },
  problemBox: {
    backgroundColor: COLORS.bgCard, borderRadius: RADIUS.xl,
    padding: SPACING.xl, marginBottom: SPACING.xl,
    borderWidth: 1, borderColor: COLORS.border,
    width: '100%', alignItems: 'center',
  },
  problemText: {
    fontSize: 40, fontWeight: '200', color: COLORS.text,
    letterSpacing: -1, fontVariant: ['tabular-nums'],
    fontFamily: 'Courier New',
  },
  answerInput: {
    width: '100%', fontSize: 32, fontWeight: '300', color: COLORS.text,
    textAlign: 'center', borderBottomWidth: 2, borderBottomColor: COLORS.cyan,
    paddingVertical: SPACING.sm, marginBottom: SPACING.lg,
    fontFamily: 'Courier New',
  },
  answerInputWrong: { borderBottomColor: COLORS.accent },
  solveBtn: {
    backgroundColor: COLORS.cyan + '20', borderWidth: 1.5, borderColor: COLORS.cyan,
    borderRadius: RADIUS.full, paddingHorizontal: SPACING.xl, paddingVertical: SPACING.md,
    marginBottom: SPACING.md,
  },
  solveBtnTxt: { fontSize: 15, fontWeight: '800', color: COLORS.cyan, letterSpacing: 3 },
  difficultyTag: { fontSize: 10, color: COLORS.textDim, letterSpacing: 3 },

  // Photo phase
  objectBox: {
    backgroundColor: COLORS.bgCard, borderRadius: RADIUS.lg,
    padding: SPACING.lg, marginBottom: SPACING.lg, width: '100%',
    borderWidth: 1, borderColor: COLORS.yellow + '50',
    alignItems: 'center',
  },
  objectName: { fontSize: 20, fontWeight: '700', color: COLORS.yellow, textAlign: 'center' },
  objectHint: { fontSize: 13, color: COLORS.textSecondary, marginTop: 6, textAlign: 'center' },
  camera: {
    width: width - SPACING.xl * 2, height: (width - SPACING.xl * 2) * 0.75,
    borderRadius: RADIUS.lg, overflow: 'hidden',
    marginBottom: SPACING.lg,
  },
  captureBtn: {
    backgroundColor: COLORS.yellow + '20', borderWidth: 1.5, borderColor: COLORS.yellow,
    borderRadius: RADIUS.full, paddingHorizontal: SPACING.xl, paddingVertical: SPACING.md,
  },
  captureBtnDone: { borderColor: COLORS.green, backgroundColor: COLORS.green + '20' },
  captureBtnTxt: { fontSize: 15, fontWeight: '800', color: COLORS.yellow, letterSpacing: 2 },

  // Done phase
  doneContainer: { gap: 8 },
  doneIcon: { fontSize: 64, marginBottom: SPACING.md },
  doneTitle: { fontSize: 36, fontWeight: '900', color: COLORS.text, letterSpacing: 4 },
  doneTime: { fontSize: 56, fontWeight: '100', color: COLORS.green, letterSpacing: -2 },
  doneLabel: { fontSize: 13, color: COLORS.textSecondary, letterSpacing: 2 },
  doneBtn: {
    marginTop: SPACING.xl, paddingHorizontal: SPACING.xl, paddingVertical: SPACING.md,
    borderRadius: RADIUS.full, borderWidth: 1, borderColor: COLORS.border,
    backgroundColor: COLORS.bgCard,
  },
  doneBtnTxt: { fontSize: 15, color: COLORS.text, fontWeight: '600' },
});
