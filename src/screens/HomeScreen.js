import React, { useCallback, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Switch, StatusBar, Animated,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { COLORS, SPACING, RADIUS } from '../utils/constants';
import { useAlarms } from '../hooks/useAlarms';
import { createDefaultAlarm } from '../store/alarmStore';
import { Swipeable } from 'react-native-gesture-handler';

function formatTime(hour, minute) {
  const h = hour % 12 || 12;
  const m = minute.toString().padStart(2, '0');
  const ampm = hour < 12 ? 'AM' : 'PM';
  return { time: `${h}:${m}`, ampm };
}

function dayLabel(day) {
  return ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'][day];
}

function getDaysText(days) {
  if (!days || days.length === 0) return 'No days set';
  if (days.length === 7) return 'Every day';
  const sorted = [...days].sort((a, b) => a - b);
  if (JSON.stringify(sorted) === JSON.stringify([1,2,3,4,5])) return 'Weekdays';
  if (JSON.stringify(sorted) === JSON.stringify([0,6])) return 'Weekends';
  return sorted.map(dayLabel).join(' · ');
}

// Toast notification component
function Toast({ message, visible }) {
  if (!visible) return null;
  return (
    <View style={toastStyles.container}>
      <Text style={toastStyles.text}>{message}</Text>
    </View>
  );
}

const toastStyles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 110,
    alignSelf: 'center',
    backgroundColor: COLORS.bgElevated,
    borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
    zIndex: 100,
  },
  text: { color: COLORS.text, fontSize: 14, fontWeight: '600' },
});

function AlarmCard({ alarm, onToggle, onDelete, onPress, onTest }) {
  const { time, ampm } = formatTime(alarm.hour, alarm.minute);
  const profile = { gentle: '🌅', intense: '⚡', military: '🚨', custom: '🎵' }[alarm.soundProfile] || '⚡';
  const challenge = { math: '🧮', photo: '📸', both: '💀' }[alarm.challenge?.type] || '🧮';

  const renderRightActions = () => (
    <View style={styles.swipeActions}>
      <TouchableOpacity style={styles.testBtn} onPress={() => onTest(alarm)}>
        <Text style={styles.testBtnTxt}>▶ Test</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.deleteBtn} onPress={() => onDelete(alarm.id)}>
        <Text style={styles.deleteTxt}>Delete</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <Swipeable renderRightActions={renderRightActions}>
      <TouchableOpacity
        style={[styles.card, !alarm.enabled && styles.cardDim]}
        onPress={onPress}
        activeOpacity={0.8}
      >
        <View style={styles.cardLeft}>
          <View style={styles.timeRow}>
            <Text style={[styles.timeText, !alarm.enabled && styles.dimText]}>{time}</Text>
            <Text style={[styles.ampmText, !alarm.enabled && styles.dimText]}>{ampm}</Text>
          </View>
          <Text style={[styles.labelText, !alarm.enabled && styles.dimText]}>{alarm.label}</Text>
          <Text style={styles.metaText}>{getDaysText(alarm.days)}</Text>
          <View style={styles.badgeRow}>
            <View style={styles.badge}><Text style={styles.badgeTxt}>{profile}</Text></View>
            <View style={styles.badge}><Text style={styles.badgeTxt}>{challenge}</Text></View>
            {alarm.remTrick && (
              <View style={[styles.badge, styles.remBadge]}>
                <Text style={styles.badgeTxt}>💤 REM</Text>
              </View>
            )}
          </View>
        </View>
        <Switch
          value={alarm.enabled}
          onValueChange={() => onToggle(alarm.id)}
          trackColor={{ false: COLORS.bgElevated, true: COLORS.accent + '60' }}
          thumbColor={alarm.enabled ? COLORS.accent : COLORS.textDim}
          ios_backgroundColor={COLORS.bgElevated}
        />
      </TouchableOpacity>
    </Swipeable>
  );
}

export default function HomeScreen({ navigation }) {
  const { alarms, load, toggle, remove } = useAlarms();
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMsg, setToastMsg] = useState('');

  useFocusEffect(useCallback(() => {
    load();
    // Show save toast if we came back from EditAlarm with a flag
  }, [load]));

  // Show a toast for 2 seconds
  const showToast = (msg) => {
    setToastMsg(msg);
    setToastVisible(true);
    setTimeout(() => setToastVisible(false), 2000);
  };

  const handleToggle = async (id) => {
    await toggle(id);
    const alarm = alarms.find(a => a.id === id);
    showToast(alarm?.enabled ? '⏰ Alarm disabled' : '⏰ Alarm enabled');
  };

  const handleDelete = async (id) => {
    await remove(id);
    showToast('🗑 Alarm deleted');
  };

  const handleTest = (alarm) => {
    navigation.navigate('ActiveAlarm', { alarm });
  };

  // Fire a quick test alarm with current settings for instant testing
  const handleQuickTest = () => {
    const testAlarm = createDefaultAlarm({
      id: 'test-' + Date.now(),
      label: 'TEST ALARM',
      soundProfile: 'intense',
      challenge: { type: 'math', difficulty: 'medium' },
    });
    navigation.navigate('ActiveAlarm', { alarm: testAlarm });
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.bg} />

      <View style={styles.header}>
        <View>
          <Text style={styles.appName}>WAKEFORCE</Text>
          <Text style={styles.subtitle}>
            {alarms.filter(a => a.enabled).length} alarm
            {alarms.filter(a => a.enabled).length !== 1 ? 's' : ''} active
          </Text>
        </View>
        <View style={styles.headerButtons}>
          <TouchableOpacity style={styles.iconBtn} onPress={() => navigation.navigate('Stats')}>
            <Text style={styles.iconBtnTxt}>📊</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconBtn} onPress={() => navigation.navigate('Settings')}>
            <Text style={styles.iconBtnTxt}>⚙️</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Dev test banner */}
      <TouchableOpacity style={styles.testBanner} onPress={handleQuickTest} activeOpacity={0.8}>
        <Text style={styles.testBannerIcon}>⚡</Text>
        <View>
          <Text style={styles.testBannerTitle}>Quick Test Alarm</Text>
          <Text style={styles.testBannerSub}>Tap to fire alarm screen instantly</Text>
        </View>
        <Text style={styles.testBannerArrow}>→</Text>
      </TouchableOpacity>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        {alarms.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>⏰</Text>
            <Text style={styles.emptyText}>No alarms yet</Text>
            <Text style={styles.emptySubtext}>Tap + to create your first alarm</Text>
          </View>
        ) : (
          <>
            <Text style={styles.swipeHint}>← Swipe left to test or delete</Text>
            {alarms.map(alarm => (
              <AlarmCard
                key={alarm.id}
                alarm={alarm}
                onToggle={handleToggle}
                onDelete={handleDelete}
                onPress={() => navigation.navigate('EditAlarm', { alarmId: alarm.id })}
                onTest={handleTest}
              />
            ))}
          </>
        )}
        <View style={{ height: 100 }} />
      </ScrollView>

      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('EditAlarm', { alarmId: null })}
        activeOpacity={0.85}
      >
        <Text style={styles.fabIcon}>+</Text>
      </TouchableOpacity>

      <Toast message={toastMsg} visible={toastVisible} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingTop: 60,
    paddingBottom: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  appName: {
    fontSize: 28, fontWeight: '900', color: COLORS.text, letterSpacing: 6,
  },
  subtitle: { fontSize: 12, color: COLORS.textSecondary, letterSpacing: 1, marginTop: 2 },
  headerButtons: { flexDirection: 'row', gap: 8 },
  iconBtn: {
    width: 44, height: 44, borderRadius: RADIUS.full,
    backgroundColor: COLORS.bgElevated, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: COLORS.border,
  },
  iconBtnTxt: { fontSize: 20 },

  // Dev test banner
  testBanner: {
    flexDirection: 'row', alignItems: 'center',
    margin: SPACING.md, padding: SPACING.md,
    backgroundColor: COLORS.cyan + '15',
    borderRadius: RADIUS.lg,
    borderWidth: 1, borderColor: COLORS.cyan + '40',
    gap: SPACING.sm,
  },
  testBannerIcon: { fontSize: 24 },
  testBannerTitle: { fontSize: 14, fontWeight: '700', color: COLORS.cyan },
  testBannerSub: { fontSize: 11, color: COLORS.textSecondary, marginTop: 1 },
  testBannerArrow: { marginLeft: 'auto', fontSize: 18, color: COLORS.cyan },

  swipeHint: {
    fontSize: 11, color: COLORS.textDim, textAlign: 'center',
    marginBottom: SPACING.sm, letterSpacing: 0.5,
  },

  scroll: { flex: 1 },
  scrollContent: { padding: SPACING.md },

  empty: { alignItems: 'center', marginTop: 60 },
  emptyIcon: { fontSize: 56, marginBottom: SPACING.md },
  emptyText: { fontSize: 20, fontWeight: '700', color: COLORS.text, marginBottom: 8 },
  emptySubtext: { fontSize: 14, color: COLORS.textSecondary },

  card: {
    backgroundColor: COLORS.bgCard, borderRadius: RADIUS.lg,
    padding: SPACING.lg, marginBottom: SPACING.sm,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    borderWidth: 1, borderColor: COLORS.border,
  },
  cardDim: { opacity: 0.5 },
  cardLeft: { flex: 1 },

  timeRow: { flexDirection: 'row', alignItems: 'baseline', gap: 6 },
  timeText: { fontSize: 48, fontWeight: '200', color: COLORS.text, letterSpacing: -1 },
  ampmText: { fontSize: 16, color: COLORS.textSecondary, fontWeight: '500' },
  dimText: { color: COLORS.textDim },

  labelText: { fontSize: 14, fontWeight: '600', color: COLORS.text, marginTop: 2 },
  metaText: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },

  badgeRow: { flexDirection: 'row', gap: 6, marginTop: SPACING.sm },
  badge: {
    backgroundColor: COLORS.bgElevated, borderRadius: RADIUS.sm,
    paddingHorizontal: 8, paddingVertical: 3,
    borderWidth: 1, borderColor: COLORS.border,
  },
  remBadge: { borderColor: COLORS.cyan + '60' },
  badgeTxt: { fontSize: 11, color: COLORS.textSecondary },

  swipeActions: { flexDirection: 'row', marginBottom: SPACING.sm },
  testBtn: {
    backgroundColor: COLORS.cyan,
    justifyContent: 'center', alignItems: 'center',
    width: 80, borderRadius: 0,
    borderTopLeftRadius: RADIUS.lg, borderBottomLeftRadius: RADIUS.lg,
  },
  testBtnTxt: { color: COLORS.black, fontWeight: '700', fontSize: 12 },
  deleteBtn: {
    backgroundColor: COLORS.accent,
    justifyContent: 'center', alignItems: 'center',
    width: 80,
    borderTopRightRadius: RADIUS.lg, borderBottomRightRadius: RADIUS.lg,
  },
  deleteTxt: { color: COLORS.white, fontWeight: '700', fontSize: 13 },

  fab: {
    position: 'absolute', bottom: 32, right: 24,
    width: 64, height: 64, borderRadius: RADIUS.full,
    backgroundColor: COLORS.accent,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: COLORS.accent, shadowOpacity: 0.6,
    shadowRadius: 20, shadowOffset: { width: 0, height: 4 },
    elevation: 12,
  },
  fabIcon: { fontSize: 32, color: COLORS.white, fontWeight: '200', marginTop: -2 },
});
